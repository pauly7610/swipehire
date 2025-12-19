import { base44 } from '@/api/base44Client';

/**
 * Automatic Candidate Evaluation System
 * Triggers on application submission - ranks candidates without blocking any
 */

const EVALUATION_PROMPT = `You are acting as a senior recruiter making a submission recommendation to a hiring manager.
Assess the candidate resume provided against the job description provided.

Your evaluation must be strict and calibrated. Assume that no candidate below an 8.5 out of 10 should be submitted as a primary candidate.
If the difference between a 5 and a 7 is unclear, your scoring is not precise enough.

Do not be generous. Do not assume potential.
Score only on demonstrated experience and evidence in the resume.

Use clear, concise, manager-ready language.
No fluff. No filler.

Provide your response in the following JSON structure:
{
  "score": <number 0-10>,
  "verdict": "<1-2 sentence verdict with fit range: Core fit, Adjacent fit, Stretch fit, or Misaligned>",
  "fit_range": "<core_fit|adjacent_fit|stretch_fit|misaligned>",
  "alignment_highlights": ["<bullet 1>", "<bullet 2>", ...],
  "gaps_concerns": ["<concern 1>", "<concern 2>", ...]
}`;

/**
 * Evaluate a candidate application using AI
 */
export async function evaluateApplication(applicationId) {
  try {
    // Get application details
    const [application] = await base44.entities.Application.filter({ id: applicationId });
    if (!application) {
      console.error('Application not found:', applicationId);
      return null;
    }

    // Get candidate, job, and company details
    const [candidate, job] = await Promise.all([
      base44.entities.Candidate.filter({ id: application.candidate_id }),
      base44.entities.Job.filter({ id: application.job_id })
    ]);

    if (!candidate[0] || !job[0]) {
      console.error('Missing candidate or job data');
      return null;
    }

    const candidateData = candidate[0];
    const jobData = job[0];

    // Build evaluation context
    const candidateContext = `
CANDIDATE PROFILE:
Name: ${candidateData.headline || 'Not specified'}
Bio: ${candidateData.bio || 'Not specified'}
Skills: ${candidateData.skills?.join(', ') || 'Not specified'}
Experience Level: ${candidateData.experience_level || 'Not specified'}
Current Company: ${candidateData.current_company || 'Not specified'}
Location: ${candidateData.location || 'Not specified'}

EXPERIENCE:
${candidateData.experience?.map(exp => `
- ${exp.title} at ${exp.company} (${exp.start_date} - ${exp.end_date || 'Present'})
  ${exp.description || ''}
`).join('\n') || 'No experience listed'}

EDUCATION:
${candidateData.education?.map(edu => `
- ${edu.degree} in ${edu.major} from ${edu.university} (${edu.graduation_year})
  ${edu.gpa ? `GPA: ${edu.gpa}` : ''}
`).join('\n') || 'No education listed'}

CERTIFICATIONS:
${candidateData.certifications?.map(cert => `
- ${cert.name} from ${cert.issuer} (${cert.issue_date})
`).join('\n') || 'No certifications listed'}

RESUME: ${candidateData.resume_url || 'Not provided'}
VIDEO INTRO: ${candidateData.video_intro_url ? 'Provided' : 'Not provided'}
${candidateData.video_transcript ? `Transcript: ${candidateData.video_transcript}` : ''}
`;

    const jobContext = `
JOB DESCRIPTION:
Title: ${jobData.title}
Description: ${jobData.description}
Location: ${jobData.location || 'Remote'}
Job Type: ${jobData.job_type || 'Full-time'}
Seniority: ${jobData.seniority || 'Not specified'}

REQUIRED SKILLS: ${jobData.skills_required?.join(', ') || 'Not specified'}
NICE-TO-HAVE SKILLS: ${jobData.skills_preferred?.join(', ') || 'None'}

REQUIREMENTS:
${jobData.requirements?.map(req => `- ${req}`).join('\n') || 'Not specified'}

RESPONSIBILITIES:
${jobData.responsibilities?.map(resp => `- ${resp}`).join('\n') || 'Not specified'}

SALARY RANGE: $${jobData.salary_min || '?'} - $${jobData.salary_max || '?'}
`;

    // Call AI for evaluation
    const evaluation = await base44.integrations.Core.InvokeLLM({
      prompt: `${EVALUATION_PROMPT}

${candidateContext}

${jobContext}

Provide a strict, evidence-based evaluation.`,
      response_json_schema: {
        type: 'object',
        properties: {
          score: { type: 'number' },
          verdict: { type: 'string' },
          fit_range: { type: 'string', enum: ['core_fit', 'adjacent_fit', 'stretch_fit', 'misaligned'] },
          alignment_highlights: { type: 'array', items: { type: 'string' } },
          gaps_concerns: { type: 'array', items: { type: 'string' } }
        },
        required: ['score', 'verdict', 'fit_range', 'alignment_highlights', 'gaps_concerns']
      }
    });

    // Store evaluation
    const candidateEvaluation = await base44.entities.CandidateEvaluation.create({
      application_id: applicationId,
      candidate_id: application.candidate_id,
      job_id: application.job_id,
      score: evaluation.score,
      verdict: evaluation.verdict,
      fit_range: evaluation.fit_range,
      alignment_highlights: evaluation.alignment_highlights,
      gaps_concerns: evaluation.gaps_concerns,
      resume_version: candidateData.resume_url || null,
      job_description_snapshot: jobData.description,
      generated_at: new Date().toISOString()
    });

    // Update application rankings for this job
    await updateJobRankings(application.job_id);

    return candidateEvaluation;
  } catch (error) {
    console.error('Failed to evaluate application:', error);
    return null;
  }
}

/**
 * Update rankings for all applications to a specific job
 */
export async function updateJobRankings(jobId) {
  try {
    // Get all applications for this job
    const applications = await base44.entities.Application.filter({ job_id: jobId });
    
    // Get evaluations for these applications
    const evaluations = await base44.entities.CandidateEvaluation.filter({ job_id: jobId });
    
    // Create a map of application_id -> evaluation
    const evalMap = {};
    evaluations.forEach(eval => {
      evalMap[eval.application_id] = eval;
    });

    // Score and sort applications
    const scoredApps = applications
      .map(app => ({
        ...app,
        evaluation: evalMap[app.id],
        score: evalMap[app.id]?.score || 0,
        fit_range: evalMap[app.id]?.fit_range || 'misaligned'
      }))
      .sort((a, b) => {
        // Sort by score first
        if (b.score !== a.score) return b.score - a.score;
        
        // Then by fit range priority
        const fitPriority = { core_fit: 4, adjacent_fit: 3, stretch_fit: 2, misaligned: 1 };
        return (fitPriority[b.fit_range] || 0) - (fitPriority[a.fit_range] || 0);
      });

    // Delete existing rankings
    const existingRankings = await base44.entities.ApplicationRanking.filter({ job_id: jobId });
    await Promise.all(existingRankings.map(r => base44.entities.ApplicationRanking.delete(r.id)));

    // Create new rankings
    for (let i = 0; i < scoredApps.length; i++) {
      const app = scoredApps[i];
      await base44.entities.ApplicationRanking.create({
        job_id: jobId,
        application_id: app.id,
        candidate_id: app.candidate_id,
        rank: i + 1,
        score: app.score,
        fit_range: app.fit_range,
        last_updated: new Date().toISOString()
      });
    }

    return scoredApps.length;
  } catch (error) {
    console.error('Failed to update job rankings:', error);
    return 0;
  }
}

/**
 * Get ranked candidates for a job
 */
export async function getRankedCandidates(jobId) {
  try {
    const rankings = await base44.entities.ApplicationRanking.filter({ job_id: jobId }, 'rank', 100);
    
    // Fetch full data for each ranking
    const enrichedRankings = await Promise.all(
      rankings.map(async (ranking) => {
        const [application, candidate, evaluation] = await Promise.all([
          base44.entities.Application.filter({ id: ranking.application_id }),
          base44.entities.Candidate.filter({ id: ranking.candidate_id }),
          base44.entities.CandidateEvaluation.filter({ application_id: ranking.application_id })
        ]);

        return {
          ...ranking,
          application: application[0],
          candidate: candidate[0],
          evaluation: evaluation[0]
        };
      })
    );

    return enrichedRankings;
  } catch (error) {
    console.error('Failed to get ranked candidates:', error);
    return [];
  }
}
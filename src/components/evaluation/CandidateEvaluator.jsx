import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, CheckCircle, TrendingUp, AlertTriangle, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const EVALUATION_PROMPT = `You are acting as a senior recruiter making a submission recommendation to a hiring manager.
Assess the candidate resume provided against the job description provided.

Your evaluation must be strict and calibrated. Assume that no candidate below an 8.5 out of 10 should be submitted as a primary candidate.
If the difference between a 5 and a 7 is unclear, your scoring is not precise enough.

Do not be generous. Do not assume potential.
Score only on demonstrated experience and evidence in the resume.

Use clear, concise, manager-ready language.
No fluff. No filler.

Output your evaluation in the following JSON format:
{
  "score": <number 0-10>,
  "verdict": "<1-2 sentence verdict including fit range: Strong fit/Moderate fit/Not recommended and Core fit/Adjacent fit/Stretch fit/Misaligned>",
  "fit_range": "<core_fit|adjacent_fit|stretch_fit|misaligned>",
  "alignment_highlights": ["<bullet point 1>", "<bullet point 2>", ...],
  "gaps_concerns": ["<gap 1>", "<gap 2>", ...]
}`;

export async function evaluateCandidate(application, candidate, job) {
  try {
    // Build resume context
    let resumeContext = '';
    
    if (candidate.resume_url) {
      resumeContext += `Resume URL: ${candidate.resume_url}\n\n`;
    }
    
    resumeContext += `Candidate: ${candidate.headline || 'No title'}\n`;
    resumeContext += `Bio: ${candidate.bio || 'Not provided'}\n\n`;
    
    if (candidate.skills?.length > 0) {
      resumeContext += `Skills: ${candidate.skills.join(', ')}\n\n`;
    }
    
    if (candidate.experience?.length > 0) {
      resumeContext += `Experience:\n`;
      candidate.experience.forEach(exp => {
        resumeContext += `- ${exp.title} at ${exp.company} (${exp.start_date} - ${exp.end_date || 'Present'})\n`;
        if (exp.description) {
          resumeContext += `  ${exp.description.replace(/<[^>]*>/g, '').substring(0, 200)}...\n`;
        }
      });
      resumeContext += `\n`;
    }
    
    if (candidate.education?.length > 0) {
      resumeContext += `Education:\n`;
      candidate.education.forEach(edu => {
        resumeContext += `- ${edu.degree} in ${edu.major} from ${edu.university}\n`;
      });
      resumeContext += `\n`;
    }

    // Build job context
    const jobContext = `
Job Title: ${job.title}
Company: ${job.company_id}
Location: ${job.location || 'Not specified'}
Experience Level: ${job.experience_level || 'Not specified'}

Description:
${job.description || 'Not provided'}

Requirements:
${job.requirements || 'Not specified'}

Responsibilities:
${job.responsibilities || 'Not specified'}
`;

    const fullPrompt = `${EVALUATION_PROMPT}

=== RESUME ===
${resumeContext}

=== JOB DESCRIPTION ===
${jobContext}

Provide your evaluation in JSON format as specified above.`;

    // Call LLM
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: fullPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          score: { type: "number" },
          verdict: { type: "string" },
          fit_range: { 
            type: "string",
            enum: ["core_fit", "adjacent_fit", "stretch_fit", "misaligned"]
          },
          alignment_highlights: {
            type: "array",
            items: { type: "string" }
          },
          gaps_concerns: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    // Store evaluation
    const evaluation = await base44.entities.CandidateEvaluation.create({
      application_id: application.id,
      candidate_id: candidate.id,
      job_id: job.id,
      score: result.score,
      verdict: result.verdict,
      fit_range: result.fit_range,
      alignment_highlights: result.alignment_highlights || [],
      gaps_concerns: result.gaps_concerns || [],
      resume_version: candidate.resume_url,
      job_description_snapshot: job.description,
      generated_at: new Date().toISOString()
    });

    return evaluation;
  } catch (error) {
    console.error('Evaluation failed:', error);
    throw error;
  }
}

export async function rankApplicationsForJob(jobId) {
  try {
    // Get all applications and evaluations for this job
    const [applications, evaluations] = await Promise.all([
      base44.entities.Application.filter({ job_id: jobId }),
      base44.entities.CandidateEvaluation.filter({ job_id: jobId })
    ]);

    // Create eval map
    const evalMap = {};
    evaluations.forEach(e => {
      evalMap[e.application_id] = e;
    });

    // Sort applications by score (desc) and fit range
    const fitRankOrder = {
      core_fit: 1,
      adjacent_fit: 2,
      stretch_fit: 3,
      misaligned: 4
    };

    const ranked = applications
      .map(app => ({
        app,
        eval: evalMap[app.id]
      }))
      .filter(item => item.eval) // Only ranked apps with evaluations
      .sort((a, b) => {
        if (b.eval.score !== a.eval.score) {
          return b.eval.score - a.eval.score;
        }
        return fitRankOrder[a.eval.fit_range] - fitRankOrder[b.eval.fit_range];
      });

    // Delete existing rankings
    const existingRankings = await base44.entities.ApplicationRanking.filter({ job_id: jobId });
    await Promise.all(existingRankings.map(r => base44.entities.ApplicationRanking.delete(r.id)));

    // Create new rankings
    const rankings = await Promise.all(
      ranked.map((item, index) =>
        base44.entities.ApplicationRanking.create({
          job_id: jobId,
          application_id: item.app.id,
          candidate_id: item.app.candidate_id,
          rank: index + 1,
          score: item.eval.score,
          fit_range: item.eval.fit_range,
          last_updated: new Date().toISOString()
        })
      )
    );

    return rankings;
  } catch (error) {
    console.error('Ranking failed:', error);
    throw error;
  }
}

export default function CandidateEvaluator({ application, candidate, job, onEvaluated }) {
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState(null);

  const handleEvaluate = async () => {
    setEvaluating(true);
    setError(null);

    try {
      const evaluation = await evaluateCandidate(application, candidate, job);
      await rankApplicationsForJob(job.id);
      
      if (onEvaluated) {
        onEvaluated(evaluation);
      }
    } catch (err) {
      setError(err.message);
    }

    setEvaluating(false);
  };

  return (
    <div>
      <Button
        onClick={handleEvaluate}
        disabled={evaluating}
        className="w-full swipe-gradient text-white"
      >
        {evaluating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Evaluating Candidate...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 mr-2" />
            Run AI Evaluation
          </>
        )}
      </Button>

      {error && (
        <Alert className="mt-3" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
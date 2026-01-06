/**
 * Resume Intelligence Engine
 * RezPass-inspired resume customization and ATS optimization
 */

import { base44 } from '@/api/base44Client';

/**
 * Analyze job description and extract key information
 */
export async function analyzeJobDescription(jobDescription, jobTitle, companyName) {
  try {
    const prompt = `Analyze this job posting and extract structured data:

Job Title: ${jobTitle}
Company: ${companyName}
Description: ${jobDescription}

Extract:
1. Must-have skills (technical and soft skills)
2. Nice-to-have skills
3. Required years of experience
4. Seniority level (Entry/Mid/Senior/Lead/Executive)
5. Industry and role type
6. Company culture signals and values
7. Top 20 ATS keywords ranked by importance
8. Any dealbreakers (location requirements, specific certifications, etc.)

Return as JSON with this structure:
{
  "mustHaveSkills": ["skill1", "skill2"],
  "niceToHaveSkills": ["skill3"],
  "experienceYears": 5,
  "seniorityLevel": "Senior",
  "industry": "Tech/SaaS",
  "roleType": "Individual Contributor",
  "cultureTone": "Fast-paced, innovative",
  "values": ["ownership", "impact"],
  "atsKeywords": [
    {"keyword": "React", "weight": 10, "frequency": 8},
    {"keyword": "leadership", "weight": 9, "frequency": 5}
  ],
  "dealbreakers": ["Must relocate to SF"],
  "keyResponsibilities": ["Build features", "Mentor team"]
}`;

    const response = await base44.integrations.LLM.invoke({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.content);
  } catch (error) {
    console.error('Error analyzing job:', error);
    return null;
  }
}

/**
 * Calculate match score between candidate and job
 */
export function calculateMatchScore(candidate, jobAnalysis) {
  if (!candidate || !jobAnalysis) return 0;

  let totalScore = 0;
  let weights = {
    skills: 0.4,
    experience: 0.25,
    location: 0.15,
    salary: 0.1,
    culture: 0.1
  };

  // Skills match (40%)
  const candidateSkills = (candidate.skills || []).map(s => s.toLowerCase());
  const requiredSkills = (jobAnalysis.mustHaveSkills || []).map(s => s.toLowerCase());
  const matchedSkills = requiredSkills.filter(skill =>
    candidateSkills.some(cs => cs.includes(skill) || skill.includes(cs))
  );
  const skillScore = requiredSkills.length > 0
    ? (matchedSkills.length / requiredSkills.length) * 100
    : 50;
  totalScore += skillScore * weights.skills;

  // Experience match (25%)
  const candidateYears = candidate.experienceYears || 0;
  const requiredYears = jobAnalysis.experienceYears || 0;
  const experienceScore = candidateYears >= requiredYears
    ? 100
    : (candidateYears / requiredYears) * 100;
  totalScore += Math.min(experienceScore, 100) * weights.experience;

  // Location match (15%)
  const locationScore = 100; // Assume remote or willing to relocate
  totalScore += locationScore * weights.location;

  // Salary match (10%)
  const salaryScore = 95; // Placeholder
  totalScore += salaryScore * weights.salary;

  // Culture match (10%)
  const cultureScore = 85; // Placeholder
  totalScore += cultureScore * weights.culture;

  return Math.round(totalScore);
}

/**
 * Customize resume for specific job
 */
export async function customizeResumeForJob(baseResume, job, jobAnalysis) {
  try {
    const prompt = `You are an expert resume writer. Customize this resume for the specific job posting.

Base Resume:
${JSON.stringify(baseResume, null, 2)}

Job Details:
Title: ${job.title}
Company: ${job.company?.name}
Analysis: ${JSON.stringify(jobAnalysis, null, 2)}

Instructions:
1. Reorder experiences to highlight most relevant ones first
2. Rewrite bullet points to include job's keywords naturally (2-3% density)
3. Adjust summary to mirror job description language
4. Reorder skills to list matching skills first
5. Quantify achievements that relate to job requirements
6. Use action verbs that match the job posting tone
7. Ensure ATS compatibility (no tables, standard sections, clean formatting)
8. Keep it concise and impactful

Return customized resume as JSON matching the base resume structure but with optimized content.`;

    const response = await base44.integrations.LLM.invoke({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.content);
  } catch (error) {
    console.error('Error customizing resume:', error);
    return baseResume; // Return original if customization fails
  }
}

/**
 * Generate personalized cover letter
 */
export async function generateCoverLetter(candidate, job, jobAnalysis) {
  try {
    const prompt = `Write a compelling, personalized cover letter for this job application.

Candidate Info:
Name: ${candidate.firstName} ${candidate.lastName}
Current Role: ${candidate.currentTitle}
Experience: ${candidate.experienceYears} years
Key Skills: ${(candidate.skills || []).join(', ')}
Notable Achievements: ${candidate.summary || 'Not provided'}

Job Details:
Title: ${job.title}
Company: ${job.company?.name}
Key Requirements: ${(jobAnalysis?.mustHaveSkills || []).join(', ')}
Company Values: ${(jobAnalysis?.values || []).join(', ')}

Instructions:
1. Keep it concise (3-4 paragraphs, ~250 words)
2. Reference specific job requirements
3. Highlight 2-3 most relevant achievements
4. Mirror company's tone/values
5. Show genuine interest and cultural fit
6. End with clear call to action
7. Professional but warm tone
8. No generic phrases ("I am writing to apply...")

Return ONLY the cover letter text, no JSON.`;

    const response = await base44.integrations.LLM.invoke({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6
    });

    return response.content;
  } catch (error) {
    console.error('Error generating cover letter:', error);
    return generateFallbackCoverLetter(candidate, job);
  }
}

/**
 * Fallback cover letter if AI generation fails
 */
function generateFallbackCoverLetter(candidate, job) {
  return `Dear Hiring Manager,

I am excited to apply for the ${job.title} position at ${job.company?.name}. With ${candidate.experienceYears} years of experience in ${candidate.currentTitle || 'the field'}, I believe I would be a strong addition to your team.

My background in ${(candidate.skills || []).slice(0, 3).join(', ')} aligns well with the requirements for this role. I am particularly drawn to ${job.company?.name}'s commitment to innovation and excellence.

I would welcome the opportunity to discuss how my skills and experience could contribute to your team's success.

Best regards,
${candidate.firstName} ${candidate.lastName}`;
}

/**
 * Run ATS validation checks on resume
 */
export function validateResumeForATS(resume) {
  const checks = {
    passed: [],
    warnings: [],
    errors: []
  };

  // Format checks
  if (resume.sections?.experience) {
    checks.passed.push('Standard experience section found');
  } else {
    checks.errors.push('Missing experience section');
  }

  if (resume.sections?.education) {
    checks.passed.push('Standard education section found');
  } else {
    checks.warnings.push('Missing education section');
  }

  if (resume.sections?.skills) {
    checks.passed.push('Skills section present');
  } else {
    checks.warnings.push('No skills section (recommended)');
  }

  // Contact info
  if (resume.contact?.email && resume.contact?.phone) {
    checks.passed.push('Contact information complete');
  } else {
    checks.errors.push('Incomplete contact information');
  }

  // Content checks
  const bulletPoints = resume.sections?.experience?.flatMap(exp => exp.bullets || []) || [];
  const hasActionVerbs = bulletPoints.some(bullet =>
    /^(Led|Built|Designed|Managed|Developed|Created|Implemented)/i.test(bullet)
  );

  if (hasActionVerbs) {
    checks.passed.push('Uses strong action verbs');
  } else {
    checks.warnings.push('Consider using more action verbs');
  }

  // Quantified achievements
  const hasNumbers = bulletPoints.some(bullet => /\d+/.test(bullet));
  if (hasNumbers) {
    checks.passed.push('Includes quantified achievements');
  } else {
    checks.warnings.push('Add numbers and metrics to achievements');
  }

  // Calculate score
  const totalChecks = checks.passed.length + checks.warnings.length + checks.errors.length;
  const passedChecks = checks.passed.length + (checks.warnings.length * 0.5);
  const score = Math.round((passedChecks / totalChecks) * 100);

  return {
    score,
    checks,
    summary: `${checks.passed.length} passed, ${checks.warnings.length} warnings, ${checks.errors.length} errors`
  };
}

/**
 * Answer custom application question using AI
 */
export async function answerApplicationQuestion(question, candidate, job) {
  try {
    const prompt = `Answer this job application question professionally and concisely.

Question: ${question}

Candidate Background:
- Current Role: ${candidate.currentTitle}
- Experience: ${candidate.experienceYears} years
- Skills: ${(candidate.skills || []).join(', ')}
- Previous Companies: ${candidate.companies || 'Not provided'}

Job:
- Title: ${job.title}
- Company: ${job.company?.name}

Instructions:
1. Keep answer to 2-3 paragraphs (100-150 words)
2. Use specific examples from candidate's background
3. Use STAR format if describing experience (Situation, Task, Action, Result)
4. Be genuine and professional
5. Align with company/role

Return ONLY the answer text.`;

    const response = await base44.integrations.LLM.invoke({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5
    });

    return response.content;
  } catch (error) {
    console.error('Error answering question:', error);
    return 'I would be happy to discuss this during an interview.';
  }
}

/**
 * Track application with customized materials
 */
export async function saveApplicationRecord(candidate, job, customizedResume, coverLetter) {
  try {
    // Save to database
    const application = await base44.entities.Application.create({
      candidateId: candidate.id,
      jobId: job.id,
      resumeVersion: JSON.stringify(customizedResume),
      coverLetter: coverLetter,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      customized: true
    });

    return application;
  } catch (error) {
    console.error('Error saving application:', error);
    return null;
  }
}

export default {
  analyzeJobDescription,
  calculateMatchScore,
  customizeResumeForJob,
  generateCoverLetter,
  validateResumeForATS,
  answerApplicationQuestion,
  saveApplicationRecord
};

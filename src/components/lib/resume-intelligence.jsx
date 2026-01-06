/**
 * Resume Intelligence Engine
 * AI-powered job matching and analysis
 */

/**
 * Analyze job description and extract key requirements
 */
export async function analyzeJobDescription(description, title, companyName) {
  // Simulated AI analysis - in production would call LLM
  // Extract key information from job description
  
  return {
    requiredSkills: extractSkills(description),
    experienceLevel: extractExperienceLevel(description, title),
    keyResponsibilities: extractResponsibilities(description),
    companyInfo: {
      name: companyName,
      culture: extractCultureKeywords(description),
    },
  };
}

/**
 * Calculate match score between candidate and job
 */
export function calculateMatchScore(candidate, jobAnalysis) {
  if (!candidate || !jobAnalysis) return 75;

  let score = 0;
  let factors = 0;

  // Skills match (40% weight)
  if (candidate.skills && jobAnalysis.requiredSkills) {
    const candidateSkills = candidate.skills.map(s => 
      typeof s === 'string' ? s.toLowerCase() : s.skill?.toLowerCase()
    );
    const requiredSkills = jobAnalysis.requiredSkills.map(s => s.toLowerCase());
    
    const matchedSkills = requiredSkills.filter(req => 
      candidateSkills.some(cand => cand.includes(req) || req.includes(cand))
    );
    
    const skillScore = requiredSkills.length > 0 
      ? (matchedSkills.length / requiredSkills.length) * 100 
      : 50;
    
    score += skillScore * 0.4;
    factors++;
  }

  // Experience level match (30% weight)
  if (candidate.experience_level && jobAnalysis.experienceLevel) {
    const levels = ['entry', 'mid', 'senior', 'lead', 'executive'];
    const candLevel = levels.indexOf(candidate.experience_level);
    const jobLevel = levels.indexOf(jobAnalysis.experienceLevel);
    
    if (candLevel >= 0 && jobLevel >= 0) {
      const diff = Math.abs(candLevel - jobLevel);
      const expScore = Math.max(0, 100 - (diff * 25));
      score += expScore * 0.3;
      factors++;
    }
  }

  // Location match (15% weight)
  if (candidate.location) {
    const locationScore = 80; // Default good score
    score += locationScore * 0.15;
    factors++;
  }

  // Default baseline (15% weight)
  score += 75 * 0.15;
  factors++;

  return Math.round(Math.min(100, score));
}

// Helper functions
function extractSkills(text) {
  // Simple skill extraction - in production would use NLP
  const commonSkills = [
    'javascript', 'react', 'python', 'java', 'typescript',
    'node', 'sql', 'aws', 'docker', 'kubernetes',
    'agile', 'scrum', 'git', 'ci/cd', 'api'
  ];
  
  const foundSkills = [];
  const lowerText = text.toLowerCase();
  
  commonSkills.forEach(skill => {
    if (lowerText.includes(skill)) {
      foundSkills.push(skill);
    }
  });
  
  return foundSkills;
}

function extractExperienceLevel(description, title) {
  const text = (description + ' ' + title).toLowerCase();
  
  if (text.includes('senior') || text.includes('lead')) return 'senior';
  if (text.includes('junior') || text.includes('entry')) return 'entry';
  if (text.includes('principal') || text.includes('staff')) return 'lead';
  if (text.includes('executive') || text.includes('director')) return 'executive';
  
  return 'mid';
}

function extractResponsibilities(description) {
  // Simple extraction - would use AI in production
  return description.split('\n').filter(line => 
    line.trim().length > 10 && line.trim().length < 200
  ).slice(0, 5);
}

function extractCultureKeywords(description) {
  const keywords = ['innovative', 'collaborative', 'fast-paced', 'flexible', 'remote'];
  const found = [];
  const lowerText = description.toLowerCase();
  
  keywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      found.push(keyword);
    }
  });
  
  return found;
}
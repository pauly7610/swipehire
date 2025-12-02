import { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

export function useAIMatching() {
  const [loading, setLoading] = useState(false);

  const calculateMatchScore = useCallback((candidate, job, company) => {
    let score = 50; // Base score
    const insights = [];
    
    // 1. Skills Match (up to 25 points)
    if (job?.skills_required?.length > 0 && candidate?.skills?.length > 0) {
      const candidateSkillsLower = candidate.skills.map(s => s.toLowerCase());
      const matchingSkills = job.skills_required.filter(skill => 
        candidateSkillsLower.some(cs => 
          cs.includes(skill.toLowerCase()) || skill.toLowerCase().includes(cs)
        )
      );
      const skillMatchPercent = matchingSkills.length / job.skills_required.length;
      const skillPoints = Math.round(skillMatchPercent * 25);
      score += skillPoints;
      
      if (matchingSkills.length > 0) {
        insights.push({
          type: 'skills',
          text: `Matches ${matchingSkills.length}/${job.skills_required.length} required skills`,
          details: matchingSkills.slice(0, 3).join(', ') + (matchingSkills.length > 3 ? '...' : ''),
          score: skillPoints,
          isPositive: true
        });
      }
    }

    // 2. Experience Level Match (up to 20 points)
    if (job?.experience_level_required && candidate?.experience_level) {
      const levels = ['entry', 'mid', 'senior', 'lead', 'executive'];
      const requiredIndex = levels.indexOf(job.experience_level_required);
      const candidateIndex = levels.indexOf(candidate.experience_level);
      
      if (candidateIndex >= requiredIndex) {
        const expPoints = candidateIndex === requiredIndex ? 20 : 15;
        score += expPoints;
        insights.push({
          type: 'experience',
          text: `${candidate.experience_level.charAt(0).toUpperCase() + candidate.experience_level.slice(1)} level matches ${job.experience_level_required} requirement`,
          score: expPoints,
          isPositive: true
        });
      } else if (requiredIndex - candidateIndex === 1) {
        score += 5;
        insights.push({
          type: 'warning',
          text: `Slightly below experience level (${candidate.experience_level} vs ${job.experience_level_required})`,
          isPositive: false
        });
      }
    }

    // 3. Years of Experience (up to 10 points)
    if (job?.experience_years_min && candidate?.experience_years) {
      if (candidate.experience_years >= job.experience_years_min) {
        score += 10;
        insights.push({
          type: 'experience',
          text: `${candidate.experience_years}+ years experience (${job.experience_years_min}+ required)`,
          score: 10,
          isPositive: true
        });
      }
    }

    // 4. Culture Fit (up to 15 points)
    if (company?.culture_traits?.length > 0 && candidate?.culture_preferences?.length > 0) {
      const candidatePrefLower = candidate.culture_preferences.map(p => p.toLowerCase());
      const matchingCulture = company.culture_traits.filter(trait =>
        candidatePrefLower.some(pref => 
          pref.includes(trait.toLowerCase()) || trait.toLowerCase().includes(pref)
        )
      );
      
      if (matchingCulture.length > 0) {
        const culturePoints = Math.min(15, matchingCulture.length * 5);
        score += culturePoints;
        insights.push({
          type: 'culture',
          text: `Culture alignment: ${matchingCulture.join(', ')}`,
          score: culturePoints,
          isPositive: true
        });
      }
    }

    // 5. Location Match (up to 10 points)
    if (job?.location && candidate?.location) {
      const jobLoc = job.location.toLowerCase();
      const candLoc = candidate.location.toLowerCase();
      if (jobLoc.includes(candLoc) || candLoc.includes(jobLoc) || job.job_type === 'remote') {
        score += 10;
        insights.push({
          type: 'location',
          text: job.job_type === 'remote' ? 'Remote position - location flexible' : `Location match: ${candidate.location}`,
          score: 10,
          isPositive: true
        });
      }
    }

    // 6. Job Type Preference (up to 5 points)
    if (candidate?.preferred_job_types?.length > 0 && job?.job_type) {
      if (candidate.preferred_job_types.includes(job.job_type)) {
        score += 5;
        insights.push({
          type: 'highlight',
          text: `Prefers ${job.job_type} positions`,
          score: 5,
          isPositive: true
        });
      }
    }

    // Add a highlight for top candidates
    if (score >= 85) {
      insights.unshift({
        type: 'highlight',
        text: '⭐ Top Match - Highly recommended candidate',
        isPositive: true
      });
    }

    return {
      score: Math.min(99, Math.max(50, score)),
      insights: insights.sort((a, b) => (b.score || 0) - (a.score || 0))
    };
  }, []);

  const checkDealBreakers = useCallback((candidate, job, company) => {
    if (!candidate?.deal_breakers?.length) return { passed: true, violations: [] };
    
    const violations = [];
    
    for (const dealBreaker of candidate.deal_breakers) {
      switch (dealBreaker.type) {
        case 'min_salary':
          if (job?.salary_max && parseInt(dealBreaker.value) > job.salary_max) {
            violations.push({
              type: 'salary',
              text: `Salary below minimum requirement ($${dealBreaker.value})`
            });
          }
          break;
        case 'job_type':
          if (job?.job_type && job.job_type !== dealBreaker.value) {
            violations.push({
              type: 'job_type',
              text: `Not a ${dealBreaker.value} position`
            });
          }
          break;
        case 'location':
          if (job?.location && !job.location.toLowerCase().includes(dealBreaker.value.toLowerCase()) && job.job_type !== 'remote') {
            violations.push({
              type: 'location',
              text: `Location doesn't match preference (${dealBreaker.value})`
            });
          }
          break;
        case 'skill_required':
          if (job?.skills_required && !job.skills_required.some(s => 
            s.toLowerCase().includes(dealBreaker.value.toLowerCase())
          )) {
            violations.push({
              type: 'skill',
              text: `Missing preferred technology: ${dealBreaker.value}`
            });
          }
          break;
        case 'company_size':
          if (company?.size && company.size !== dealBreaker.value) {
            violations.push({
              type: 'company_size',
              text: `Company size (${company.size}) doesn't match preference (${dealBreaker.value})`
            });
          }
          break;
      }
    }

    return {
      passed: violations.length === 0,
      violations
    };
  }, []);

  const getAIInsights = useCallback(async (candidate, job, company) => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this candidate-job match and provide 3 key insights about why they're a good fit:

Candidate:
- Headline: ${candidate.headline || 'N/A'}
- Skills: ${candidate.skills?.join(', ') || 'N/A'}
- Experience Level: ${candidate.experience_level || 'N/A'}
- Years of Experience: ${candidate.experience_years || 'N/A'}
- Culture Preferences: ${candidate.culture_preferences?.join(', ') || 'N/A'}

Job:
- Title: ${job.title}
- Required Skills: ${job.skills_required?.join(', ') || 'N/A'}
- Experience Required: ${job.experience_level_required || 'N/A'}

Company:
- Name: ${company.name}
- Industry: ${company.industry || 'N/A'}
- Culture: ${company.culture_traits?.join(', ') || 'N/A'}

Provide specific, actionable insights.`,
        response_json_schema: {
          type: 'object',
          properties: {
            insights: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  type: { type: 'string', enum: ['skills', 'experience', 'culture', 'highlight'] }
                }
              }
            },
            summary: { type: 'string' }
          }
        }
      });
      setLoading(false);
      return result;
    } catch (error) {
      console.error('AI insights error:', error);
      setLoading(false);
      return null;
    }
  }, []);

  return {
    calculateMatchScore,
    checkDealBreakers,
    getAIInsights,
    loading
  };
}
import { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

// Skill similarity groups for smart matching
const SKILL_GROUPS = {
  'javascript': ['js', 'typescript', 'ts', 'node', 'nodejs', 'react', 'vue', 'angular', 'next.js', 'nextjs'],
  'python': ['django', 'flask', 'fastapi', 'pandas', 'numpy', 'pytorch', 'tensorflow'],
  'java': ['spring', 'springboot', 'kotlin', 'scala'],
  'data': ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'data analysis', 'analytics'],
  'cloud': ['aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s', 'devops'],
  'design': ['figma', 'sketch', 'adobe xd', 'ui', 'ux', 'ui/ux', 'product design'],
  'marketing': ['seo', 'sem', 'google ads', 'facebook ads', 'content marketing', 'digital marketing'],
  'management': ['project management', 'agile', 'scrum', 'jira', 'leadership', 'team management'],
};

export function useAIMatching() {
  const [loading, setLoading] = useState(false);

  // Find related skills using skill groups
  const findRelatedSkills = useCallback((skill) => {
    const skillLower = skill.toLowerCase();
    for (const [group, skills] of Object.entries(SKILL_GROUPS)) {
      if (skills.includes(skillLower) || group === skillLower) {
        return skills;
      }
    }
    return [skillLower];
  }, []);

  // Enhanced matching algorithm with smart scoring
  const calculateMatchScore = useCallback((candidate, job, company, options = {}) => {
    let score = 0;
    const insights = [];
    const weights = {
      skills: 30,
      experience: 20,
      location: 15,
      salary: 15,
      culture: 10,
      education: 5,
      bonus: 5
    };
    
    const { swipeHistory, applicationHistory, connectionData, feedbackHistory } = options;
    
    // 1. SKILLS MATCH (up to 30 points) - Smart matching with related skills
    if (job?.skills_required?.length > 0 && candidate?.skills?.length > 0) {
      const candidateSkillsLower = candidate.skills.map(s => s.toLowerCase());
      let skillPoints = 0;
      const matchedSkills = [];
      const relatedMatches = [];
      
      job.skills_required.forEach(requiredSkill => {
        const reqLower = requiredSkill.toLowerCase();
        const relatedSkills = findRelatedSkills(reqLower);
        
        // Check for exact match
        const exactMatch = candidateSkillsLower.find(cs => cs === reqLower || cs.includes(reqLower) || reqLower.includes(cs));
        if (exactMatch) {
          skillPoints += 6; // Full points for exact match
          matchedSkills.push(requiredSkill);
        } else {
          // Check for related skill match
          const relatedMatch = candidateSkillsLower.find(cs => 
            relatedSkills.some(rs => cs.includes(rs) || rs.includes(cs))
          );
          if (relatedMatch) {
            skillPoints += 3; // Partial points for related skill
            relatedMatches.push(`${requiredSkill} (via ${relatedMatch})`);
          }
        }
      });
      
      const skillScore = Math.min(weights.skills, skillPoints);
      score += skillScore;
      
      if (matchedSkills.length > 0 || relatedMatches.length > 0) {
        insights.push({
          type: 'skills',
          text: `${matchedSkills.length}/${job.skills_required.length} skills match${relatedMatches.length > 0 ? ` (+${relatedMatches.length} related)` : ''}`,
          details: [...matchedSkills.slice(0, 3), ...relatedMatches.slice(0, 2)].join(', '),
          score: skillScore,
          isPositive: skillScore >= weights.skills * 0.5
        });
      } else {
        insights.push({
          type: 'skills',
          text: 'Limited skill overlap',
          score: 0,
          isPositive: false
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

    // 7. Salary Match (up to 10 points) - NEW
    if (candidate?.salary_expectation_min && job?.salary_max) {
      if (job.salary_max >= candidate.salary_expectation_min) {
        score += 10;
        insights.push({
          type: 'salary',
          text: 'Salary range meets expectations',
          score: 10,
          isPositive: true
        });
      } else {
        insights.push({
          type: 'warning',
          text: 'Salary may be below candidate expectations',
          isPositive: false
        });
      }
    }

    // 8. Historical Swipe Pattern Analysis (up to 10 points) - NEW
    if (swipeHistory?.length > 0) {
      const rightSwipes = swipeHistory.filter(s => s.direction === 'right' || s.direction === 'super');
      
      // Analyze patterns from positive swipes
      if (rightSwipes.length >= 3) {
        // Check if this job/candidate matches patterns from successful swipes
        const patternScore = analyzeSwipePatterns(rightSwipes, job, candidate, company);
        if (patternScore > 0) {
          score += patternScore;
          insights.push({
            type: 'pattern',
            text: 'Matches your previous preferences',
            score: patternScore,
            isPositive: true
          });
        }
      }
    }

    // 9. Application Success Rate Boost (up to 5 points) - NEW
    if (applicationHistory?.length > 0) {
      const successfulApps = applicationHistory.filter(a => 
        ['interviewing', 'offered', 'hired'].includes(a.status)
      );
      
      if (successfulApps.length > 0) {
        // Check if similar to successful applications
        const similarToSuccess = successfulApps.some(app => {
          if (!app.job) return false;
          const skillOverlap = job?.skills_required?.some(skill => 
            app.job.skills_required?.includes(skill)
          );
          const sameType = job?.job_type === app.job.job_type;
          return skillOverlap || sameType;
        });
        
        if (similarToSuccess) {
          score += 5;
          insights.push({
            type: 'history',
            text: 'Similar to your successful applications',
            score: 5,
            isPositive: true
          });
        }
      }
    }

    // 10. Connection Network Boost (up to 5 points) - NEW
    if (connectionData?.length > 0 && company) {
      const hasConnectionAtCompany = connectionData.some(conn => 
        conn.company_id === company.id
      );
      if (hasConnectionAtCompany) {
        score += 5;
        insights.push({
          type: 'network',
          text: 'You have connections at this company',
          score: 5,
          isPositive: true
        });
      }
    }

    // Add a highlight for top candidates
    if (score >= 85) {
      insights.unshift({
        type: 'highlight',
        text: '⭐ Top Match - Highly recommended',
        isPositive: true
      });
    } else if (score >= 75) {
      insights.unshift({
        type: 'highlight',
        text: '✨ Strong Match',
        isPositive: true
      });
    }

    return {
      score: Math.min(99, Math.max(50, score)),
      insights: insights.sort((a, b) => (b.score || 0) - (a.score || 0))
    };
  }, []);

  // Analyze patterns from swipe history
  const analyzeSwipePatterns = (rightSwipes, job, candidate, company) => {
    let patternScore = 0;
    
    // This is a simplified pattern analysis
    // In production, this could use ML models
    
    // Count common attributes in positive swipes
    const feedback = rightSwipes.filter(s => s.feedback).map(s => s.feedback);
    
    if (feedback.length > 0) {
      const reasons = feedback.map(f => f.reason);
      const topReason = reasons.sort((a, b) =>
        reasons.filter(v => v === a).length - reasons.filter(v => v === b).length
      ).pop();
      
      // If the top reason matches this job/candidate characteristics
      if (topReason === 'skills_match' && job?.skills_required?.length > 3) patternScore += 5;
      if (topReason === 'salary' && job?.salary_max > 80000) patternScore += 5;
      if (topReason === 'location' && job?.job_type === 'remote') patternScore += 5;
      if (topReason === 'culture' && company?.culture_traits?.length > 2) patternScore += 5;
    }
    
    return Math.min(10, patternScore);
  };

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

  // Rank and sort matches based on score and preferences
  const rankMatches = useCallback((matches, userPreferences = {}) => {
    return matches.sort((a, b) => {
      // Primary sort by score
      let scoreDiff = (b.matchScore || 0) - (a.matchScore || 0);
      
      // Secondary sort by user preferences
      if (Math.abs(scoreDiff) < 5) {
        // If scores are close, use preferences
        if (userPreferences.preferRemote && a.job?.job_type === 'remote') scoreDiff -= 2;
        if (userPreferences.preferRemote && b.job?.job_type === 'remote') scoreDiff += 2;
        
        if (userPreferences.preferHighSalary) {
          scoreDiff += ((b.job?.salary_max || 0) - (a.job?.salary_max || 0)) / 10000;
        }
      }
      
      return scoreDiff;
    });
  }, []);

  return {
    calculateMatchScore,
    checkDealBreakers,
    getAIInsights,
    rankMatches,
    loading
  };
}
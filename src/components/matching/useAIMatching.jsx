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

    // 2. EXPERIENCE MATCH (up to 20 points)
    let expScore = 0;
    if (job?.experience_level_required && candidate?.experience_level) {
      const levels = ['entry', 'mid', 'senior', 'lead', 'executive'];
      const requiredIndex = levels.indexOf(job.experience_level_required);
      const candidateIndex = levels.indexOf(candidate.experience_level);
      
      if (candidateIndex >= requiredIndex) {
        // Perfect or overqualified
        expScore = candidateIndex === requiredIndex ? weights.experience : weights.experience * 0.8;
      } else if (requiredIndex - candidateIndex === 1) {
        // One level below - still considerable
        expScore = weights.experience * 0.4;
      }
    }
    
    // Years of experience bonus
    if (job?.experience_years_min && candidate?.experience_years) {
      if (candidate.experience_years >= job.experience_years_min) {
        expScore = Math.min(weights.experience, expScore + 5);
      } else if (candidate.experience_years >= job.experience_years_min * 0.7) {
        expScore = Math.min(weights.experience, expScore + 2);
      }
    }
    
    score += expScore;
    if (expScore > 0) {
      insights.push({
        type: 'experience',
        text: `${candidate?.experience_level || 'N/A'} level with ${candidate?.experience_years || 0}+ years`,
        score: expScore,
        isPositive: expScore >= weights.experience * 0.6
      });
    }

    // 3. LOCATION MATCH (up to 15 points)
    let locationScore = 0;
    if (job?.job_type === 'remote') {
      locationScore = weights.location; // Full points for remote
      insights.push({
        type: 'location',
        text: 'Remote position - location flexible',
        score: locationScore,
        isPositive: true
      });
    } else if (job?.location && candidate?.location) {
      const jobLoc = job.location.toLowerCase();
      const candLoc = candidate.location.toLowerCase();
      
      if (jobLoc === candLoc || jobLoc.includes(candLoc) || candLoc.includes(jobLoc)) {
        locationScore = weights.location;
        insights.push({
          type: 'location',
          text: `Location match: ${candidate.location}`,
          score: locationScore,
          isPositive: true
        });
      } else {
        // Check same state/region
        const jobState = jobLoc.split(',').pop()?.trim();
        const candState = candLoc.split(',').pop()?.trim();
        if (jobState && candState && jobState === candState) {
          locationScore = weights.location * 0.5;
          insights.push({
            type: 'location',
            text: `Same region: ${candState}`,
            score: locationScore,
            isPositive: true
          });
        }
      }
    }
    score += locationScore;

    // 4. SALARY MATCH (up to 15 points)
    let salaryScore = 0;
    if (job?.salary_min && job?.salary_max && candidate?.salary_expectation_min) {
      const jobMid = (job.salary_min + job.salary_max) / 2;
      const candMin = candidate.salary_expectation_min;
      const candMax = candidate.salary_expectation_max || candMin * 1.3;
      
      if (job.salary_max >= candMin && job.salary_min <= candMax) {
        // Salary ranges overlap
        salaryScore = weights.salary;
        insights.push({
          type: 'salary',
          text: 'Salary expectations align',
          score: salaryScore,
          isPositive: true
        });
      } else if (job.salary_max >= candMin * 0.85) {
        // Close to expectations
        salaryScore = weights.salary * 0.5;
        insights.push({
          type: 'salary',
          text: 'Salary slightly below expectations',
          score: salaryScore,
          isPositive: false
        });
      }
    } else if (!candidate?.salary_expectation_min) {
      // No salary requirements from candidate - neutral
      salaryScore = weights.salary * 0.5;
    }
    score += salaryScore;

    // 5. CULTURE FIT (up to 10 points)
    let cultureScore = 0;
    if (company?.culture_traits?.length > 0 && candidate?.culture_preferences?.length > 0) {
      const candidatePrefLower = candidate.culture_preferences.map(p => p.toLowerCase());
      const companyTraitsLower = company.culture_traits.map(t => t.toLowerCase());
      
      const matchingCulture = companyTraitsLower.filter(trait =>
        candidatePrefLower.some(pref => 
          pref.includes(trait) || trait.includes(pref) ||
          pref.split(' ').some(word => trait.includes(word))
        )
      );
      
      if (matchingCulture.length > 0) {
        cultureScore = Math.min(weights.culture, (matchingCulture.length / company.culture_traits.length) * weights.culture * 1.5);
        insights.push({
          type: 'culture',
          text: `${matchingCulture.length} culture traits align`,
          details: matchingCulture.slice(0, 3).join(', '),
          score: cultureScore,
          isPositive: true
        });
      }
    }
    score += cultureScore;

    // 6. EDUCATION MATCH (up to 5 points)
    let eduScore = 0;
    if (candidate?.education?.length > 0) {
      const hasRelevantDegree = candidate.education.some(edu => {
        const major = edu.major?.toLowerCase() || '';
        const degree = edu.degree?.toLowerCase() || '';
        const jobTitle = job?.title?.toLowerCase() || '';
        const jobSkills = job?.skills_required?.map(s => s.toLowerCase()) || [];
        
        // Check if education relates to job
        return jobSkills.some(skill => major.includes(skill) || skill.includes(major)) ||
               jobTitle.includes(major) || major.includes('computer') || major.includes('engineering');
      });
      
      if (hasRelevantDegree) {
        eduScore = weights.education;
        insights.push({
          type: 'education',
          text: 'Relevant educational background',
          score: eduScore,
          isPositive: true
        });
      }
    }
    score += eduScore;

    // 7. JOB TYPE PREFERENCE BONUS (up to 5 points)
    if (candidate?.preferred_job_types?.length > 0 && job?.job_type) {
      if (candidate.preferred_job_types.includes(job.job_type)) {
        score += weights.bonus;
        insights.push({
          type: 'preference',
          text: `Prefers ${job.job_type} positions`,
          score: weights.bonus,
          isPositive: true
        });
      }
    }

    // 8. HISTORICAL PATTERN ANALYSIS
    if (feedbackHistory?.length > 0) {
      const patternBonus = analyzeUserFeedbackPatterns(feedbackHistory, job, company);
      if (patternBonus > 0) {
        score += patternBonus;
        insights.push({
          type: 'pattern',
          text: 'Matches your past preferences',
          score: patternBonus,
          isPositive: true
        });
      }
    }

    // 9. NETWORK BONUS
    if (connectionData?.length > 0 && company) {
      const hasConnection = connectionData.some(c => c.company_id === company.id);
      if (hasConnection) {
        score += 3;
        insights.push({
          type: 'network',
          text: 'You have connections here',
          score: 3,
          isPositive: true
        });
      }
    }

    // Normalize score to 0-100 range
    const maxPossible = Object.values(weights).reduce((a, b) => a + b, 0) + 8; // +8 for bonuses
    const normalizedScore = Math.round((score / maxPossible) * 100);
    const finalScore = Math.min(99, Math.max(25, normalizedScore));

    // Add tier label
    if (finalScore >= 85) {
      insights.unshift({ type: 'highlight', text: '⭐ Excellent Match', isPositive: true });
    } else if (finalScore >= 70) {
      insights.unshift({ type: 'highlight', text: '✨ Strong Match', isPositive: true });
    } else if (finalScore >= 55) {
      insights.unshift({ type: 'highlight', text: '👍 Good Match', isPositive: true });
    }

    return {
      score: finalScore,
      insights: insights.sort((a, b) => (b.score || 0) - (a.score || 0)),
      breakdown: { skills: score, experience: expScore, location: locationScore, salary: salaryScore, culture: cultureScore }
    };
  }, [findRelatedSkills]);

  // Analyze user feedback patterns to improve matching
  const analyzeUserFeedbackPatterns = useCallback((feedbackHistory, job, company) => {
    if (!feedbackHistory?.length) return 0;
    
    let bonus = 0;
    const positiveFeedback = feedbackHistory.filter(f => f.is_positive);
    const negativeFeedback = feedbackHistory.filter(f => !f.is_positive);
    
    // Analyze positive patterns
    const positiveReasons = positiveFeedback.map(f => f.reason).filter(Boolean);
    const reasonCounts = {};
    positiveReasons.forEach(r => { reasonCounts[r] = (reasonCounts[r] || 0) + 1; });
    
    // Check if current job matches preferred patterns
    if (reasonCounts['skills_match'] >= 2 && job?.skills_required?.length >= 3) bonus += 2;
    if (reasonCounts['salary'] >= 2 && job?.salary_max >= 80000) bonus += 2;
    if (reasonCounts['location'] >= 2 && job?.job_type === 'remote') bonus += 2;
    if (reasonCounts['culture'] >= 2 && company?.culture_traits?.length >= 2) bonus += 2;
    if (reasonCounts['company'] >= 2 && company?.size === '500+') bonus += 1;
    
    // Reduce score if matches negative patterns
    const negativeReasons = negativeFeedback.map(f => f.reason).filter(Boolean);
    const negCounts = {};
    negativeReasons.forEach(r => { negCounts[r] = (negCounts[r] || 0) + 1; });
    
    if (negCounts['salary'] >= 2 && job?.salary_max < 60000) bonus -= 2;
    if (negCounts['location'] >= 2 && job?.job_type !== 'remote') bonus -= 1;
    
    return Math.max(0, Math.min(5, bonus));
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
        prompt: `Analyze this candidate-job match and provide detailed, personalized insights.

CANDIDATE PROFILE:
- Name: ${candidate.user?.full_name || 'Candidate'}
- Current Role: ${candidate.headline || 'N/A'}
- Skills: ${candidate.skills?.join(', ') || 'N/A'}
- Experience Level: ${candidate.experience_level || 'N/A'}
- Years of Experience: ${candidate.experience_years || 'N/A'}
- Education: ${candidate.education?.map(e => `${e.degree} in ${e.major} from ${e.university}`).join('; ') || 'N/A'}
- Recent Experience: ${candidate.experience?.[0] ? `${candidate.experience[0].title} at ${candidate.experience[0].company}` : 'N/A'}
- Culture Preferences: ${candidate.culture_preferences?.join(', ') || 'N/A'}
- Bio: ${candidate.bio || 'N/A'}

JOB DETAILS:
- Title: ${job.title}
- Company: ${company.name}
- Required Skills: ${job.skills_required?.join(', ') || 'N/A'}
- Experience Required: ${job.experience_level_required || 'N/A'} (${job.experience_years_min}+ years)
- Location: ${job.location || 'N/A'}
- Type: ${job.job_type || 'N/A'}
- Salary: $${job.salary_min}-${job.salary_max}
- Key Responsibilities: ${job.responsibilities?.slice(0, 3).join('; ') || 'N/A'}

COMPANY CULTURE:
- Industry: ${company.industry || 'N/A'}
- Size: ${company.size || 'N/A'}
- Culture Traits: ${company.culture_traits?.join(', ') || 'N/A'}
- Benefits: ${company.benefits?.join(', ') || 'N/A'}
- Mission: ${company.mission || 'N/A'}

Provide 3-5 specific, data-driven insights about:
1. Skill alignment (be specific about which skills match)
2. Experience fit and growth potential
3. Culture compatibility 
4. Unique strengths this candidate brings
5. Any concerns or gaps to address

Make insights conversational, actionable, and personalized.`,
        response_json_schema: {
          type: 'object',
          properties: {
            insights: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  type: { type: 'string', enum: ['skills', 'experience', 'culture', 'highlight', 'strength', 'concern'] },
                  details: { type: 'string' }
                }
              }
            },
            summary: { type: 'string' },
            recommendation: { 
              type: 'string',
              enum: ['strong_match', 'good_match', 'potential_match', 'not_recommended']
            },
            key_selling_points: {
              type: 'array',
              items: { type: 'string' }
            }
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

  // Quick match score for card display (synchronous, no API calls)
  const getQuickMatchScore = useCallback((candidate, job, company) => {
    return calculateMatchScore(candidate, job, company, {});
  }, [calculateMatchScore]);

  // Smart candidate ranking with multiple factors
  const smartRankCandidates = useCallback((candidates, job, company, options = {}) => {
    return candidates
      .map(candidate => {
        const { score, insights } = calculateMatchScore(candidate.candidate || candidate, job, company, options);
        return { ...candidate, matchScore: score, matchInsights: insights };
      })
      .sort((a, b) => {
        // Primary: match score
        const scoreDiff = b.matchScore - a.matchScore;
        if (Math.abs(scoreDiff) > 5) return scoreDiff;
        
        // Secondary: experience years
        const expA = a.candidate?.experience_years || a.experience_years || 0;
        const expB = b.candidate?.experience_years || b.experience_years || 0;
        return expB - expA;
      });
  }, [calculateMatchScore]);

  return {
    calculateMatchScore,
    checkDealBreakers,
    getAIInsights,
    rankMatches,
    getQuickMatchScore,
    smartRankCandidates,
    findRelatedSkills,
    loading
  };
}
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, Star, Briefcase, MapPin, DollarSign, 
  Users, Sparkles, AlertTriangle, TrendingUp, Code,
  GraduationCap, Heart, Building2, Zap, ChevronDown, ChevronUp,
  Loader2, Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DetailedMatchInsights({ 
  candidate, 
  job, 
  company, 
  score, 
  insights,
  showDetailed = false 
}) {
  const [expanded, setExpanded] = useState(showDetailed);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Calculate detailed breakdown
  const skillsData = calculateSkillMatch(candidate, job);
  const cultureData = calculateCultureFit(candidate, company);
  const experienceData = calculateExperienceMatch(candidate, job);

  const getAIAnalysis = async () => {
    if (aiAnalysis || loadingAI) return;
    setLoadingAI(true);
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this candidate-job match in detail and provide specific insights:

CANDIDATE PROFILE:
- Name/Headline: ${candidate?.headline || 'Not specified'}
- Skills: ${candidate?.skills?.join(', ') || 'None listed'}
- Experience Level: ${candidate?.experience_level || 'Not specified'}
- Years of Experience: ${candidate?.experience_years || 'Not specified'}
- Bio: ${candidate?.bio || 'Not provided'}
- Culture Preferences: ${candidate?.culture_preferences?.join(', ') || 'None specified'}
- Location: ${candidate?.location || 'Not specified'}

JOB REQUIREMENTS:
- Title: ${job?.title}
- Required Skills: ${job?.skills_required?.join(', ') || 'None specified'}
- Experience Level Required: ${job?.experience_level_required || 'Not specified'}
- Min Years Required: ${job?.experience_years_min || 'Not specified'}
- Job Type: ${job?.job_type || 'Not specified'}
- Location: ${job?.location || 'Not specified'}
- Salary Range: ${job?.salary_min ? `$${job.salary_min} - $${job.salary_max}` : 'Not specified'}

COMPANY INFO:
- Name: ${company?.name}
- Industry: ${company?.industry || 'Not specified'}
- Size: ${company?.size || 'Not specified'}
- Culture Traits: ${company?.culture_traits?.join(', ') || 'None specified'}

Provide a detailed analysis with:
1. Top 3 strengths of this match
2. Top 2 potential concerns or gaps
3. Specific recommendations for the recruiter
4. A brief summary sentence`,
        response_json_schema: {
          type: 'object',
          properties: {
            strengths: {
              type: 'array',
              items: { type: 'string' }
            },
            concerns: {
              type: 'array',
              items: { type: 'string' }
            },
            recommendations: {
              type: 'array',
              items: { type: 'string' }
            },
            summary: { type: 'string' }
          }
        }
      });
      setAiAnalysis(result);
    } catch (err) {
      console.error('AI analysis failed:', err);
    }
    setLoadingAI(false);
  };

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      {/* Header with score */}
      <CardHeader className="pb-2 bg-gradient-to-r from-pink-50 to-orange-50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-500" />
            Match Analysis
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{score}%</div>
              <div className="text-xs text-gray-500">Match Score</div>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              score >= 85 ? 'bg-green-100' : score >= 70 ? 'bg-blue-100' : 'bg-amber-100'
            }`}>
              {score >= 85 ? (
                <Star className="w-6 h-6 text-green-600 fill-green-600" />
              ) : score >= 70 ? (
                <TrendingUp className="w-6 h-6 text-blue-600" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Quick insights */}
        {insights?.slice(0, 3).map((insight, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <CheckCircle2 className={`w-4 h-4 ${insight.isPositive ? 'text-green-500' : 'text-amber-500'}`} />
            <span className="text-sm text-gray-700">{insight.text}</span>
            {insight.score && <Badge variant="secondary" className="text-xs">+{insight.score}</Badge>}
          </div>
        ))}

        {/* Expand button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-2 text-pink-500 hover:bg-pink-50"
        >
          {expanded ? (
            <><ChevronUp className="w-4 h-4 mr-1" /> Show Less</>
          ) : (
            <><ChevronDown className="w-4 h-4 mr-1" /> View Detailed Analysis</>
          )}
        </Button>

        {/* Expanded detailed view */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4 border-t mt-4">
                <Tabs defaultValue="breakdown" className="w-full">
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
                    <TabsTrigger value="skills">Skills</TabsTrigger>
                    <TabsTrigger value="ai" onClick={getAIAnalysis}>AI Insights</TabsTrigger>
                  </TabsList>

                  <TabsContent value="breakdown" className="space-y-4 mt-4">
                    {/* Skills Match */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium flex items-center gap-1">
                          <Code className="w-4 h-4 text-blue-500" /> Skills Match
                        </span>
                        <span className="text-sm font-bold">{skillsData.percentage}%</span>
                      </div>
                      <Progress value={skillsData.percentage} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">
                        {skillsData.matched}/{skillsData.total} required skills matched
                      </p>
                    </div>

                    {/* Culture Fit */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium flex items-center gap-1">
                          <Heart className="w-4 h-4 text-pink-500" /> Culture Fit
                        </span>
                        <span className="text-sm font-bold">{cultureData.percentage}%</span>
                      </div>
                      <Progress value={cultureData.percentage} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">
                        {cultureData.matched} culture traits aligned
                      </p>
                    </div>

                    {/* Experience Alignment */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium flex items-center gap-1">
                          <Briefcase className="w-4 h-4 text-purple-500" /> Experience
                        </span>
                        <span className="text-sm font-bold">{experienceData.percentage}%</span>
                      </div>
                      <Progress value={experienceData.percentage} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">
                        {experienceData.summary}
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="skills" className="mt-4">
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-sm font-medium text-green-700 mb-2">✓ Matching Skills</h5>
                        <div className="flex flex-wrap gap-1">
                          {skillsData.matchingSkills.map(skill => (
                            <Badge key={skill} className="bg-green-100 text-green-700">{skill}</Badge>
                          ))}
                          {skillsData.matchingSkills.length === 0 && (
                            <span className="text-sm text-gray-500">No direct matches</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-amber-700 mb-2">⚠ Missing Skills</h5>
                        <div className="flex flex-wrap gap-1">
                          {skillsData.missingSkills.map(skill => (
                            <Badge key={skill} variant="outline" className="border-amber-300 text-amber-700">{skill}</Badge>
                          ))}
                          {skillsData.missingSkills.length === 0 && (
                            <span className="text-sm text-gray-500">All skills matched!</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-blue-700 mb-2">+ Additional Skills</h5>
                        <div className="flex flex-wrap gap-1">
                          {skillsData.additionalSkills.slice(0, 5).map(skill => (
                            <Badge key={skill} variant="secondary">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="ai" className="mt-4">
                    {loadingAI ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                        <span className="ml-2 text-gray-500">Analyzing match...</span>
                      </div>
                    ) : aiAnalysis ? (
                      <div className="space-y-4">
                        <div>
                          <h5 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                            <Zap className="w-4 h-4" /> Strengths
                          </h5>
                          <ul className="space-y-1">
                            {aiAnalysis.strengths?.map((s, i) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-amber-700 mb-2 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" /> Potential Concerns
                          </h5>
                          <ul className="space-y-1">
                            {aiAnalysis.concerns?.map((c, i) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <h5 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-1">
                            <Brain className="w-4 h-4" /> AI Summary
                          </h5>
                          <p className="text-sm text-gray-700">{aiAnalysis.summary}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Brain className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Click to generate AI analysis</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// Helper functions
function calculateSkillMatch(candidate, job) {
  const requiredSkills = job?.skills_required || [];
  const candidateSkills = candidate?.skills || [];
  const candidateSkillsLower = candidateSkills.map(s => s.toLowerCase());
  
  const matchingSkills = requiredSkills.filter(skill =>
    candidateSkillsLower.some(cs => cs.includes(skill.toLowerCase()) || skill.toLowerCase().includes(cs))
  );
  
  const missingSkills = requiredSkills.filter(skill =>
    !candidateSkillsLower.some(cs => cs.includes(skill.toLowerCase()) || skill.toLowerCase().includes(cs))
  );
  
  const additionalSkills = candidateSkills.filter(skill =>
    !requiredSkills.some(rs => skill.toLowerCase().includes(rs.toLowerCase()) || rs.toLowerCase().includes(skill.toLowerCase()))
  );

  return {
    matched: matchingSkills.length,
    total: requiredSkills.length,
    percentage: requiredSkills.length > 0 ? Math.round((matchingSkills.length / requiredSkills.length) * 100) : 100,
    matchingSkills,
    missingSkills,
    additionalSkills
  };
}

function calculateCultureFit(candidate, company) {
  const companyTraits = company?.culture_traits || [];
  const candidatePrefs = candidate?.culture_preferences || [];
  const candidatePrefsLower = candidatePrefs.map(p => p.toLowerCase());
  
  const matched = companyTraits.filter(trait =>
    candidatePrefsLower.some(pref => pref.includes(trait.toLowerCase()) || trait.toLowerCase().includes(pref))
  );

  return {
    matched: matched.length,
    total: companyTraits.length,
    percentage: companyTraits.length > 0 ? Math.round((matched.length / companyTraits.length) * 100) : 50,
    matchingTraits: matched
  };
}

function calculateExperienceMatch(candidate, job) {
  const levels = ['entry', 'mid', 'senior', 'lead', 'executive'];
  const requiredLevel = job?.experience_level_required;
  const candidateLevel = candidate?.experience_level;
  const requiredYears = job?.experience_years_min || 0;
  const candidateYears = candidate?.experience_years || 0;
  
  let percentage = 50;
  let summary = 'Experience data not available';
  
  if (requiredLevel && candidateLevel) {
    const reqIndex = levels.indexOf(requiredLevel);
    const candIndex = levels.indexOf(candidateLevel);
    
    if (candIndex >= reqIndex) {
      percentage = 100;
      summary = `${candidateLevel.charAt(0).toUpperCase() + candidateLevel.slice(1)} level meets ${requiredLevel} requirement`;
    } else if (reqIndex - candIndex === 1) {
      percentage = 70;
      summary = `Slightly below required level (${candidateLevel} vs ${requiredLevel})`;
    } else {
      percentage = 40;
      summary = `Below required experience level`;
    }
  }
  
  if (candidateYears >= requiredYears && requiredYears > 0) {
    percentage = Math.min(100, percentage + 10);
    summary += ` • ${candidateYears} years experience`;
  }

  return { percentage, summary };
}
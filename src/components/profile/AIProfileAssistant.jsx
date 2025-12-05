import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sparkles, Loader2, FileText, Briefcase, Target, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AIProfileAssistant({ candidate, onUpdate, resumeUrl }) {
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const analyzeProfile = async () => {
    setLoading(true);
    try {
      const prompt = `Analyze this candidate profile and provide comprehensive enhancement suggestions:

Job Title: ${candidate?.headline || 'Not specified'}
Industry: ${candidate?.industry || 'Not specified'}
Current Bio: ${candidate?.bio || 'Not specified'}
Current Skills: ${candidate?.skills?.join(', ') || 'None listed'}
Experience Level: ${candidate?.experience_level || 'Not specified'}
Years of Experience: ${candidate?.experience_years || 'Not specified'}
Location: ${candidate?.location || 'Not specified'}

Based on this information, provide:
1. A list of 10-15 relevant skills they should add (prioritize missing skills for their role)
2. A compelling 2-3 sentence professional summary that highlights their value
3. 5 strategic deal-breakers they should set based on their experience level and industry
4. Suggested experience level if not set
5. Career advancement tips

Return your analysis in the following JSON format:
{
  "skills": ["skill1", "skill2", ...],
  "bio": "Professional summary here",
  "deal_breakers": [
    {"type": "min_salary", "value": "80000", "reason": "explanation"},
    {"type": "job_type", "value": "remote", "reason": "explanation"}
  ],
  "experience_level": "mid/senior/etc",
  "tips": ["tip1", "tip2", "tip3"]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            skills: { type: "array", items: { type: "string" } },
            bio: { type: "string" },
            deal_breakers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  value: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            experience_level: { type: "string" },
            tips: { type: "array", items: { type: "string" } }
          }
        }
      });

      setSuggestions(result);
      setShowSuggestions(true);
    } catch (error) {
      console.error('AI analysis failed:', error);
    }
    setLoading(false);
  };

  const analyzeResume = async () => {
    if (!resumeUrl) return;
    
    setLoading(true);
    try {
      const prompt = `Analyze this resume and extract comprehensive profile information. Extract:
1. Professional skills (technical and soft skills)
2. Work experience (job titles, companies, dates, key achievements)
3. Education (degrees, institutions, graduation years)
4. Certifications
5. A professional summary based on their experience
6. Suggested experience level (entry/mid/senior/lead/executive)
7. Total years of experience
8. Key achievements and projects

Return structured data in JSON format.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [resumeUrl],
        response_json_schema: {
          type: "object",
          properties: {
            skills: { type: "array", items: { type: "string" } },
            experience: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  company: { type: "string" },
                  start_date: { type: "string" },
                  end_date: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            education: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  degree: { type: "string" },
                  major: { type: "string" },
                  university: { type: "string" },
                  graduation_year: { type: "number" }
                }
              }
            },
            certifications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  issuer: { type: "string" },
                  issue_date: { type: "string" }
                }
              }
            },
            bio: { type: "string" },
            experience_level: { type: "string" },
            experience_years: { type: "number" }
          }
        }
      });

      // Auto-populate profile with resume data
      onUpdate({
        skills: [...new Set([...(candidate?.skills || []), ...(result.skills || [])])],
        experience: result.experience || [],
        education: result.education || [],
        certifications: result.certifications || [],
        bio: result.bio || candidate?.bio,
        experience_level: result.experience_level || candidate?.experience_level,
        experience_years: result.experience_years || candidate?.experience_years
      });

    } catch (error) {
      console.error('Resume analysis failed:', error);
    }
    setLoading(false);
  };

  const applySuggestions = (field) => {
    if (!suggestions) return;

    switch (field) {
      case 'skills':
        onUpdate({
          skills: [...new Set([...(candidate?.skills || []), ...suggestions.skills])]
        });
        break;
      case 'bio':
        onUpdate({ bio: suggestions.bio });
        break;
      case 'deal_breakers':
        onUpdate({ deal_breakers: suggestions.deal_breakers });
        break;
      case 'experience_level':
        onUpdate({ experience_level: suggestions.experience_level });
        break;
      case 'all':
        onUpdate({
          skills: [...new Set([...(candidate?.skills || []), ...suggestions.skills])],
          bio: suggestions.bio,
          deal_breakers: suggestions.deal_breakers,
          experience_level: suggestions.experience_level
        });
        break;
    }
  };

  return (
    <>
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI Profile Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {resumeUrl && (
            <Button
              onClick={analyzeResume}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Resume...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Build Profile from Resume
                </>
              )}
            </Button>
          )}

          <Button
            onClick={analyzeProfile}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Get AI Suggestions
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            AI will analyze your profile and suggest improvements
          </p>
        </CardContent>
      </Card>

      {/* Suggestions Dialog */}
      <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              AI Profile Suggestions
            </DialogTitle>
            <DialogDescription>
              Review and apply AI-generated suggestions to enhance your profile
            </DialogDescription>
          </DialogHeader>

          {suggestions && (
            <div className="space-y-6">
              {/* Skills */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Suggested Skills
                  </h3>
                  <Button
                    size="sm"
                    onClick={() => applySuggestions('skills')}
                    className="swipe-gradient"
                  >
                    Add All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.skills?.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Professional Summary
                  </h3>
                  <Button
                    size="sm"
                    onClick={() => applySuggestions('bio')}
                    className="swipe-gradient"
                  >
                    Use This
                  </Button>
                </div>
                <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg">
                  {suggestions.bio}
                </p>
              </div>

              {/* Deal Breakers */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Suggested Deal Breakers
                  </h3>
                  <Button
                    size="sm"
                    onClick={() => applySuggestions('deal_breakers')}
                    className="swipe-gradient"
                  >
                    Apply All
                  </Button>
                </div>
                <div className="space-y-2">
                  {suggestions.deal_breakers?.map((db, i) => (
                    <div key={i} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="font-medium text-sm text-amber-900">
                        {db.type}: {db.value}
                      </p>
                      <p className="text-xs text-amber-700 mt-1">{db.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              {suggestions.experience_level && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Suggested Experience Level</h3>
                    <Button
                      size="sm"
                      onClick={() => applySuggestions('experience_level')}
                      className="swipe-gradient"
                    >
                      Apply
                    </Button>
                  </div>
                  <Badge className="capitalize">{suggestions.experience_level}</Badge>
                </div>
              )}

              {/* Career Tips */}
              {suggestions.tips && (
                <div>
                  <h3 className="font-semibold mb-3">Career Advancement Tips</h3>
                  <ul className="space-y-2">
                    {suggestions.tips.map((tip, i) => (
                      <li key={i} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-purple-500">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Apply All */}
              <Button
                onClick={() => {
                  applySuggestions('all');
                  setShowSuggestions(false);
                }}
                className="w-full swipe-gradient"
              >
                Apply All Suggestions
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
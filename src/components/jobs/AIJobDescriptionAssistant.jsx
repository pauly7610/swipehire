import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Wand2, Copy, Check, AlertTriangle, TrendingUp, Users, Target, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIJobDescriptionAssistant({ jobData, onApply }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('optimize');

  const analyzeJobDescription = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this job posting and provide detailed optimization suggestions:

JOB TITLE: ${jobData.title}
DESCRIPTION: ${jobData.description}
RESPONSIBILITIES: ${jobData.responsibilities?.join(', ') || 'Not specified'}
REQUIREMENTS: ${jobData.requirements?.join(', ') || 'Not specified'}
SKILLS: ${jobData.skills_required?.join(', ') || 'Not specified'}

Provide comprehensive analysis and suggestions for:

1. KEYWORD OPTIMIZATION: Suggest high-impact keywords and phrases that top candidates search for. Include industry-specific terms, technical skills, and trending job market keywords.

2. INCLUSIVITY AUDIT: Identify any language that might exclude qualified candidates (gendered terms, age bias, cultural assumptions). Suggest inclusive alternatives.

3. READABILITY & STRUCTURE: Evaluate clarity, sentence structure, and organization. Suggest improvements.

4. COMPELLING ELEMENTS: What's missing that would attract top talent? Benefits, growth opportunities, company culture highlights?

5. IMPROVED VERSIONS: Provide 2-3 rewritten versions of the description (concise, detailed, creative).

6. COMPETITIVE ANALYSIS: How does this compare to market standards? What makes it stand out (or not)?

Be specific, actionable, and focused on attracting top talent.`,
        response_json_schema: {
          type: 'object',
          properties: {
            overall_score: {
              type: 'number',
              description: 'Score from 0-100'
            },
            keyword_suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  keyword: { type: 'string' },
                  reason: { type: 'string' },
                  priority: { type: 'string', enum: ['high', 'medium', 'low'] }
                }
              }
            },
            inclusivity_issues: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  issue: { type: 'string' },
                  original_text: { type: 'string' },
                  suggested_replacement: { type: 'string' },
                  severity: { type: 'string', enum: ['high', 'medium', 'low'] }
                }
              }
            },
            readability_score: {
              type: 'number',
              description: 'Score from 0-100'
            },
            readability_notes: { type: 'string' },
            missing_elements: {
              type: 'array',
              items: { type: 'string' }
            },
            improved_versions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  style: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            },
            competitive_analysis: { type: 'string' },
            top_recommendations: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      });

      setSuggestions(result);
    } catch (error) {
      console.error('Failed to analyze:', error);
    }
    setLoading(false);
  };

  const generateJobDescription = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a compelling, inclusive, and optimized job description:

JOB TITLE: ${jobData.title}
LOCATION: ${jobData.location || 'Not specified'}
JOB TYPE: ${jobData.job_type || 'Not specified'}
EXPERIENCE LEVEL: ${jobData.experience_level_required || 'Not specified'}
SKILLS REQUIRED: ${jobData.skills_required?.join(', ') || 'Not specified'}
SALARY RANGE: ${jobData.salary_min && jobData.salary_max ? `$${jobData.salary_min} - $${jobData.salary_max}` : 'Not specified'}

Current description: ${jobData.description || 'Not provided'}

Generate:
1. An engaging 2-3 paragraph job description that sells the opportunity
2. 5-7 key responsibilities (action-oriented, specific)
3. 5-7 requirements (must-haves vs nice-to-haves)
4. Compelling benefits section

Use inclusive language, industry keywords, and best practices for attracting top talent. Make it exciting and specific.`,
        response_json_schema: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            responsibilities: {
              type: 'array',
              items: { type: 'string' }
            },
            requirements: {
              type: 'array',
              items: { type: 'string' }
            },
            benefits: {
              type: 'array',
              items: { type: 'string' }
            },
            suggested_keywords: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      });

      setSuggestions({ generated: result });
      setActiveTab('generate');
    } catch (error) {
      console.error('Failed to generate:', error);
    }
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyGenerated = () => {
    if (suggestions?.generated) {
      onApply(suggestions.generated);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Sparkles className="w-5 h-5" />
            AI Job Description Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={generateJobDescription}
              disabled={loading || !jobData.title}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Description
                </>
              )}
            </Button>
            <Button
              onClick={analyzeJobDescription}
              disabled={loading || !jobData.description}
              variant="outline"
              className="flex-1 border-purple-300 hover:bg-purple-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  Analyze & Optimize
                </>
              )}
            </Button>
          </div>

          {!jobData.title && (
            <p className="text-sm text-amber-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Add a job title to get started
            </p>
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {suggestions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Generated Content */}
            {suggestions.generated && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Wand2 className="w-5 h-5 text-purple-500" />
                      AI-Generated Job Description
                    </span>
                    <Button onClick={applyGenerated} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      <Check className="w-4 h-4 mr-2" />
                      Apply All
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {/* Description */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Description</h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(suggestions.generated.description)}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-700 whitespace-pre-wrap">{suggestions.generated.description}</p>
                    </div>
                  </div>

                  {/* Responsibilities */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Key Responsibilities</h3>
                    <ul className="space-y-2">
                      {suggestions.generated.responsibilities?.map((resp, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-gray-700">{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Requirements */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Requirements</h3>
                    <ul className="space-y-2">
                      {suggestions.generated.requirements?.map((req, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-gray-700">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Benefits */}
                  {suggestions.generated.benefits?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Benefits</h3>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.generated.benefits.map((benefit, i) => (
                          <Badge key={i} className="bg-green-100 text-green-700">
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Keywords */}
                  {suggestions.generated.suggested_keywords?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Suggested Keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.generated.suggested_keywords.map((keyword, i) => (
                          <Badge key={i} variant="outline" className="border-purple-200">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Analysis Results */}
            {suggestions.overall_score && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    Job Description Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {/* Overall Score */}
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="#E5E7EB"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke={suggestions.overall_score >= 80 ? '#22C55E' : suggestions.overall_score >= 60 ? '#F59E0B' : '#EF4444'}
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${(suggestions.overall_score / 100) * 251.2} 251.2`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-900">{suggestions.overall_score}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Overall Score</h3>
                      <p className="text-sm text-gray-600">
                        {suggestions.overall_score >= 80 ? 'Excellent job posting!' : suggestions.overall_score >= 60 ? 'Good, with room for improvement' : 'Needs significant optimization'}
                      </p>
                    </div>
                  </div>

                  {/* Top Recommendations */}
                  {suggestions.top_recommendations?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        Top Recommendations
                      </h3>
                      <div className="space-y-2">
                        {suggestions.top_recommendations.map((rec, i) => (
                          <div key={i} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-gray-700">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Keyword Suggestions */}
                  {suggestions.keyword_suggestions?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Keyword Suggestions</h3>
                      <div className="space-y-2">
                        {suggestions.keyword_suggestions.map((kw, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <Badge className={
                              kw.priority === 'high' ? 'bg-red-100 text-red-700' :
                              kw.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }>
                              {kw.priority}
                            </Badge>
                            <div>
                              <p className="font-medium text-gray-900">{kw.keyword}</p>
                              <p className="text-sm text-gray-600">{kw.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inclusivity Issues */}
                  {suggestions.inclusivity_issues?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-500" />
                        Inclusivity Improvements
                      </h3>
                      <div className="space-y-3">
                        {suggestions.inclusivity_issues.map((issue, i) => (
                          <div key={i} className={`p-4 rounded-lg border ${
                            issue.severity === 'high' ? 'bg-red-50 border-red-200' :
                            issue.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                            'bg-blue-50 border-blue-200'
                          }`}>
                            <div className="flex items-start gap-2 mb-2">
                              <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                                issue.severity === 'high' ? 'text-red-500' :
                                issue.severity === 'medium' ? 'text-yellow-500' :
                                'text-blue-500'
                              }`} />
                              <p className="font-medium text-gray-900">{issue.issue}</p>
                            </div>
                            <div className="ml-6 space-y-2 text-sm">
                              <p className="text-gray-600">
                                <span className="font-medium">Original:</span> <span className="line-through">{issue.original_text}</span>
                              </p>
                              <p className="text-gray-600">
                                <span className="font-medium">Suggested:</span> <span className="text-green-700">{issue.suggested_replacement}</span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Elements */}
                  {suggestions.missing_elements?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Missing Elements</h3>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.missing_elements.map((element, i) => (
                          <Badge key={i} variant="outline" className="border-amber-300 text-amber-700">
                            {element}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Improved Versions */}
                  {suggestions.improved_versions?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Alternative Versions</h3>
                      <div className="space-y-3">
                        {suggestions.improved_versions.map((version, i) => (
                          <div key={i} className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                            <div className="flex items-center justify-between mb-2">
                              <Badge className="bg-purple-100 text-purple-700">{version.style}</Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(version.description)}
                              >
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              </Button>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{version.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Competitive Analysis */}
                  {suggestions.competitive_analysis && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Competitive Analysis</h3>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{suggestions.competitive_analysis}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Sparkles, Loader2, CheckCircle2, XCircle, AlertCircle,
  Briefcase, Code, Building2, TrendingUp, Target, FileText
} from 'lucide-react';

export default function ResumeAnalysis({ candidate, user, searchQuery, onClose }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeResume = async () => {
    setLoading(true);
    try {
      const candidateContext = `
        Name: ${user?.full_name || 'Unknown'}
        Headline: ${candidate?.headline || 'N/A'}
        Location: ${candidate?.location || 'N/A'}
        Bio: ${candidate?.bio || 'N/A'}
        Skills: ${candidate?.skills?.join(', ') || 'N/A'}
        Experience Level: ${candidate?.experience_level || 'N/A'}
        Years of Experience: ${candidate?.experience_years || 'N/A'}
        Experience:
        ${candidate?.experience?.map(e => `- ${e.title} at ${e.company} (${e.start_date} - ${e.end_date || 'Present'}): ${e.description || ''}`).join('\n') || 'N/A'}
        Resume URL: ${candidate?.resume_url ? 'Available' : 'Not provided'}
      `;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert technical recruiter analyzing a candidate against specific search criteria.

SEARCH CRITERIA (Boolean Query): "${searchQuery || 'General fit assessment'}"

CANDIDATE PROFILE:
${candidateContext}

Analyze this candidate and provide a structured assessment. Be specific and cite actual details from their profile.

Provide your analysis in the following JSON format:
{
  "title_fit": {
    "score": "strong" | "moderate" | "weak",
    "analysis": "explanation with specific examples from their profile",
    "matching_keywords": ["list", "of", "matching", "terms"]
  },
  "functional_experience": {
    "score": "strong" | "moderate" | "weak",
    "matches": ["specific responsibility 1", "specific responsibility 2"],
    "gaps": ["missing area 1", "missing area 2"]
  },
  "technical_alignment": {
    "score": "strong" | "moderate" | "weak",
    "technologies": ["tech1", "tech2"],
    "tools": ["tool1", "tool2"],
    "missing": ["missing tech if any"]
  },
  "industry_relevance": {
    "score": "strong" | "moderate" | "weak",
    "sectors": ["sector1", "sector2"],
    "analysis": "explanation of industry fit"
  },
  "seniority_signal": {
    "level": "entry" | "mid" | "senior" | "lead" | "executive",
    "years": "X years or N/A",
    "indicators": ["leadership indicator 1", "progression indicator 2"]
  },
  "overall_match": {
    "percentage": 0-100,
    "summary": "One concise line explaining why they align or don't align with the search criteria"
  }
}`,
        response_json_schema: {
          type: "object",
          properties: {
            title_fit: {
              type: "object",
              properties: {
                score: { type: "string" },
                analysis: { type: "string" },
                matching_keywords: { type: "array", items: { type: "string" } }
              }
            },
            functional_experience: {
              type: "object",
              properties: {
                score: { type: "string" },
                matches: { type: "array", items: { type: "string" } },
                gaps: { type: "array", items: { type: "string" } }
              }
            },
            technical_alignment: {
              type: "object",
              properties: {
                score: { type: "string" },
                technologies: { type: "array", items: { type: "string" } },
                tools: { type: "array", items: { type: "string" } },
                missing: { type: "array", items: { type: "string" } }
              }
            },
            industry_relevance: {
              type: "object",
              properties: {
                score: { type: "string" },
                sectors: { type: "array", items: { type: "string" } },
                analysis: { type: "string" }
              }
            },
            seniority_signal: {
              type: "object",
              properties: {
                level: { type: "string" },
                years: { type: "string" },
                indicators: { type: "array", items: { type: "string" } }
              }
            },
            overall_match: {
              type: "object",
              properties: {
                percentage: { type: "number" },
                summary: { type: "string" }
              }
            }
          }
        }
      });

      setAnalysis(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
    setLoading(false);
  };

  const getScoreColor = (score) => {
    if (score === 'strong') return 'bg-green-100 text-green-700';
    if (score === 'moderate') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getScoreIcon = (score) => {
    if (score === 'strong') return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (score === 'moderate') return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  return (
    <div className="space-y-4">
      {!analysis && (
        <div className="text-center py-6">
          <Sparkles className="w-12 h-12 mx-auto mb-3 text-pink-500" />
          <h3 className="font-semibold text-gray-900 mb-2">AI Resume Analysis</h3>
          <p className="text-sm text-gray-500 mb-4">
            Analyze this candidate against your search criteria
            {searchQuery && <span className="block mt-1 font-medium text-pink-600">"{searchQuery}"</span>}
          </p>
          <Button 
            onClick={analyzeResume} 
            disabled={loading}
            className="bg-gradient-to-r from-pink-500 to-orange-500 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Candidate
              </>
            )}
          </Button>
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          {/* Overall Match Score */}
          <div className="bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl p-4 border border-pink-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900">Overall Match</span>
              <span className="text-2xl font-bold text-pink-600">{analysis.overall_match?.percentage}%</span>
            </div>
            <p className="text-sm text-gray-700">{analysis.overall_match?.summary}</p>
          </div>

          {/* Title Fit */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-gray-500" />
                Title Fit
                {getScoreIcon(analysis.title_fit?.score)}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600 mb-2">{analysis.title_fit?.analysis}</p>
              {analysis.title_fit?.matching_keywords?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {analysis.title_fit.matching_keywords.map((kw, i) => (
                    <Badge key={i} className="bg-green-100 text-green-700 text-xs">{kw}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Functional Experience */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-500" />
                Functional Experience
                {getScoreIcon(analysis.functional_experience?.score)}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {analysis.functional_experience?.matches?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-green-700 mb-1">✓ Matching Experience</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {analysis.functional_experience.matches.map((m, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.functional_experience?.gaps?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-red-700 mb-1">✗ Gaps</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {analysis.functional_experience.gaps.map((g, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <XCircle className="w-3 h-3 text-red-500 mt-1 flex-shrink-0" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Technical Alignment */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Code className="w-4 h-4 text-gray-500" />
                Technical & Tool Stack
                {getScoreIcon(analysis.technical_alignment?.score)}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {analysis.technical_alignment?.technologies?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {analysis.technical_alignment.technologies.map((t, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                  ))}
                </div>
              )}
              {analysis.technical_alignment?.tools?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {analysis.technical_alignment.tools.map((t, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                  ))}
                </div>
              )}
              {analysis.technical_alignment?.missing?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {analysis.technical_alignment.missing.map((t, i) => (
                    <Badge key={i} className="bg-red-50 text-red-600 text-xs">Missing: {t}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Industry & Seniority Row */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-0 shadow-sm">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  Industry
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1 mb-2">
                  {analysis.industry_relevance?.sectors?.map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500">{analysis.industry_relevance?.analysis}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  Seniority
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Badge className={getScoreColor(
                  analysis.seniority_signal?.level === 'senior' || analysis.seniority_signal?.level === 'lead' || analysis.seniority_signal?.level === 'executive' 
                    ? 'strong' 
                    : analysis.seniority_signal?.level === 'mid' ? 'moderate' : 'weak'
                )}>
                  {analysis.seniority_signal?.level} • {analysis.seniority_signal?.years}
                </Badge>
                {analysis.seniority_signal?.indicators?.length > 0 && (
                  <ul className="text-xs text-gray-500 mt-2 space-y-1">
                    {analysis.seniority_signal.indicators.slice(0, 2).map((ind, i) => (
                      <li key={i}>• {ind}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Button variant="outline" onClick={() => setAnalysis(null)} className="w-full">
            Re-analyze
          </Button>
        </div>
      )}
    </div>
  );
}
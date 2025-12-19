import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, TrendingUp, Users, Code, Calendar, DollarSign, 
  Zap, AlertTriangle, Lightbulb, Info, Loader2, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CompanyInsightCard({ companyId, jobId, compact = false }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(!compact);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadInsight();
  }, [companyId, jobId]);

  const loadInsight = async () => {
    try {
      const query = jobId 
        ? { company_id: companyId, job_id: jobId }
        : { company_id: companyId, job_id: null };
      
      const [existing] = await base44.entities.CompanyInsight.filter(query);
      
      if (existing) {
        setInsight(existing);
      } else {
        // Generate new insight
        await generateInsight();
      }
    } catch (error) {
      console.error('Failed to load insight:', error);
    }
    setLoading(false);
  };

  const generateInsight = async () => {
    setGenerating(true);
    try {
      const [company] = await base44.entities.Company.filter({ id: companyId });
      let job = null;
      if (jobId) {
        [job] = await base44.entities.Job.filter({ id: jobId });
      }

      const prompt = `Analyze this ${jobId ? 'job and company' : 'company'} and provide strategic insights for job seekers:

Company: ${company?.name || 'Unknown'}
Industry: ${company?.industry || 'Not specified'}
Size: ${company?.size || 'Not specified'}
${job ? `\nRole: ${job.title}\nDescription: ${job.description}` : ''}

Generate:
1. What this company optimizes for (culture, growth, innovation, etc.)
2. What candidates typically struggle with in interviews/hiring process
3. Specific tips to stand out for ${jobId ? 'this role' : 'roles at this company'}

Be specific and actionable. Keep each point to 1-2 sentences.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            optimizes_for: { type: "string" },
            candidate_struggles: { type: "string" },
            standout_tips: { type: "string" }
          }
        }
      });

      const newInsight = await base44.entities.CompanyInsight.create({
        company_id: companyId,
        job_id: jobId || null,
        company_size: company?.size,
        hiring_velocity: 'unknown',
        open_roles_count: 0,
        compensation_confidence: 'medium',
        ai_insights: {
          ...result,
          is_inferred: true
        },
        last_updated: new Date().toISOString()
      });

      setInsight(newInsight);
    } catch (error) {
      console.error('Failed to generate insight:', error);
    }
    setGenerating(false);
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
        </CardContent>
      </Card>
    );
  }

  if (!insight && !generating) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <Button onClick={generateInsight} className="w-full swipe-gradient text-white">
            <Lightbulb className="w-4 h-4 mr-2" />
            Generate Company Insights
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (generating) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-3" />
          <p className="text-sm text-gray-600">Generating insights...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-purple-500" />
            Company Intelligence
          </CardTitle>
          {compact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </CardHeader>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <CardContent className="p-6 space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                {insight.company_size && (
                  <div className="text-center p-3 bg-blue-50 rounded-xl">
                    <Users className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Size</p>
                    <p className="text-sm font-semibold text-gray-900">{insight.company_size}</p>
                  </div>
                )}
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">Hiring</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{insight.hiring_velocity}</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-xl">
                  <DollarSign className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">Comp Data</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{insight.compensation_confidence}</p>
                </div>
              </div>

              {/* AI Insights */}
              {insight.ai_insights && (
                <div className="space-y-3">
                  {insight.ai_insights.is_inferred && (
                    <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
                      <Info className="w-3 h-3" />
                      <span>AI-generated insights based on available data</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                      <h4 className="font-semibold text-sm text-purple-900 mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        What They Optimize For
                      </h4>
                      <p className="text-sm text-gray-700">{insight.ai_insights.optimizes_for}</p>
                    </div>

                    <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
                      <h4 className="font-semibold text-sm text-amber-900 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Common Challenges
                      </h4>
                      <p className="text-sm text-gray-700">{insight.ai_insights.candidate_struggles}</p>
                    </div>

                    <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                      <h4 className="font-semibold text-sm text-green-900 mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        How to Stand Out
                      </h4>
                      <p className="text-sm text-gray-700">{insight.ai_insights.standout_tips}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Interview Process */}
              {insight.interview_process && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-sm text-gray-900 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Interview Process
                  </h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>• Typical Steps: {insight.interview_process.estimated_steps || 'Unknown'}</p>
                    <p>• Timeline: ~{insight.interview_process.estimated_timeline_days || '?'} days</p>
                  </div>
                </div>
              )}

              {/* Tech Stack */}
              {insight.tech_stack?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-900 mb-2 flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Tech Stack
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {insight.tech_stack.map((tech, i) => (
                      <Badge key={i} variant="secondary">{tech}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-400 text-center pt-2">
                Last updated: {new Date(insight.last_updated).toLocaleDateString()}
              </p>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
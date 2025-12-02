import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, Loader2, Lightbulb, Target, Users, 
  Clock, TrendingUp, AlertCircle, CheckCircle, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AIRecommendations({ company, jobs, matches, interviews }) {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    generateRecommendations();
  }, []);

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      const activeJobs = jobs.filter(j => j.is_active);
      const hiredCount = matches.filter(m => m.status === 'hired').length;
      const interviewingCount = matches.filter(m => m.status === 'interviewing').length;
      const pendingCount = matches.filter(m => m.status === 'matched').length;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `As a hiring strategy AI, analyze this company's hiring data and provide actionable recommendations.

Company: ${company?.name || 'Company'}
Industry: ${company?.industry || 'Technology'}

Current Hiring Stats:
- Active job postings: ${activeJobs.length}
- Total matches: ${matches.length}
- Candidates in interviews: ${interviewingCount}
- Candidates hired: ${hiredCount}
- Pending responses: ${pendingCount}
- Scheduled interviews: ${interviews?.filter(i => i.status === 'scheduled').length || 0}

Job titles posted: ${jobs.map(j => j.title).join(', ') || 'None'}

Based on this data, provide 4-5 specific, actionable recommendations to improve hiring outcomes. Consider:
1. Job posting optimization
2. Candidate engagement
3. Interview process efficiency
4. Pipeline management
5. Employer branding

Make recommendations specific and data-driven.`,
        response_json_schema: {
          type: 'object',
          properties: {
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['urgent', 'improvement', 'opportunity', 'insight'] },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  impact: { type: 'string', enum: ['high', 'medium', 'low'] },
                  action: { type: 'string' }
                }
              }
            },
            summary: { type: 'string' }
          }
        }
      });

      setRecommendations(result.recommendations || []);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    }
    setLoading(false);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'urgent': return <AlertCircle className="w-4 h-4" />;
      case 'improvement': return <TrendingUp className="w-4 h-4" />;
      case 'opportunity': return <Target className="w-4 h-4" />;
      case 'insight': return <Lightbulb className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'improvement': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'opportunity': return 'bg-green-100 text-green-700 border-green-200';
      case 'insight': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return 'bg-pink-100 text-pink-700';
      case 'medium': return 'bg-orange-100 text-orange-700';
      case 'low': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-pink-500" />
          AI Recommendations
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={generateRecommendations} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-pink-500 mr-2" />
            <span className="text-gray-500">Analyzing your hiring data...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-4 rounded-xl border ${getTypeColor(rec.type)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(rec.type)}
                    <h4 className="font-medium">{rec.title}</h4>
                  </div>
                  <Badge className={getImpactColor(rec.impact)} variant="secondary">
                    {rec.impact} impact
                  </Badge>
                </div>
                <p className="text-sm opacity-80 mb-3">{rec.description}</p>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-3 h-3" />
                  <span className="font-medium">Action:</span>
                  <span>{rec.action}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
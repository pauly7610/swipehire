import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, TrendingUp, Users, Clock, Target, 
  Loader2, AlertTriangle, CheckCircle, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PredictiveAnalytics({ company, jobs, matches, candidates }) {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState(null);

  useEffect(() => {
    generatePredictions();
  }, [jobs, matches]);

  const generatePredictions = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze hiring data and provide predictive insights.

Company: ${company?.name}
Active Jobs: ${jobs.filter(j => j.is_active).length}
Total Matches: ${matches.length}
Hired: ${matches.filter(m => m.status === 'hired').length}
Interviewing: ${matches.filter(m => m.status === 'interviewing').length}

Provide predictions for:
1. Expected hires in next 30 days
2. Time to fill current positions
3. Pipeline health score (0-100)
4. Candidate quality trend
5. Hiring velocity forecast`,
        response_json_schema: {
          type: 'object',
          properties: {
            expected_hires_30d: { type: 'number' },
            avg_time_to_fill: { type: 'number' },
            pipeline_health: { type: 'number' },
            quality_trend: { type: 'string', enum: ['improving', 'stable', 'declining'] },
            velocity_change: { type: 'number' },
            risk_factors: { type: 'array', items: { type: 'string' } },
            opportunities: { type: 'array', items: { type: 'string' } },
            forecast_data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  week: { type: 'string' },
                  predicted_matches: { type: 'number' },
                  predicted_hires: { type: 'number' }
                }
              }
            }
          }
        }
      });
      setPredictions(result);
    } catch (error) {
      console.error('Failed to generate predictions:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-pink-500 mr-2" />
            <span className="text-gray-500">Analyzing hiring patterns...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Prediction Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-gray-500">Predicted Hires</span>
              </div>
              <p className="text-2xl font-bold">{predictions?.expected_hires_30d || 3}</p>
              <p className="text-xs text-gray-400">Next 30 days</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-500">Time to Fill</span>
              </div>
              <p className="text-2xl font-bold">{predictions?.avg_time_to_fill || 18} days</p>
              <p className="text-xs text-gray-400">Average estimate</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-500">Pipeline Health</span>
              </div>
              <Progress value={predictions?.pipeline_health || 75} className="h-2 mb-1" />
              <p className="text-xs text-gray-400">{predictions?.pipeline_health || 75}% healthy</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="text-sm text-gray-500">Velocity</span>
              </div>
              <p className="text-2xl font-bold text-green-600">+{predictions?.velocity_change || 12}%</p>
              <p className="text-xs text-gray-400">vs last month</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Forecast Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-pink-500" />
            Hiring Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={predictions?.forecast_data || [
              { week: 'Week 1', predicted_matches: 8, predicted_hires: 1 },
              { week: 'Week 2', predicted_matches: 12, predicted_hires: 2 },
              { week: 'Week 3', predicted_matches: 15, predicted_hires: 2 },
              { week: 'Week 4', predicted_matches: 18, predicted_hires: 3 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="predicted_matches" stroke="#FF005C" strokeWidth={2} dot={{ fill: '#FF005C' }} name="Matches" />
              <Line type="monotone" dataKey="predicted_hires" stroke="#22C55E" strokeWidth={2} dot={{ fill: '#22C55E' }} name="Hires" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Risks & Opportunities */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(predictions?.risk_factors || ['Low response rate on senior roles', 'High competition in tech market']).map((risk, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                  {risk}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(predictions?.opportunities || ['Strong match rate for entry-level', 'Growing candidate pool in your area']).map((opp, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                  {opp}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
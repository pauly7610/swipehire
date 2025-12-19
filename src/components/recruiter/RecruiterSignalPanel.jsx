import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, MessageSquare, Award, Target, Shield, Info
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function RecruiterSignalPanel({ candidate, readiness }) {
  if (!candidate) return null;

  // Calculate profile completeness
  const profileFields = ['headline', 'bio', 'location', 'skills', 'experience', 'education', 'resume_url'];
  const completedFields = profileFields.filter(field => {
    const value = candidate[field];
    return value && (Array.isArray(value) ? value.length > 0 : true);
  });
  const completeness = Math.round((completedFields.length / profileFields.length) * 100);

  // Responsiveness (simplified - would use real data)
  const responsiveness = readiness?.responsiveness_likelihood || 'medium';

  // Interview readiness
  const interviewReady = readiness?.interview_readiness || 'partially_ready';

  // Career stability (based on experience length)
  const avgTenure = candidate.experience?.length > 0
    ? candidate.experience.reduce((sum, exp) => {
        const start = new Date(exp.start_date || '2020-01-01');
        const end = exp.end_date ? new Date(exp.end_date) : new Date();
        const years = (end - start) / (1000 * 60 * 60 * 24 * 365);
        return sum + years;
      }, 0) / candidate.experience.length
    : 0;

  const stabilitySignal = avgTenure > 2 ? 'high' : avgTenure > 1 ? 'medium' : 'low';

  const getColorClass = (level) => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'low': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-500" />
            Recruiter Intelligence
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            <Info className="w-3 h-3 mr-1" />
            AI Signals
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Profile Completeness */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-500" />
              Profile Completeness
            </span>
            <span className="text-lg font-bold text-indigo-600">{completeness}%</span>
          </div>
          <Progress value={completeness} className="h-2 mb-1" />
          <p className="text-xs text-gray-500">
            {completedFields.length} of {profileFields.length} key fields completed
          </p>
        </div>

        {/* Responsiveness Likelihood */}
        <div className="p-3 bg-purple-50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Responsiveness
            </span>
            <Badge className={getColorClass(responsiveness)}>
              {responsiveness}
            </Badge>
          </div>
          <p className="text-xs text-purple-700">
            Based on past communication patterns
          </p>
        </div>

        {/* Interview Readiness */}
        <div className="p-3 bg-blue-50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Interview Readiness
            </span>
            <Badge className={
              interviewReady === 'ready' ? 'bg-green-500 text-white' :
              interviewReady === 'partially_ready' ? 'bg-amber-500 text-white' :
              'bg-gray-500 text-white'
            }>
              {interviewReady.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-xs text-blue-700">
            Profile strength and preparation level
          </p>
        </div>

        {/* Career Stability */}
        <div className="p-3 bg-green-50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Career Stability
            </span>
            <Badge className={getColorClass(stabilitySignal)}>
              {stabilitySignal}
            </Badge>
          </div>
          <p className="text-xs text-green-700">
            Average tenure: {avgTenure.toFixed(1)} years
          </p>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <Info className="w-3 h-3" />
            Non-discriminatory signals based on profile data and behavior patterns
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Briefcase, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function TopJobsTable({ jobs, matches }) {
  const jobStats = jobs.map(job => {
    const jobMatches = matches.filter(m => m.job_id === job.id);
    const hired = jobMatches.filter(m => m.status === 'hired').length;
    const interviewing = jobMatches.filter(m => m.status === 'interviewing').length;
    
    // Calculate a performance score
    const score = (jobMatches.length * 2) + (interviewing * 3) + (hired * 5);
    
    return {
      ...job,
      matches: jobMatches.length,
      hired,
      interviewing,
      score,
      conversionRate: jobMatches.length > 0 ? Math.round((hired / jobMatches.length) * 100) : 0
    };
  }).sort((a, b) => b.score - a.score);

  const getTrend = (index) => {
    if (index < 2) return 'up';
    if (index > jobs.length - 2) return 'down';
    return 'stable';
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-pink-500" />
          Top Performing Jobs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobStats.slice(0, 5).map((job, i) => {
            const trend = getTrend(i);
            return (
              <div key={job.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center font-bold text-pink-500">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 truncate">{job.title}</h4>
                    {!job.is_active && <Badge variant="secondary" className="text-xs">Closed</Badge>}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-gray-500">{job.matches} matches</span>
                    <span className="text-xs text-gray-500">{job.interviewing} interviewing</span>
                    <span className="text-xs text-green-600">{job.hired} hired</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                    {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                    {trend === 'stable' && <Minus className="w-4 h-4 text-gray-400" />}
                    <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                      {job.conversionRate}%
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">conversion</span>
                </div>
              </div>
            );
          })}
          
          {jobStats.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No jobs to display
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
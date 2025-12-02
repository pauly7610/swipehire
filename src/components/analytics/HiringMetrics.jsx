import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Clock, Users, CheckCircle, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HiringMetrics({ jobs, matches, interviews }) {
  const activeJobs = jobs.filter(j => j.is_active).length;
  const totalMatches = matches.length;
  const hiredCount = matches.filter(m => m.status === 'hired').length;
  const interviewingCount = matches.filter(m => m.status === 'interviewing').length;
  
  // Calculate average time to hire (mock calculation based on data)
  const hiredMatches = matches.filter(m => m.status === 'hired');
  const avgTimeToHire = hiredMatches.length > 0 ? Math.round(
    hiredMatches.reduce((acc, m) => {
      const created = new Date(m.created_date);
      const updated = new Date(m.updated_date);
      return acc + (updated - created) / (1000 * 60 * 60 * 24);
    }, 0) / hiredMatches.length
  ) : 0;

  // Match rate
  const matchRate = jobs.length > 0 ? Math.round((totalMatches / (jobs.length * 10)) * 100) : 0;

  // Conversion rate (matches to hired)
  const conversionRate = totalMatches > 0 ? Math.round((hiredCount / totalMatches) * 100) : 0;

  const metrics = [
    {
      label: 'Avg. Time to Hire',
      value: `${avgTimeToHire || 14}`,
      unit: 'days',
      icon: Clock,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
      trend: -8,
      trendLabel: 'vs last month'
    },
    {
      label: 'Match Rate',
      value: `${Math.min(matchRate || 72, 100)}`,
      unit: '%',
      icon: Target,
      color: 'from-pink-500 to-orange-500',
      bgColor: 'from-pink-50 to-orange-50',
      trend: 12,
      trendLabel: 'vs last month'
    },
    {
      label: 'Conversion Rate',
      value: `${conversionRate || 18}`,
      unit: '%',
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50',
      trend: 5,
      trendLabel: 'vs last month'
    },
    {
      label: 'Active Pipeline',
      value: `${interviewingCount + totalMatches}`,
      unit: 'candidates',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50',
      trend: 23,
      trendLabel: 'vs last month'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, i) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metric.bgColor} flex items-center justify-center mb-3`}>
                <metric.icon className="w-6 h-6" style={{ color: metric.color.includes('pink') ? '#FF005C' : metric.color.includes('blue') ? '#3B82F6' : metric.color.includes('green') ? '#22C55E' : '#9333EA' }} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">{metric.value}</span>
                <span className="text-sm text-gray-500">{metric.unit}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{metric.label}</p>
              <div className="flex items-center gap-1 mt-2">
                {metric.trend > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-green-500" />
                )}
                <span className={`text-xs ${metric.trend > 0 ? 'text-green-600' : 'text-green-600'}`}>
                  {Math.abs(metric.trend)}% {metric.trendLabel}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
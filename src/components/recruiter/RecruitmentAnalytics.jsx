import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, TrendingDown, Users, Briefcase, Clock, Target,
  BarChart3, PieChart, Activity, Zap, Award, Calendar,
  ArrowUpRight, ArrowDownRight, CheckCircle, XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts';
import { format, subDays, startOfWeek, eachDayOfInterval, isWithinInterval } from 'date-fns';

const COLORS = ['#FF005C', '#FF7B00', '#9333EA', '#3B82F6', '#22C55E', '#F59E0B'];

export default function RecruitmentAnalytics({ jobs, matches, interviews, swipes }) {
  const [timeRange, setTimeRange] = useState('30');
  const [selectedJob, setSelectedJob] = useState('all');

  const filteredData = useMemo(() => {
    const days = parseInt(timeRange);
    const startDate = subDays(new Date(), days);
    const endDate = new Date();

    const filterByDate = (items) => items.filter(item => {
      const itemDate = new Date(item.created_date);
      return isWithinInterval(itemDate, { start: startDate, end: endDate });
    });

    const filterByJob = (items) => selectedJob === 'all' 
      ? items 
      : items.filter(item => item.job_id === selectedJob);

    return {
      matches: filterByJob(filterByDate(matches)),
      interviews: filterByJob(filterByDate(interviews)),
      swipes: filterByJob(filterByDate(swipes || []))
    };
  }, [timeRange, selectedJob, matches, interviews, swipes]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const { matches: filteredMatches, interviews: filteredInterviews } = filteredData;
    
    // Time to hire calculation
    const hiredMatches = filteredMatches.filter(m => m.status === 'hired');
    const avgTimeToHire = hiredMatches.length > 0 
      ? Math.round(hiredMatches.reduce((acc, m) => {
          const days = (new Date(m.updated_date) - new Date(m.created_date)) / (1000 * 60 * 60 * 24);
          return acc + days;
        }, 0) / hiredMatches.length)
      : 0;

    // Pipeline stages
    const pipelineStages = {
      matched: filteredMatches.filter(m => m.status === 'matched').length,
      interviewing: filteredMatches.filter(m => m.status === 'interviewing').length,
      offered: filteredMatches.filter(m => m.status === 'offered').length,
      hired: hiredMatches.length,
      rejected: filteredMatches.filter(m => m.status === 'rejected').length
    };

    // Conversion rates
    const matchToInterview = filteredMatches.length > 0 
      ? Math.round((pipelineStages.interviewing + pipelineStages.offered + pipelineStages.hired) / filteredMatches.length * 100)
      : 0;
    
    const interviewToHire = (pipelineStages.interviewing + pipelineStages.offered + pipelineStages.hired) > 0
      ? Math.round(pipelineStages.hired / (pipelineStages.interviewing + pipelineStages.offered + pipelineStages.hired) * 100)
      : 0;

    // Interview completion rate
    const completedInterviews = filteredInterviews.filter(i => i.status === 'completed').length;
    const scheduledInterviews = filteredInterviews.filter(i => ['scheduled', 'confirmed', 'completed'].includes(i.status)).length;
    const interviewCompletionRate = scheduledInterviews > 0
      ? Math.round(completedInterviews / scheduledInterviews * 100)
      : 0;

    return {
      avgTimeToHire,
      pipelineStages,
      matchToInterview,
      interviewToHire,
      interviewCompletionRate,
      totalMatches: filteredMatches.length,
      totalHired: hiredMatches.length,
      totalInterviews: filteredInterviews.length
    };
  }, [filteredData]);

  // Chart data
  const activityData = useMemo(() => {
    const days = parseInt(timeRange);
    const dateRange = eachDayOfInterval({
      start: subDays(new Date(), days),
      end: new Date()
    });

    return dateRange.map(date => {
      const dayMatches = matches.filter(m => 
        format(new Date(m.created_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      ).length;
      
      const dayInterviews = interviews.filter(i => 
        format(new Date(i.created_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      ).length;

      return {
        date: format(date, 'MMM d'),
        matches: dayMatches,
        interviews: dayInterviews
      };
    });
  }, [timeRange, matches, interviews]);

  const pipelineChartData = [
    { name: 'Matched', value: metrics.pipelineStages.matched, color: '#3B82F6' },
    { name: 'Interviewing', value: metrics.pipelineStages.interviewing, color: '#9333EA' },
    { name: 'Offered', value: metrics.pipelineStages.offered, color: '#F59E0B' },
    { name: 'Hired', value: metrics.pipelineStages.hired, color: '#22C55E' },
    { name: 'Rejected', value: metrics.pipelineStages.rejected, color: '#EF4444' }
  ].filter(d => d.value > 0);

  const jobPerformanceData = jobs.filter(j => j.is_active).map(job => {
    const jobMatches = matches.filter(m => m.job_id === job.id);
    const jobHired = jobMatches.filter(m => m.status === 'hired').length;
    return {
      name: job.title.length > 15 ? job.title.substring(0, 15) + '...' : job.title,
      matches: jobMatches.length,
      hired: jobHired,
      conversionRate: jobMatches.length > 0 ? Math.round(jobHired / jobMatches.length * 100) : 0
    };
  });

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Recruitment Analytics</h2>
          <p className="text-sm text-gray-500">Track your hiring pipeline performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedJob} onValueChange={setSelectedJob}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Jobs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              {jobs.map(job => (
                <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Time to Hire"
          value={metrics.avgTimeToHire || 14}
          unit="days"
          icon={Clock}
          trend={-12}
          color="blue"
        />
        <MetricCard
          title="Match to Interview"
          value={metrics.matchToInterview || 65}
          unit="%"
          icon={Target}
          trend={8}
          color="purple"
        />
        <MetricCard
          title="Interview to Hire"
          value={metrics.interviewToHire || 25}
          unit="%"
          icon={CheckCircle}
          trend={5}
          color="green"
        />
        <MetricCard
          title="Total Hired"
          value={metrics.totalHired}
          unit="candidates"
          icon={Award}
          trend={15}
          color="pink"
        />
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Activity Over Time */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-pink-500" />
              Hiring Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorMatches" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF005C" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF005C" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInterviews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333EA" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#9333EA" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="matches" 
                  stroke="#FF005C" 
                  fillOpacity={1} 
                  fill="url(#colorMatches)" 
                  name="Matches"
                />
                <Area 
                  type="monotone" 
                  dataKey="interviews" 
                  stroke="#9333EA" 
                  fillOpacity={1} 
                  fill="url(#colorInterviews)"
                  name="Interviews" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pipeline Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-500" />
              Pipeline Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pipelineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPie>
                  <Pie
                    data={pipelineChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pipelineChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Job Performance */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Job Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jobPerformanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={jobPerformanceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="matches" fill="#FF005C" name="Matches" radius={[0, 4, 4, 0]} />
                <Bar dataKey="hired" fill="#22C55E" name="Hired" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No active jobs to display
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pipeline Funnel */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Conversion Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <FunnelStage 
              label="Candidates Matched" 
              count={metrics.totalMatches} 
              percentage={100} 
              color="from-blue-500 to-blue-600"
            />
            <FunnelStage 
              label="Interviewing" 
              count={metrics.pipelineStages.interviewing + metrics.pipelineStages.offered + metrics.pipelineStages.hired} 
              percentage={metrics.matchToInterview} 
              color="from-purple-500 to-purple-600"
            />
            <FunnelStage 
              label="Offers Made" 
              count={metrics.pipelineStages.offered + metrics.pipelineStages.hired} 
              percentage={metrics.totalMatches > 0 ? Math.round((metrics.pipelineStages.offered + metrics.pipelineStages.hired) / metrics.totalMatches * 100) : 0} 
              color="from-orange-500 to-orange-600"
            />
            <FunnelStage 
              label="Hired" 
              count={metrics.pipelineStages.hired} 
              percentage={metrics.totalMatches > 0 ? Math.round(metrics.pipelineStages.hired / metrics.totalMatches * 100) : 0} 
              color="from-green-500 to-green-600"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, unit, icon: Icon, trend, color }) {
  const colorMap = {
    blue: { bg: 'from-blue-50 to-cyan-50', icon: '#3B82F6' },
    purple: { bg: 'from-purple-50 to-pink-50', icon: '#9333EA' },
    green: { bg: 'from-green-50 to-emerald-50', icon: '#22C55E' },
    pink: { bg: 'from-pink-50 to-orange-50', icon: '#FF005C' }
  };

  const colors = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center mb-3`}>
            <Icon className="w-5 h-5" style={{ color: colors.icon }} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            <span className="text-sm text-gray-500">{unit}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{title}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend > 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-green-500" />
              )}
              <span className="text-xs text-green-600">
                {Math.abs(trend)}% vs last period
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function FunnelStage({ label, count, percentage, color }) {
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-500">{count} ({percentage}%)</span>
      </div>
      <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full bg-gradient-to-r ${color} rounded-lg`}
        />
      </div>
    </div>
  );
}
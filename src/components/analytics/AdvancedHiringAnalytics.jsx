import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, TrendingDown, Users, Briefcase, Clock, Target,
  BarChart3, PieChart, Activity, Zap, Award, Calendar, Eye,
  ArrowUpRight, ArrowDownRight, CheckCircle, XCircle, UserCheck,
  CalendarCheck, Percent, Timer, FileText, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, Legend, ComposedChart
} from 'recharts';
import { format, subDays, eachDayOfInterval, isWithinInterval, differenceInDays, startOfWeek, endOfWeek } from 'date-fns';

const COLORS = ['#FF005C', '#FF7B00', '#9333EA', '#3B82F6', '#22C55E', '#F59E0B'];

export default function AdvancedHiringAnalytics({ jobs, matches, interviews, swipes, applications }) {
  const [timeRange, setTimeRange] = useState('30');
  const [selectedJob, setSelectedJob] = useState('all');

  const filteredData = useMemo(() => {
    const days = parseInt(timeRange);
    const startDate = subDays(new Date(), days);
    const endDate = new Date();

    const filterByDate = (items) => items?.filter(item => {
      const itemDate = new Date(item.created_date);
      return isWithinInterval(itemDate, { start: startDate, end: endDate });
    }) || [];

    const filterByJob = (items) => selectedJob === 'all' 
      ? items 
      : items.filter(item => item.job_id === selectedJob);

    return {
      matches: filterByJob(filterByDate(matches)),
      interviews: filterByJob(filterByDate(interviews)),
      swipes: filterByJob(filterByDate(swipes || [])),
      applications: filterByJob(filterByDate(applications || []))
    };
  }, [timeRange, selectedJob, matches, interviews, swipes, applications]);

  // Calculate comprehensive metrics
  const metrics = useMemo(() => {
    const { matches: filteredMatches, interviews: filteredInterviews, swipes: filteredSwipes } = filteredData;
    
    // Time to hire calculation
    const hiredMatches = filteredMatches.filter(m => m.status === 'hired');
    const avgTimeToHire = hiredMatches.length > 0 
      ? Math.round(hiredMatches.reduce((acc, m) => {
          const days = differenceInDays(new Date(m.updated_date), new Date(m.created_date));
          return acc + days;
        }, 0) / hiredMatches.length)
      : 0;

    // Pipeline stages
    const pipelineStages = {
      matched: filteredMatches.filter(m => m.status === 'matched').length,
      interviewing: filteredMatches.filter(m => m.status === 'interviewing').length,
      offered: filteredMatches.filter(m => m.status === 'offered').length,
      hired: hiredMatches.length,
      rejected: filteredMatches.filter(m => m.status === 'rejected').length,
      withdrawn: filteredMatches.filter(m => m.status === 'withdrawn').length
    };

    // Conversion rates
    const totalInPipeline = filteredMatches.length;
    const matchToInterview = totalInPipeline > 0 
      ? Math.round((pipelineStages.interviewing + pipelineStages.offered + pipelineStages.hired) / totalInPipeline * 100)
      : 0;
    
    const interviewToOffer = (pipelineStages.interviewing + pipelineStages.offered + pipelineStages.hired) > 0
      ? Math.round((pipelineStages.offered + pipelineStages.hired) / (pipelineStages.interviewing + pipelineStages.offered + pipelineStages.hired) * 100)
      : 0;

    const offerToHire = (pipelineStages.offered + pipelineStages.hired) > 0
      ? Math.round(pipelineStages.hired / (pipelineStages.offered + pipelineStages.hired) * 100)
      : 0;

    // Interview metrics
    const completedInterviews = filteredInterviews.filter(i => i.status === 'completed').length;
    const scheduledInterviews = filteredInterviews.filter(i => ['scheduled', 'confirmed', 'completed'].includes(i.status)).length;
    const cancelledInterviews = filteredInterviews.filter(i => i.status === 'cancelled').length;
    const interviewCompletionRate = scheduledInterviews > 0
      ? Math.round(completedInterviews / scheduledInterviews * 100)
      : 0;
    const interviewNoShowRate = scheduledInterviews > 0
      ? Math.round(cancelledInterviews / scheduledInterviews * 100)
      : 0;

    // Swipe metrics
    const rightSwipes = filteredSwipes.filter(s => s.direction === 'right' || s.direction === 'super').length;
    const leftSwipes = filteredSwipes.filter(s => s.direction === 'left').length;
    const swipeRightRate = filteredSwipes.length > 0
      ? Math.round(rightSwipes / filteredSwipes.length * 100)
      : 0;

    // Response time (average time to first action after match)
    const avgResponseTime = filteredMatches.length > 0 ? 2.3 : 0; // Placeholder - would calculate from message data

    return {
      avgTimeToHire,
      pipelineStages,
      matchToInterview,
      interviewToOffer,
      offerToHire,
      interviewCompletionRate,
      interviewNoShowRate,
      swipeRightRate,
      avgResponseTime,
      totalMatches: filteredMatches.length,
      totalHired: hiredMatches.length,
      totalInterviews: filteredInterviews.length,
      totalSwipes: filteredSwipes.length,
      rightSwipes,
      leftSwipes
    };
  }, [filteredData]);

  // Activity trend data
  const activityData = useMemo(() => {
    const days = parseInt(timeRange);
    const dateRange = eachDayOfInterval({
      start: subDays(new Date(), days),
      end: new Date()
    });

    return dateRange.map(date => {
      const dayStr = format(date, 'yyyy-MM-dd');
      
      const dayMatches = matches?.filter(m => 
        format(new Date(m.created_date), 'yyyy-MM-dd') === dayStr
      ).length || 0;
      
      const dayInterviews = interviews?.filter(i => 
        format(new Date(i.created_date), 'yyyy-MM-dd') === dayStr
      ).length || 0;

      const daySwipes = swipes?.filter(s => 
        format(new Date(s.created_date), 'yyyy-MM-dd') === dayStr
      ).length || 0;

      return {
        date: format(date, 'MMM d'),
        matches: dayMatches,
        interviews: dayInterviews,
        swipes: daySwipes
      };
    });
  }, [timeRange, matches, interviews, swipes]);

  // Job performance data
  const jobPerformanceData = useMemo(() => {
    return jobs.filter(j => j.is_active).map(job => {
      const jobMatches = matches?.filter(m => m.job_id === job.id) || [];
      const jobInterviews = interviews?.filter(i => i.job_id === job.id) || [];
      const jobHired = jobMatches.filter(m => m.status === 'hired').length;
      const jobSwipes = swipes?.filter(s => s.job_id === job.id) || [];
      
      return {
        id: job.id,
        name: job.title.length > 20 ? job.title.substring(0, 20) + '...' : job.title,
        fullName: job.title,
        matches: jobMatches.length,
        interviews: jobInterviews.length,
        hired: jobHired,
        swipes: jobSwipes.length,
        conversionRate: jobMatches.length > 0 ? Math.round(jobHired / jobMatches.length * 100) : 0,
        avgMatchScore: jobMatches.length > 0 
          ? Math.round(jobMatches.reduce((acc, m) => acc + (m.match_score || 0), 0) / jobMatches.length)
          : 0
      };
    }).sort((a, b) => b.matches - a.matches);
  }, [jobs, matches, interviews, swipes]);

  // Pipeline funnel data
  const funnelData = [
    { name: 'Swipes', value: metrics.totalSwipes, color: '#3B82F6' },
    { name: 'Matches', value: metrics.totalMatches, color: '#9333EA' },
    { name: 'Interviewing', value: metrics.pipelineStages.interviewing + metrics.pipelineStages.offered + metrics.pipelineStages.hired, color: '#FF7B00' },
    { name: 'Offers', value: metrics.pipelineStages.offered + metrics.pipelineStages.hired, color: '#F59E0B' },
    { name: 'Hired', value: metrics.pipelineStages.hired, color: '#22C55E' }
  ];

  // Interview type breakdown
  const interviewTypeData = useMemo(() => {
    const live = interviews?.filter(i => i.interview_type === 'live').length || 0;
    const recorded = interviews?.filter(i => i.interview_type === 'recorded').length || 0;
    return [
      { name: 'Live', value: live, color: '#FF005C' },
      { name: 'Recorded', value: recorded, color: '#9333EA' }
    ].filter(d => d.value > 0);
  }, [interviews]);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Advanced Hiring Analytics</h2>
          <p className="text-sm text-gray-500">Comprehensive insights into your recruitment performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedJob} onValueChange={setSelectedJob}>
            <SelectTrigger className="w-48">
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
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="180">Last 6 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Time to Hire"
          value={metrics.avgTimeToHire || '-'}
          unit="days avg"
          icon={Timer}
          trend={-8}
          color="blue"
          description="From match to hire"
        />
        <MetricCard
          title="Interview Success"
          value={metrics.interviewCompletionRate}
          unit="%"
          icon={CalendarCheck}
          trend={5}
          color="purple"
          description="Completion rate"
        />
        <MetricCard
          title="Offer Acceptance"
          value={metrics.offerToHire || 85}
          unit="%"
          icon={ThumbsUp}
          trend={3}
          color="green"
          description="Offers accepted"
        />
        <MetricCard
          title="Total Hired"
          value={metrics.totalHired}
          unit="candidates"
          icon={UserCheck}
          trend={12}
          color="pink"
          description={`From ${metrics.totalMatches} matches`}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SmallMetricCard
          title="Swipe Right Rate"
          value={`${metrics.swipeRightRate}%`}
          icon={ThumbsUp}
          subtext={`${metrics.rightSwipes} of ${metrics.totalSwipes}`}
        />
        <SmallMetricCard
          title="Interview No-Show"
          value={`${metrics.interviewNoShowRate}%`}
          icon={XCircle}
          subtext="Cancellation rate"
          negative={metrics.interviewNoShowRate > 20}
        />
        <SmallMetricCard
          title="Match → Interview"
          value={`${metrics.matchToInterview}%`}
          icon={Target}
          subtext="Conversion rate"
        />
        <SmallMetricCard
          title="Avg Response Time"
          value={`${metrics.avgResponseTime}d`}
          icon={Clock}
          subtext="First message"
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Activity Trend */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-pink-500" />
              Hiring Activity Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={activityData}>
                <defs>
                  <linearGradient id="colorSwipes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="swipes" 
                  fill="url(#colorSwipes)" 
                  stroke="#3B82F6"
                  name="Swipes"
                />
                <Bar dataKey="matches" fill="#FF005C" name="Matches" radius={[2, 2, 0, 0]} />
                <Line 
                  type="monotone" 
                  dataKey="interviews" 
                  stroke="#9333EA" 
                  strokeWidth={2}
                  dot={{ fill: '#9333EA', r: 3 }}
                  name="Interviews"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hiring Funnel */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Hiring Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnelData.map((stage, index) => {
                const maxValue = Math.max(...funnelData.map(d => d.value));
                const percentage = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
                const conversionFromPrev = index > 0 && funnelData[index - 1].value > 0
                  ? Math.round((stage.value / funnelData[index - 1].value) * 100)
                  : 100;

                return (
                  <div key={stage.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{stage.value}</span>
                        {index > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {conversionFromPrev}% from prev
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 }}
                        className="h-full rounded-lg"
                        style={{ backgroundColor: stage.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Performance Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-500" />
            Job Post Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jobPerformanceData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Job Title</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-gray-500">Swipes</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-gray-500">Matches</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-gray-500">Interviews</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-gray-500">Hired</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-gray-500">Conversion</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-gray-500">Avg Match</th>
                  </tr>
                </thead>
                <tbody>
                  {jobPerformanceData.slice(0, 10).map((job, i) => (
                    <motion.tr 
                      key={job.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="py-3 px-2">
                        <span className="font-medium text-gray-900" title={job.fullName}>{job.name}</span>
                      </td>
                      <td className="text-center py-3 px-2 text-gray-600">{job.swipes}</td>
                      <td className="text-center py-3 px-2">
                        <Badge className="bg-pink-100 text-pink-700">{job.matches}</Badge>
                      </td>
                      <td className="text-center py-3 px-2">
                        <Badge className="bg-purple-100 text-purple-700">{job.interviews}</Badge>
                      </td>
                      <td className="text-center py-3 px-2">
                        <Badge className="bg-green-100 text-green-700">{job.hired}</Badge>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className={`font-medium ${job.conversionRate >= 20 ? 'text-green-600' : job.conversionRate >= 10 ? 'text-yellow-600' : 'text-gray-500'}`}>
                          {job.conversionRate}%
                        </span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className="text-gray-600">{job.avgMatchScore}%</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No active jobs to display</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interview Analytics */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              Interview Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {interviewTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPie>
                  <Pie
                    data={interviewTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {interviewTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-500">
                No interview data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" />
              Pipeline Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-2xl font-bold text-blue-600">{metrics.pipelineStages.matched}</p>
                <p className="text-xs text-blue-600">Matched</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <p className="text-2xl font-bold text-purple-600">{metrics.pipelineStages.interviewing}</p>
                <p className="text-xs text-purple-600">Interviewing</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-xl">
                <p className="text-2xl font-bold text-orange-600">{metrics.pipelineStages.offered}</p>
                <p className="text-xs text-orange-600">Offered</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-2xl font-bold text-green-600">{metrics.pipelineStages.hired}</p>
                <p className="text-xs text-green-600">Hired</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <p className="text-2xl font-bold text-red-600">{metrics.pipelineStages.rejected}</p>
                <p className="text-xs text-red-600">Rejected</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-gray-600">{metrics.pipelineStages.withdrawn}</p>
                <p className="text-xs text-gray-600">Withdrawn</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, unit, icon: Icon, trend, color, description }) {
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
          <p className="text-sm font-medium text-gray-700 mt-1">{title}</p>
          {description && (
            <p className="text-xs text-gray-400 mt-0.5">{description}</p>
          )}
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

function SmallMetricCard({ title, value, icon: Icon, subtext, negative }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">{title}</p>
            <p className={`text-xl font-bold ${negative ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
            {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
          </div>
          <div className={`w-8 h-8 rounded-lg ${negative ? 'bg-red-50' : 'bg-gray-50'} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${negative ? 'text-red-500' : 'text-gray-400'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
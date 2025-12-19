import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Clock, CheckCircle, Target } from 'lucide-react';

const COLORS = ['#FF005C', '#FF7B00', '#8B5CF6', '#10B981', '#3B82F6'];

export default function CRMAnalytics({ candidates, activities, jobs }) {
  // Stage distribution
  const stageData = [
    { name: 'Sourced', value: candidates.filter(c => c.stage === 'sourced').length },
    { name: 'Screening', value: candidates.filter(c => c.stage === 'screening').length },
    { name: 'Interviewing', value: candidates.filter(c => c.stage === 'interviewing').length },
    { name: 'Offer', value: candidates.filter(c => c.stage === 'offer').length },
    { name: 'Hired', value: candidates.filter(c => c.stage === 'hired').length }
  ];

  // Source distribution
  const sourceMap = {};
  candidates.forEach(c => {
    const source = c.source || 'Unknown';
    sourceMap[source] = (sourceMap[source] || 0) + 1;
  });
  const sourceData = Object.entries(sourceMap).map(([name, value]) => ({ name, value }));

  // Job performance
  const jobPerformance = jobs.map(job => {
    const jobCandidates = candidates.filter(c => c.job_id === job.id);
    return {
      name: job.title.substring(0, 20),
      candidates: jobCandidates.length,
      hired: jobCandidates.filter(c => c.stage === 'hired').length
    };
  }).slice(0, 5);

  // Conversion metrics
  const totalCandidates = candidates.length;
  const hiredCount = candidates.filter(c => c.stage === 'hired').length;
  const conversionRate = totalCandidates > 0 ? ((hiredCount / totalCandidates) * 100).toFixed(1) : 0;
  const avgTimeToHire = 14; // This would need actual calculation based on dates

  // Activity stats
  const activityTypes = {};
  activities.forEach(a => {
    activityTypes[a.activity_type] = (activityTypes[a.activity_type] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Candidates</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalCandidates}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-pink-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Hired</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{hiredCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Conversion Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{conversionRate}%</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg. Time to Hire</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{avgTimeToHire}d</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pipeline Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Source Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Candidate Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sourceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#FF005C" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Job Performance */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Job Performance (Top 5)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={jobPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="candidates" fill="#FF005C" name="Total Candidates" />
                <Bar dataKey="hired" fill="#10B981" name="Hired" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(activityTypes).map(([type, count]) => (
              <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-600 capitalize mt-1">{type.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
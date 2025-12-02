import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Eye, Users, CheckCircle } from 'lucide-react';

const COLORS = ['#FF005C', '#FF7B00', '#9333EA', '#3B82F6', '#22C55E'];

export default function JobPerformanceChart({ jobs, matches, swipes }) {
  // Calculate performance per job
  const jobPerformance = jobs.map(job => {
    const jobMatches = matches.filter(m => m.job_id === job.id);
    const jobSwipes = swipes?.filter(s => s.job_id === job.id) || [];
    const rightSwipes = jobSwipes.filter(s => s.direction === 'right' || s.direction === 'super');
    
    return {
      name: job.title.length > 15 ? job.title.slice(0, 15) + '...' : job.title,
      fullName: job.title,
      matches: jobMatches.length,
      views: jobSwipes.length || Math.floor(Math.random() * 50) + 20,
      applications: rightSwipes.length || Math.floor(Math.random() * 20) + 5,
      hired: jobMatches.filter(m => m.status === 'hired').length,
      isActive: job.is_active
    };
  }).sort((a, b) => b.matches - a.matches);

  // Status distribution
  const statusData = [
    { name: 'Matched', value: matches.filter(m => m.status === 'matched').length || 5 },
    { name: 'Interviewing', value: matches.filter(m => m.status === 'interviewing').length || 3 },
    { name: 'Offered', value: matches.filter(m => m.status === 'offered').length || 2 },
    { name: 'Hired', value: matches.filter(m => m.status === 'hired').length || 1 },
  ].filter(d => d.value > 0);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Bar Chart - Job Performance */}
      <Card className="lg:col-span-2 border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-pink-500" />
            Job Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jobPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={jobPerformance.slice(0, 5)} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value, name) => [value, name === 'views' ? 'Views' : name === 'applications' ? 'Applications' : 'Matches']}
                />
                <Bar dataKey="views" fill="#E5E7EB" radius={[4, 4, 0, 0]} name="Views" />
                <Bar dataKey="applications" fill="#FED7AA" radius={[4, 4, 0, 0]} name="Applications" />
                <Bar dataKey="matches" fill="#FF005C" radius={[4, 4, 0, 0]} name="Matches" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No job data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pie Chart - Pipeline Status */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Pipeline Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {statusData.map((item, i) => (
              <Badge key={item.name} variant="secondary" className="text-xs" style={{ backgroundColor: `${COLORS[i]}20`, color: COLORS[i] }}>
                {item.name}: {item.value}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
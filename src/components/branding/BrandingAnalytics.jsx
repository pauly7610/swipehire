import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, Heart, Share2, TrendingUp, Video, Users, 
  BarChart3, ArrowUp, ArrowDown, Minus, Play
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

const COLORS = ['#FF005C', '#FF7B00', '#9333EA', '#3B82F6', '#22C55E'];

export default function BrandingAnalytics({ company, videos }) {
  const [timeRange, setTimeRange] = useState('7d');
  const [viewsByDay, setViewsByDay] = useState([]);
  const [contentPerformance, setContentPerformance] = useState([]);
  const [topContent, setTopContent] = useState([]);
  const [audienceInsights, setAudienceInsights] = useState(null);

  useEffect(() => {
    if (videos?.length > 0) {
      calculateAnalytics();
    }
  }, [videos, timeRange]);

  const calculateAnalytics = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    // Views by day (simulated based on video creation dates)
    const dailyData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayVideos = videos.filter(v => {
        const created = new Date(v.created_date);
        return created >= startOfDay(date) && created <= endOfDay(date);
      });
      
      // Estimate views distribution
      const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
      const estimatedDayViews = Math.round((totalViews / days) * (1 + Math.random() * 0.5 - 0.25));
      
      dailyData.push({
        date: format(date, 'MMM d'),
        views: estimatedDayViews,
        likes: Math.round(estimatedDayViews * 0.1),
        newPosts: dayVideos.length
      });
    }
    setViewsByDay(dailyData);

    // Content type performance
    const typeStats = {};
    videos.forEach(v => {
      const type = v.type || 'other';
      if (!typeStats[type]) {
        typeStats[type] = { views: 0, likes: 0, shares: 0, count: 0 };
      }
      typeStats[type].views += v.views || 0;
      typeStats[type].likes += v.likes || 0;
      typeStats[type].shares += v.shares || 0;
      typeStats[type].count += 1;
    });

    const typeLabels = {
      job_post: 'Job Posts',
      company_culture: 'Culture',
      day_in_life: 'Day in Life',
      tips: 'Tips',
      intro: 'Intro'
    };

    setContentPerformance(Object.entries(typeStats).map(([type, stats]) => ({
      type: typeLabels[type] || type,
      views: stats.views,
      likes: stats.likes,
      engagement: stats.views > 0 ? ((stats.likes + stats.shares) / stats.views * 100).toFixed(1) : 0,
      count: stats.count
    })));

    // Top performing content
    const sorted = [...videos].sort((a, b) => (b.views || 0) - (a.views || 0));
    setTopContent(sorted.slice(0, 5));

    // Audience insights (mock data - would come from real analytics in production)
    setAudienceInsights({
      profileViews: Math.round(videos.reduce((sum, v) => sum + (v.views || 0), 0) * 0.3),
      uniqueViewers: Math.round(videos.reduce((sum, v) => sum + (v.views || 0), 0) * 0.6),
      avgWatchTime: '45s',
      completionRate: '68%'
    });
  };

  const totalViews = videos?.reduce((sum, v) => sum + (v.views || 0), 0) || 0;
  const totalLikes = videos?.reduce((sum, v) => sum + (v.likes || 0), 0) || 0;
  const totalShares = videos?.reduce((sum, v) => sum + (v.shares || 0), 0) || 0;
  const engagementRate = totalViews > 0 ? ((totalLikes + totalShares) / totalViews * 100).toFixed(1) : 0;

  const stats = [
    { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye, color: 'text-blue-500', bgColor: 'bg-blue-50', trend: '+12%' },
    { label: 'Total Likes', value: totalLikes.toLocaleString(), icon: Heart, color: 'text-pink-500', bgColor: 'bg-pink-50', trend: '+8%' },
    { label: 'Shares', value: totalShares.toLocaleString(), icon: Share2, color: 'text-purple-500', bgColor: 'bg-purple-50', trend: '+15%' },
    { label: 'Engagement', value: `${engagementRate}%`, icon: TrendingUp, color: 'text-green-500', bgColor: 'bg-green-50', trend: '+5%' },
  ];

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex gap-2">
        {['7d', '30d', '90d'].map(range => (
          <Badge
            key={range}
            className={`cursor-pointer ${timeRange === range ? 'swipe-gradient text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setTimeRange(range)}
          >
            {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
          </Badge>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-gray-500 text-sm">{stat.label}</p>
                <span className="text-green-500 text-xs font-medium flex items-center gap-0.5">
                  <ArrowUp className="w-3 h-3" /> {stat.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Views Over Time Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-pink-500" />
            Views Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={viewsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" fontSize={12} stroke="#9ca3af" />
                <YAxis fontSize={12} stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#FF005C" 
                  strokeWidth={3}
                  dot={{ fill: '#FF005C', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: '#FF005C' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Content Type Performance */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Performance by Content Type</CardTitle>
          </CardHeader>
          <CardContent>
            {contentPerformance.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={contentPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" fontSize={12} stroke="#9ca3af" />
                    <YAxis type="category" dataKey="type" fontSize={12} stroke="#9ca3af" width={80} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="views" fill="#FF005C" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No content data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performing Content */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Top Performing Content</CardTitle>
          </CardHeader>
          <CardContent>
            {topContent.length > 0 ? (
              <div className="space-y-3">
                {topContent.map((video, i) => (
                  <div key={video.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      {video.thumbnail_url || video.video_url ? (
                        <video src={video.video_url} className="w-full h-full object-cover" muted />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <span className="text-white font-bold">#{i + 1}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {video.caption || 'Untitled'}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {(video.views || 0).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" /> {video.likes || 0}
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {video.type?.replace('_', ' ') || 'video'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400">
                No videos posted yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Audience Insights */}
      {audienceInsights && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-500" />
              Audience Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-gray-900">{audienceInsights.profileViews.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Profile Views</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-gray-900">{audienceInsights.uniqueViewers.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Unique Viewers</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-gray-900">{audienceInsights.avgWatchTime}</p>
                <p className="text-sm text-gray-500">Avg. Watch Time</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-gray-900">{audienceInsights.completionRate}</p>
                <p className="text-sm text-gray-500">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>
    </div>
  );
}
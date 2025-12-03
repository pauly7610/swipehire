import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Heart, Share2, MessageCircle, TrendingUp, Users } from 'lucide-react';

export default function VideoAnalytics({ posts, user }) {
  const userPosts = posts.filter(p => p.author_id === user?.id);
  
  const totalViews = userPosts.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalLikes = userPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
  const totalShares = userPosts.reduce((sum, p) => sum + (p.shares || 0), 0);
  const totalComments = userPosts.reduce((sum, p) => sum + (p.comments_count || 0), 0);
  const engagementRate = totalViews > 0 ? ((totalLikes + totalComments + totalShares) / totalViews * 100).toFixed(1) : 0;

  const stats = [
    { label: 'Total Views', value: totalViews, icon: Eye, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Likes', value: totalLikes, icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50' },
    { label: 'Shares', value: totalShares, icon: Share2, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Comments', value: totalComments, icon: MessageCircle, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {stats.map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-gray-600">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>
      
      <div className="bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-pink-500" />
          <span className="text-xs text-gray-600">Engagement Rate</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{engagementRate}%</p>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Users className="w-4 h-4" />
        <span>{userPosts.length} videos posted</span>
      </div>
    </div>
  );
}
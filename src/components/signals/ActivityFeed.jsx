import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Heart, MessageCircle, Calendar, User, Briefcase } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ActivityFeed({ candidateId, userId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [candidateId, userId]);

  const loadActivities = async () => {
    try {
      // Fetch all relevant activity signals
      const [signals, swipes, messages, interviews] = await Promise.all([
        base44.entities.InterestSignal.filter({ candidate_id: candidateId }),
        base44.entities.Swipe.filter({ target_id: candidateId, direction: 'right' }),
        base44.entities.DirectMessage.filter({ receiver_id: userId }),
        base44.entities.Interview.filter({ candidate_id: candidateId })
      ]);

      // Transform into activity feed items
      const feedItems = [];

      // Profile views
      const viewSignals = signals.filter(s => s.signal_type === 'view');
      if (viewSignals.length > 0) {
        feedItems.push({
          type: 'view',
          icon: Eye,
          title: 'Profile Viewed',
          description: `Your profile was viewed ${viewSignals.length} time${viewSignals.length > 1 ? 's' : ''}`,
          timestamp: viewSignals[0].created_date,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        });
      }

      // Swipes (interest)
      swipes.forEach(swipe => {
        feedItems.push({
          type: 'swipe',
          icon: Heart,
          title: 'Company Interest',
          description: 'A recruiter expressed interest in your profile',
          timestamp: swipe.created_date,
          color: 'text-pink-600',
          bgColor: 'bg-pink-50'
        });
      });

      // Messages
      const uniqueSenders = [...new Set(messages.map(m => m.sender_id))];
      if (uniqueSenders.length > 0) {
        feedItems.push({
          type: 'message',
          icon: MessageCircle,
          title: 'New Messages',
          description: `You have messages from ${uniqueSenders.length} recruiter${uniqueSenders.length > 1 ? 's' : ''}`,
          timestamp: messages[0]?.created_date,
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        });
      }

      // Interview requests
      interviews.forEach(interview => {
        feedItems.push({
          type: 'interview',
          icon: Calendar,
          title: 'Interview Request',
          description: interview.status === 'scheduled' ? 'Interview scheduled' : 'Interview invitation received',
          timestamp: interview.created_date,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50'
        });
      });

      // Sort by timestamp
      feedItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setActivities(feedItems.slice(0, 10)); // Show last 10 activities
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <p>Loading activity...</p>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-gray-500">
          <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No activity yet</p>
          <p className="text-sm mt-1">When recruiters view your profile or reach out, you'll see it here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <p className="text-sm text-gray-500">Recruiter engagement with your profile</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, idx) => {
            const Icon = activity.icon;
            return (
              <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${activity.bgColor} border border-gray-200`}>
                <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 ${activity.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
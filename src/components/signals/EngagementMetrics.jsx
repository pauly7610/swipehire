import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Users, MessageCircle, Calendar, Clock } from 'lucide-react';

export default function EngagementMetrics({ signal }) {
  if (!signal) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <p>No engagement data available yet</p>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      label: 'Response Rate',
      value: signal.message_reply_rate ? `${Math.round(signal.message_reply_rate)}%` : 'N/A',
      icon: MessageCircle,
      color: signal.message_reply_rate > 75 ? 'text-green-600' : signal.message_reply_rate > 50 ? 'text-yellow-600' : 'text-gray-600'
    },
    {
      label: 'Avg Response Time',
      value: signal.avg_response_time_hours ? `${Math.round(signal.avg_response_time_hours)}h` : 'N/A',
      icon: Clock,
      color: signal.avg_response_time_hours < 24 ? 'text-green-600' : signal.avg_response_time_hours < 48 ? 'text-yellow-600' : 'text-gray-600'
    },
    {
      label: 'Interview Follow-Through',
      value: signal.interview_follow_through_rate ? `${Math.round(signal.interview_follow_through_rate)}%` : 'N/A',
      icon: Calendar,
      color: signal.interview_follow_through_rate > 80 ? 'text-green-600' : signal.interview_follow_through_rate > 60 ? 'text-yellow-600' : 'text-gray-600'
    },
    {
      label: 'Active Conversations',
      value: signal.active_conversations || 0,
      icon: Users,
      color: 'text-blue-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Engagement Metrics</CardTitle>
        <p className="text-sm text-gray-500">Observable signals from your recruitment activity</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${metric.color}`} />
                  <span className="text-xs font-medium text-gray-600">{metric.label}</span>
                </div>
                <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>What this means:</strong> These metrics help candidates understand your responsiveness and engagement patterns. Higher rates build trust and encourage applications.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
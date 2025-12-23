import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap, Users, MessageCircle, Calendar } from 'lucide-react';

export default function IntentBadge({ intentType, compact = false }) {
  const intentConfig = {
    'mutual_engagement': {
      icon: Zap,
      text: 'Mutual Interest',
      color: 'bg-green-100 text-green-700 border-green-300'
    },
    'high_response_rate': {
      icon: MessageCircle,
      text: 'Responsive',
      color: 'bg-blue-100 text-blue-700 border-blue-300'
    },
    'active_recruiter': {
      icon: Users,
      text: 'Active Recruiter',
      color: 'bg-purple-100 text-purple-700 border-purple-300'
    },
    'interview_scheduled': {
      icon: Calendar,
      text: 'Interview Scheduled',
      color: 'bg-orange-100 text-orange-700 border-orange-300'
    }
  };

  const config = intentConfig[intentType];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.color} flex items-center gap-1.5`}>
      <Icon className="w-3.5 h-3.5" />
      {!compact && <span>{config.text}</span>}
    </Badge>
  );
}
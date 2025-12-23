import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, CheckCircle2, Eye, Video } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function CandidateSignalBadge({ signal, compact = false }) {
  if (!signal) return null;

  const getResponsivenessConfig = () => {
    switch (signal.responsiveness_score) {
      case 'high':
        return {
          icon: Zap,
          text: 'High Response Rate',
          color: 'bg-green-100 text-green-700 border-green-200',
          description: `Typically responds within ${Math.round(signal.avg_response_time_hours || 0)}h`
        };
      case 'medium':
        return {
          icon: Clock,
          text: 'Medium Response Rate',
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          description: `Typically responds within ${Math.round(signal.avg_response_time_hours || 0)}h`
        };
      case 'low':
        return {
          icon: Clock,
          text: 'Slow Response Rate',
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          description: `Typically responds within ${Math.round(signal.avg_response_time_hours || 0)}h`
        };
      default:
        return null;
    }
  };

  const config = getResponsivenessConfig();
  if (!config) return null;

  const Icon = config.icon;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`${config.color} flex items-center gap-1 text-xs`}>
              <Icon className="w-3 h-3" />
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">{config.text}</p>
            <p className="text-xs text-gray-500">{config.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`${config.color} flex items-center gap-1.5`}>
            <Icon className="w-3.5 h-3.5" />
            <span>{config.text}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">{config.description}</p>
            {signal.message_reply_rate > 0 && (
              <p className="text-xs">Reply rate: {Math.round(signal.message_reply_rate)}%</p>
            )}
            {signal.profile_view_count > 0 && (
              <p className="text-xs flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {signal.profile_view_count} profile views
              </p>
            )}
            {signal.video_view_count > 0 && (
              <p className="text-xs flex items-center gap-1">
                <Video className="w-3 h-3" />
                {signal.video_view_count} video views
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
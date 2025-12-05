import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Eye, Users, Calendar, Gift, CheckCircle2, XCircle, 
  Clock, MessageCircle, Video
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const STAGES = [
  { key: 'applied', label: 'Applied', icon: FileText, color: 'blue' },
  { key: 'viewed', label: 'Viewed', icon: Eye, color: 'purple' },
  { key: 'shortlisted', label: 'Shortlisted', icon: Users, color: 'amber' },
  { key: 'interviewing', label: 'Interview', icon: Calendar, color: 'indigo' },
  { key: 'offered', label: 'Offer', icon: Gift, color: 'green' },
  { key: 'hired', label: 'Hired', icon: CheckCircle2, color: 'green' }
];

export default function ApplicationStatusTimeline({ application, statusHistory = [] }) {
  const currentStatus = application?.status || 'applied';
  const isRejected = currentStatus === 'rejected';
  const isWithdrawn = currentStatus === 'withdrawn';
  const currentStageIndex = STAGES.findIndex(s => s.key === currentStatus);

  // Generate timeline events from status history or create default
  const events = statusHistory.length > 0 ? statusHistory : [
    { status: 'applied', date: application?.created_date, message: 'Application submitted' }
  ];

  return (
    <div className="space-y-4">
      {/* Visual Pipeline */}
      <div className="flex items-center gap-1">
        {STAGES.map((stage, i) => {
          const isComplete = i <= currentStageIndex && !isRejected && !isWithdrawn;
          const isCurrent = i === currentStageIndex;
          const StageIcon = stage.icon;

          return (
            <React.Fragment key={stage.key}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className={`
                  relative flex items-center justify-center w-8 h-8 rounded-full transition-all
                  ${isComplete 
                    ? 'swipe-gradient text-white' 
                    : 'bg-gray-100 text-gray-400'
                  }
                  ${isCurrent ? 'ring-4 ring-pink-200' : ''}
                `}
              >
                <StageIcon className="w-4 h-4" />
                {isCurrent && (
                  <motion.div
                    className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <span className="text-xs font-medium text-pink-600">{stage.label}</span>
                  </motion.div>
                )}
              </motion.div>
              {i < STAGES.length - 1 && (
                <div className={`flex-1 h-1 rounded ${isComplete && i < currentStageIndex ? 'swipe-gradient' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Status Badge */}
      {(isRejected || isWithdrawn) && (
        <div className="mt-8">
          <Badge className={isRejected ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}>
            <XCircle className="w-3 h-3 mr-1" />
            {isRejected ? 'Not Selected' : 'Withdrawn'}
          </Badge>
        </div>
      )}

      {/* Timeline Events */}
      <div className="mt-10 space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Activity</h4>
        <div className="relative pl-6 border-l-2 border-gray-200 space-y-4">
          {events.map((event, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-white border-2 border-pink-500" />
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 text-sm capitalize">
                    {event.status?.replace('_', ' ') || 'Update'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {event.date ? formatDistanceToNow(new Date(event.date), { addSuffix: true }) : 'Just now'}
                  </span>
                </div>
                {event.message && (
                  <p className="text-sm text-gray-600 mt-1">{event.message}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Compact version for list views
export function ApplicationStatusBadge({ status }) {
  const config = {
    applied: { color: 'bg-blue-100 text-blue-700', icon: FileText, label: 'Applied' },
    viewed: { color: 'bg-purple-100 text-purple-700', icon: Eye, label: 'Viewed' },
    matched: { color: 'bg-purple-100 text-purple-700', icon: Eye, label: 'Matched' },
    shortlisted: { color: 'bg-amber-100 text-amber-700', icon: Users, label: 'Shortlisted' },
    interviewing: { color: 'bg-indigo-100 text-indigo-700', icon: Calendar, label: 'Interviewing' },
    offered: { color: 'bg-green-100 text-green-700', icon: Gift, label: 'Offer Received' },
    hired: { color: 'swipe-gradient text-white', icon: CheckCircle2, label: 'Hired!' },
    rejected: { color: 'bg-gray-100 text-gray-500', icon: XCircle, label: 'Not Selected' },
    withdrawn: { color: 'bg-gray-100 text-gray-400', icon: XCircle, label: 'Withdrawn' }
  };

  const { color, icon: Icon, label } = config[status] || config.applied;

  return (
    <Badge className={color}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  );
}

// Real-time status indicator
export function LiveStatusIndicator({ status, lastUpdate }) {
  const isActive = ['applied', 'viewed', 'shortlisted', 'interviewing', 'offered'].includes(status);
  
  return (
    <div className="flex items-center gap-2">
      {isActive && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
      )}
      <span className="text-xs text-gray-500">
        {lastUpdate ? `Updated ${formatDistanceToNow(new Date(lastUpdate), { addSuffix: true })}` : 'Just applied'}
      </span>
    </div>
  );
}
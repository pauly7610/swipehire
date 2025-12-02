import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, FileVideo, Calendar, Clock, Play, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function InterviewInviteCard({ interview, isCandidate, onAccept, onStartRecording, onJoinCall }) {
  const isLive = interview.interview_type === 'live';
  const isScheduled = interview.status === 'scheduled';
  const isCompleted = interview.status === 'completed';

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100">
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isLive ? 'bg-purple-100' : 'bg-pink-100'
        }`}>
          {isLive ? (
            <Video className="w-6 h-6 text-purple-600" />
          ) : (
            <FileVideo className="w-6 h-6 text-pink-600" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900">
              {isLive ? 'Live Video Interview' : 'Recorded Interview'}
            </h4>
            <Badge variant="secondary" className={
              isCompleted ? 'bg-green-100 text-green-700' :
              isScheduled ? 'bg-blue-100 text-blue-700' :
              'bg-amber-100 text-amber-700'
            }>
              {isCompleted ? 'Completed' : isScheduled ? 'Scheduled' : 'Pending'}
            </Badge>
          </div>

          {isLive && interview.scheduled_at && (
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(interview.scheduled_at), 'MMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {format(new Date(interview.scheduled_at), 'h:mm a')}
              </span>
            </div>
          )}

          {!isLive && interview.questions?.length > 0 && (
            <div className="text-sm text-gray-600 mb-3">
              <p className="font-medium">{interview.questions.length} questions to answer</p>
            </div>
          )}

          {/* Actions */}
          {isCandidate && !isCompleted && (
            <div className="flex gap-2 mt-3">
              {isLive ? (
                <Button
                  onClick={onJoinCall}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Video className="w-4 h-4 mr-2" /> Join Call
                </Button>
              ) : (
                <Button
                  onClick={onStartRecording}
                  size="sm"
                  className="swipe-gradient text-white"
                >
                  <Play className="w-4 h-4 mr-2" /> Start Recording
                </Button>
              )}
            </div>
          )}

          {isCompleted && (
            <div className="flex items-center gap-2 text-green-600 text-sm mt-2">
              <CheckCircle className="w-4 h-4" />
              <span>Interview completed</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
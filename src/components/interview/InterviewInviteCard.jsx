import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, FileVideo, Calendar, Clock, Play, CheckCircle, CalendarDays } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import SelectInterviewSlot from './SelectInterviewSlot';

export default function InterviewInviteCard({ interview, job, company, isCandidate, onAccept, onStartRecording, onJoinCall, onRefresh }) {
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  
  const isLive = interview.interview_type === 'live';
  const isPending = interview.status === 'pending';
  const isConfirmed = interview.status === 'confirmed';
  const isScheduled = interview.status === 'scheduled';
  const isCompleted = interview.status === 'completed';
  const hasAvailableSlots = interview.available_slots?.length > 0;

  const getStatusBadge = () => {
    if (isCompleted) return { className: 'bg-green-100 text-green-700', text: 'Completed' };
    if (isConfirmed) return { className: 'bg-blue-100 text-blue-700', text: 'Confirmed' };
    if (isScheduled) return { className: 'bg-blue-100 text-blue-700', text: 'Scheduled' };
    if (isPending && hasAvailableSlots) return { className: 'bg-amber-100 text-amber-700', text: 'Pick a Time' };
    return { className: 'bg-amber-100 text-amber-700', text: 'Pending' };
  };

  const statusBadge = getStatusBadge();

  return (
    <>
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
              <Badge variant="secondary" className={statusBadge.className}>
                {statusBadge.text}
              </Badge>
            </div>

            {/* Show confirmed/scheduled time */}
            {isLive && (isConfirmed || isScheduled) && interview.scheduled_at && (
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

            {/* Show available slots for candidate to pick */}
            {isCandidate && isPending && hasAvailableSlots && (
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">
                  {interview.available_slots.length} time slot{interview.available_slots.length > 1 ? 's' : ''} available
                </p>
                <div className="flex flex-wrap gap-2">
                  {interview.available_slots.slice(0, 3).map((slot, i) => (
                    <Badge key={i} variant="outline" className="bg-white">
                      {format(parseISO(slot.date), 'MMM d')} at {slot.time}
                    </Badge>
                  ))}
                  {interview.available_slots.length > 3 && (
                    <Badge variant="outline" className="bg-white">
                      +{interview.available_slots.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Show slots sent message for employer */}
            {!isCandidate && isPending && hasAvailableSlots && (
              <p className="text-sm text-gray-500 mb-3">
                Waiting for candidate to select a time...
              </p>
            )}

            {!isLive && interview.questions?.length > 0 && (
              <div className="text-sm text-gray-600 mb-3">
                <p className="font-medium">{interview.questions.length} questions to answer</p>
              </div>
            )}

            {/* Actions */}
            {isCandidate && !isCompleted && (
              <div className="flex gap-2 mt-3">
                {isLive && isPending && hasAvailableSlots && (
                  <Button
                    onClick={() => setShowSlotPicker(true)}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <CalendarDays className="w-4 h-4 mr-2" /> Pick a Time
                  </Button>
                )}
                {isLive && (isConfirmed || isScheduled) && (
                  <Button
                    onClick={onJoinCall}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Video className="w-4 h-4 mr-2" /> Join Call
                  </Button>
                )}
                {!isLive && (
                  <Button
                    onClick={onStartRecording}
                    size="sm"
                    style={{ background: 'linear-gradient(135deg, #FF005C 0%, #FF7B00 100%)' }}
                    className="text-white"
                  >
                    <Play className="w-4 h-4 mr-2" /> Start Recording
                  </Button>
                )}
              </div>
            )}

            {/* Employer can join if confirmed */}
            {!isCandidate && (isConfirmed || isScheduled) && isLive && !isCompleted && (
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={onJoinCall}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Video className="w-4 h-4 mr-2" /> Join Call
                </Button>
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

      {/* Slot Picker Dialog for Candidates */}
      {isCandidate && (
        <SelectInterviewSlot
          open={showSlotPicker}
          onOpenChange={setShowSlotPicker}
          interview={interview}
          job={job}
          company={company}
          onConfirmed={() => {
            setShowSlotPicker(false);
            onRefresh?.();
          }}
        />
      )}
    </>
  );
}
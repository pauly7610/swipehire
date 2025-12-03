import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import LiveVideoCall from '@/components/interview/LiveVideoCall';

export default function VideoCallButton({ 
  match, 
  participant, 
  isRecruiter = false,
  variant = 'default',
  size = 'default',
  className = ''
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [notifying, setNotifying] = useState(false);

  const initiateCall = async () => {
    setNotifying(true);
    try {
      // Notify the other party
      const targetUserId = isRecruiter ? match?.candidate_user_id : match?.company_user_id;
      
      if (targetUserId) {
        await base44.entities.Notification.create({
          user_id: targetUserId,
          type: 'system',
          title: '📹 Incoming Video Call',
          message: `${participant?.name || 'Someone'} is trying to start a video call with you!`,
          match_id: match?.id,
          navigate_to: isRecruiter ? 'Chat' : 'EmployerChat'
        });
      }

      // Send a message in chat
      await base44.entities.Message.create({
        match_id: match?.id,
        sender_id: participant?.id,
        sender_type: isRecruiter ? 'employer' : 'candidate',
        content: '📹 Started a video call',
        message_type: 'system'
      });

      setShowConfirm(false);
      setInCall(true);
    } catch (error) {
      console.error('Failed to initiate call:', error);
    }
    setNotifying(false);
  };

  const endCall = async () => {
    // Send end call message
    if (match?.id) {
      await base44.entities.Message.create({
        match_id: match.id,
        sender_id: participant?.id,
        sender_type: isRecruiter ? 'employer' : 'candidate',
        content: '📹 Video call ended',
        message_type: 'system'
      });
    }
    setInCall(false);
  };

  if (inCall) {
    return (
      <LiveVideoCall
        participant={participant}
        onEnd={endCall}
      />
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setShowConfirm(true)}
      >
        <Video className="w-4 h-4 mr-2" />
        Video Call
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Video Call</DialogTitle>
            <DialogDescription>
              You're about to start a video call with {participant?.name || 'the other party'}. 
              They will be notified and can join the call.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button 
              onClick={initiateCall}
              disabled={notifying}
              className="bg-gradient-to-r from-pink-500 to-orange-500"
            >
              {notifying ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Video className="w-4 h-4 mr-2" />
              )}
              Start Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
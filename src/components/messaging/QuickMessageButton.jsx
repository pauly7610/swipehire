import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/**
 * Quick message button that opens a dialog to send a message
 * Creates connection if needed, then sends message
 */
export default function QuickMessageButton({ 
  targetUserId,
  targetName,
  currentUserId,
  size = 'default',
  variant = 'outline',
  onSent,
  iconOnly = false
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [connectionId, setConnectionId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      checkConnection();
    }
  }, [open, targetUserId, currentUserId]);

  const checkConnection = async () => {
    if (!targetUserId || !currentUserId) return;

    try {
      // Check for existing connection in either direction
      const [sentRequests, receivedRequests] = await Promise.all([
        base44.entities.Connection.filter({ 
          requester_id: currentUserId, 
          receiver_id: targetUserId,
          status: 'accepted'
        }),
        base44.entities.Connection.filter({ 
          requester_id: targetUserId, 
          receiver_id: currentUserId,
          status: 'accepted'
        })
      ]);

      if (sentRequests.length > 0) {
        setConnectionId(sentRequests[0].id);
      } else if (receivedRequests.length > 0) {
        setConnectionId(receivedRequests[0].id);
      }
    } catch (error) {
      console.error('Failed to check connection:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setSending(true);

    try {
      let connId = connectionId;

      // Create connection if doesn't exist
      if (!connId) {
        const connection = await base44.entities.Connection.create({
          requester_id: currentUserId,
          receiver_id: targetUserId,
          status: 'accepted' // Auto-accept for messaging
        });
        connId = connection.id;
        setConnectionId(connId);
      }

      // Send message
      await base44.entities.DirectMessage.create({
        connection_id: connId,
        sender_id: currentUserId,
        receiver_id: targetUserId,
        content: message.trim(),
        is_read: false
      });

      // Notify recipient
      await base44.entities.Notification.create({
        user_id: targetUserId,
        type: 'new_message',
        title: '💬 New Message',
        message: `You have a new message`,
        navigate_to: 'DirectMessages'
      });

      setMessage('');
      setOpen(false);
      if (onSent) onSent();

      // Navigate to messages
      setTimeout(() => {
        navigate(createPageUrl('DirectMessages') + `?connectionId=${connId}`);
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
    setSending(false);
  };

  return (
    <>
      <Button
        size={iconOnly ? 'icon' : size}
        variant={variant}
        onClick={() => setOpen(true)}
        className={iconOnly ? "h-9 w-9 p-0" : ""}
      >
        <MessageCircle className={iconOnly ? "w-4 h-4" : "w-3.5 h-3.5 mr-1.5"} />
        {!iconOnly && "Message"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>Send Message to {targetName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              rows={5}
              className="resize-none"
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || sending}
                className="flex-1 swipe-gradient text-white"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
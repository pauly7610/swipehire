import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Loader2, MessageCircle } from 'lucide-react';

const MESSAGE_TEMPLATES = [
  { id: 'intro', label: 'Introduction', text: "Hi! I came across your profile and was impressed by your background. I'd love to connect and discuss potential opportunities at our company." },
  { id: 'role', label: 'Specific Role', text: "Hi! We have an exciting role that seems like a great fit for your skills and experience. Would you be interested in learning more?" },
  { id: 'network', label: 'Networking', text: "Hi! I'd like to connect with you to expand our professional network. Looking forward to staying in touch!" },
  { id: 'custom', label: 'Custom Message', text: '' }
];

export default function QuickMessageDialog({ 
  open, 
  onOpenChange, 
  recipientId, 
  recipientName, 
  senderId,
  senderName,
  connectionId 
}) {
  const [message, setMessage] = useState(MESSAGE_TEMPLATES[0].text);
  const [template, setTemplate] = useState('intro');
  const [sending, setSending] = useState(false);

  const handleTemplateChange = (templateId) => {
    setTemplate(templateId);
    const selected = MESSAGE_TEMPLATES.find(t => t.id === templateId);
    if (selected) {
      setMessage(selected.text);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !recipientId || !senderId) return;
    
    setSending(true);
    try {
      // Create the message
      await base44.entities.DirectMessage.create({
        connection_id: connectionId || `dm_${senderId}_${recipientId}`,
        sender_id: senderId,
        receiver_id: recipientId,
        content: message.trim(),
        is_read: false
      });

      // Send notification to recipient
      await base44.entities.Notification.create({
        user_id: recipientId,
        type: 'message',
        title: '💬 New Message',
        message: `${senderName || 'Someone'} sent you a message`,
        navigate_to: 'CommunicationHub'
      });

      onOpenChange(false);
      setMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-pink-500" />
            Message {recipientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm text-gray-500">Message Template</Label>
            <Select value={template} onValueChange={handleTemplateChange}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESSAGE_TEMPLATES.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm text-gray-500">Your Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              rows={5}
              className="mt-1"
            />
          </div>

          <Button 
            onClick={sendMessage} 
            disabled={!message.trim() || sending}
            className="w-full swipe-gradient text-white"
          >
            {sending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...</>
            ) : (
              <><Send className="w-4 h-4 mr-2" /> Send Message</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Plus, Edit2, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_TEMPLATES = [
  {
    id: 'interested',
    title: 'Interested in Your Profile',
    message: "Hi! I came across your profile and was really impressed by your background. We have an exciting opportunity that might be a great fit for you. Would you be open to learning more?"
  },
  {
    id: 'video_intro',
    title: 'Loved Your Video',
    message: "I just watched your intro video and I'm impressed! Your experience and personality seem like a perfect fit for our team. I'd love to chat about some opportunities we have."
  },
  {
    id: 'skills_match',
    title: 'Skills Match',
    message: "Your skills in {{skills}} caught my attention! We're looking for someone with exactly your background. Would you be interested in a quick chat to discuss?"
  },
  {
    id: 'culture_fit',
    title: 'Culture Fit',
    message: "Based on your profile, I think you'd be a great culture fit for our team at {{company}}. We value the same things you mentioned - would love to tell you more about us!"
  }
];

export default function QuickMessageTemplates({ 
  candidate, 
  candidateUser, 
  company, 
  job, 
  onSent,
  trigger 
}) {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [generating, setGenerating] = useState(false);

  const processTemplate = (template) => {
    let message = template.message;
    message = message.replace('{{skills}}', candidate?.skills?.slice(0, 3).join(', ') || 'your skills');
    message = message.replace('{{company}}', company?.name || 'our company');
    message = message.replace('{{job}}', job?.title || 'the position');
    message = message.replace('{{name}}', candidateUser?.full_name || 'there');
    return message;
  };

  const generatePersonalizedMessage = async () => {
    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a personalized, friendly outreach message from a recruiter to a candidate. Keep it under 3 sentences.

Candidate Info:
- Name: ${candidateUser?.full_name || 'Candidate'}
- Skills: ${candidate?.skills?.join(', ') || 'N/A'}
- Headline: ${candidate?.headline || 'N/A'}
- Experience: ${candidate?.experience_years || 0} years

Company: ${company?.name || 'Our Company'}
Job: ${job?.title || 'Open Position'}

Make it warm, professional, and show genuine interest. Don't be too formal.`,
        response_json_schema: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      });
      setCustomMessage(result.message);
      setShowCustom(true);
    } catch (error) {
      console.error('Failed to generate message:', error);
    }
    setGenerating(false);
  };

  const sendQuickMessage = async (message) => {
    if (!message.trim() || !candidate || !candidateUser) return;
    
    setSending(true);
    try {
      // Create a pre-match message notification
      await base44.entities.Notification.create({
        user_id: candidateUser.id,
        type: 'message',
        title: `💬 ${company?.name || 'A recruiter'} sent you a message`,
        message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
        job_id: job?.id,
        navigate_to: 'BrowseJobs'
      });

      // Store the quick message for later (when they match)
      await base44.entities.Message.create({
        match_id: `prematch_${candidate.id}_${company?.id || 'unknown'}`,
        sender_id: company?.user_id,
        sender_type: 'employer',
        content: message,
        message_type: 'text'
      });

      setOpen(false);
      setSelectedTemplate(null);
      setCustomMessage('');
      onSent?.();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
    setSending(false);
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setOpen(true)}
          className="gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          Quick Message
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-pink-500" />
              Send Quick Message to {candidateUser?.full_name || 'Candidate'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* AI Generate Button */}
            <Button
              variant="outline"
              className="w-full justify-center gap-2 border-dashed"
              onClick={generatePersonalizedMessage}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-pink-500" />
              )}
              Generate AI Personalized Message
            </Button>

            {/* Template Options */}
            {!showCustom && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Or choose a template:</p>
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {DEFAULT_TEMPLATES.map((template) => (
                    <Card
                      key={template.id}
                      className={`p-3 cursor-pointer transition-all hover:border-pink-300 ${
                        selectedTemplate?.id === template.id 
                          ? 'border-pink-500 bg-pink-50' 
                          : ''
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <p className="font-medium text-sm mb-1">{template.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {processTemplate(template)}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Custom/Selected Message */}
            {(showCustom || selectedTemplate) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {showCustom ? 'Your Message' : 'Edit Message'}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCustom(false);
                      setSelectedTemplate(null);
                      setCustomMessage('');
                    }}
                  >
                    Back to Templates
                  </Button>
                </div>
                <Textarea
                  value={showCustom ? customMessage : processTemplate(selectedTemplate)}
                  onChange={(e) => {
                    if (showCustom) {
                      setCustomMessage(e.target.value);
                    } else {
                      setCustomMessage(e.target.value);
                      setShowCustom(true);
                    }
                  }}
                  rows={4}
                  placeholder="Write your message..."
                  className="resize-none"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => sendQuickMessage(
                showCustom ? customMessage : (selectedTemplate ? processTemplate(selectedTemplate) : '')
              )}
              disabled={sending || (!showCustom && !selectedTemplate)}
              className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
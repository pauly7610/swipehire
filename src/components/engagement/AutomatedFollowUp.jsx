import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Mail, Sparkles, Loader2, CheckCircle, Clock, 
  Send, MessageSquare, Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AutomatedFollowUp({ candidate, matches, user }) {
  const [generating, setGenerating] = useState(false);
  const [messages, setMessages] = useState([]);
  const [autoEnabled, setAutoEnabled] = useState(false);

  useEffect(() => {
    if (candidate && matches?.length > 0) {
      generateFollowUps();
    }
  }, [candidate, matches]);

  const generateFollowUps = async () => {
    if (!candidate || !matches?.length) return;
    
    setGenerating(true);
    try {
      const pendingMatches = matches.filter(m => m.status === 'matched');
      const interviewingMatches = matches.filter(m => m.status === 'interviewing');
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate personalized follow-up messages for a job candidate.

Candidate: ${candidate.headline || 'Job Seeker'}
Skills: ${candidate.skills?.slice(0, 5).join(', ') || 'Various'}

Current application statuses:
- ${pendingMatches.length} pending matches (waiting for response)
- ${interviewingMatches.length} in interview stage

Generate 2-3 short, encouraging follow-up message templates based on their status. 
Messages should be warm, professional, and action-oriented.
Keep each message under 100 words.`,
        response_json_schema: {
          type: 'object',
          properties: {
            messages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['match_reminder', 'interview_prep', 'profile_tip', 'encouragement'] },
                  subject: { type: 'string' },
                  body: { type: 'string' },
                  timing: { type: 'string' }
                }
              }
            }
          }
        }
      });

      setMessages(result.messages || []);
    } catch (error) {
      console.error('Failed to generate follow-ups:', error);
    }
    setGenerating(false);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'match_reminder': return <Bell className="w-4 h-4 text-pink-500" />;
      case 'interview_prep': return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'profile_tip': return <Sparkles className="w-4 h-4 text-amber-500" />;
      default: return <Mail className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTypeBadge = (type) => {
    const colors = {
      match_reminder: 'bg-pink-100 text-pink-700',
      interview_prep: 'bg-purple-100 text-purple-700',
      profile_tip: 'bg-amber-100 text-amber-700',
      encouragement: 'bg-blue-100 text-blue-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="w-5 h-5 text-pink-500" />
            Smart Follow-ups
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Auto-send</span>
            <Switch checked={autoEnabled} onCheckedChange={setAutoEnabled} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {generating ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-pink-500 mr-2" />
            <span className="text-gray-500">Generating personalized messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No follow-ups needed right now</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(msg.type)}
                      <Badge className={getTypeBadge(msg.type)} variant="secondary">
                        {msg.type?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {msg.timing}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">{msg.subject}</h4>
                  <p className="text-sm text-gray-600">{msg.body}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
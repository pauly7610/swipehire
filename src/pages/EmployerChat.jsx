import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Send, ArrowLeft, User, Briefcase, Calendar, Video, 
  FileText, CheckCircle2, Clock, Loader2, MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function EmployerChat() {
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get('matchId');
  
  const [match, setMatch] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [candidateUser, setCandidateUser] = useState(null);
  const [job, setJob] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (matchId) {
      loadChat();
    }
  }, [matchId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChat = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [matchData] = await base44.entities.Match.filter({ id: matchId });
      if (matchData) {
        setMatch(matchData);

        const [candidateData] = await base44.entities.Candidate.filter({ id: matchData.candidate_id });
        setCandidate(candidateData);

        if (candidateData) {
          const [userData] = await base44.entities.User.filter({ id: candidateData.user_id });
          setCandidateUser(userData);
        }

        const [jobData] = await base44.entities.Job.filter({ id: matchData.job_id });
        setJob(jobData);

        const chatMessages = await base44.entities.Message.filter({ match_id: matchId });
        setMessages(chatMessages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
    setLoading(false);
  };

  const sendMessage = async (content = newMessage, messageType = 'text') => {
    if (!content.trim() && messageType === 'text') return;
    
    setSending(true);
    try {
      const message = await base44.entities.Message.create({
        match_id: matchId,
        sender_id: user.id,
        sender_type: 'employer',
        content: content || newMessage,
        message_type: messageType
      });
      setMessages([...messages, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
    setSending(false);
  };

  const sendInterviewInvite = () => {
    sendMessage("Hi! We'd love to schedule an interview with you for the " + job?.title + " position. Please let us know your availability.", 'interview_invite');
    base44.entities.Match.update(matchId, { status: 'interviewing' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link to={createPageUrl('EmployerMatches')} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>

          {candidate?.photo_url ? (
            <img src={candidate.photo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
              <User className="w-6 h-6 text-pink-400" />
            </div>
          )}

          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">{candidateUser?.full_name || 'Candidate'}</h2>
            <p className="text-sm text-gray-500">{candidate?.headline}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={sendInterviewInvite}>
                <Calendar className="w-4 h-4 mr-2" /> Send Interview Invite
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="w-4 h-4 mr-2" /> View Resume
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Video className="w-4 h-4 mr-2" /> Start Video Call
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Candidate Info Card */}
      <div className="p-4 bg-gradient-to-r from-pink-50 to-orange-50">
        <div className="max-w-2xl mx-auto">
          <Card className="p-4 border-0 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Briefcase className="w-4 h-4" />
                  <span>Applying for: {job?.title}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {candidate?.skills?.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs bg-white">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              <Badge className="bg-green-100 text-green-700">
                {match?.match_score || 85}% Match
              </Badge>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <div className="max-w-2xl mx-auto flex gap-2 overflow-x-auto">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={sendInterviewInvite}
            className="whitespace-nowrap"
          >
            <Calendar className="w-4 h-4 mr-2" /> Schedule Interview
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="whitespace-nowrap"
          >
            <Video className="w-4 h-4 mr-2" /> Video Call
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="whitespace-nowrap"
          >
            <FileText className="w-4 h-4 mr-2" /> Request Resume
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full swipe-gradient mx-auto flex items-center justify-center mb-4">
                <span className="text-3xl">💼</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Start the conversation!</h3>
              <p className="text-gray-500 text-sm">
                Reach out to {candidateUser?.full_name || 'this candidate'} about the {job?.title} position.
              </p>
            </div>
          )}

          <AnimatePresence>
            {messages.map((message) => {
              const isMe = message.sender_type === 'employer';
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      isMe 
                        ? 'swipe-gradient text-white rounded-br-md' 
                        : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                    }`}
                  >
                    {message.message_type === 'interview_invite' && (
                      <div className={`flex items-center gap-2 mb-2 pb-2 border-b ${isMe ? 'border-white/20' : 'border-gray-200'}`}>
                        <Calendar className="w-4 h-4" />
                        <span className="font-semibold">Interview Invitation</span>
                      </div>
                    )}
                    <p>{message.content}</p>
                    <p className={`text-xs mt-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                      {format(new Date(message.created_date), 'h:mm a')}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0">
        <div className="max-w-2xl mx-auto">
          <form 
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="flex items-center gap-3"
          >
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 h-12 rounded-full border-gray-200 px-4"
            />
            <Button 
              type="submit" 
              disabled={!newMessage.trim() || sending}
              className="w-12 h-12 rounded-full swipe-gradient p-0"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
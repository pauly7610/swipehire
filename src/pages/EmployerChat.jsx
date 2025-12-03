import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, ArrowLeft, User, Briefcase, Calendar, Video, 
  FileText, CheckCircle2, Clock, Loader2, MoreVertical, FileVideo, Play,
  Save, StickyNote, ChevronDown, ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SendInterviewSlots from '@/components/interview/SendInterviewSlots';
import LiveVideoRoom from '@/components/interview/LiveVideoRoom';
import InterviewInviteCard from '@/components/interview/InterviewInviteCard';

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
  const [interviews, setInterviews] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showLiveCall, setShowLiveCall] = useState(false);
  const [activeInterview, setActiveInterview] = useState(null);
  const [company, setCompany] = useState(null);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
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
        setNotes(matchData.notes || '');

        const [candidateData] = await base44.entities.Candidate.filter({ id: matchData.candidate_id });
        setCandidate(candidateData);

        if (candidateData) {
          const [userData] = await base44.entities.User.filter({ id: candidateData.user_id });
          setCandidateUser(userData);
        }

        const [jobData] = await base44.entities.Job.filter({ id: matchData.job_id });
        setJob(jobData);

        const [companyData] = await base44.entities.Company.filter({ id: matchData.company_id });
        setCompany(companyData);

        const chatMessages = await base44.entities.Message.filter({ match_id: matchId });
        setMessages(chatMessages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));

        // Load interviews
        const matchInterviews = await base44.entities.Interview.filter({ match_id: matchId });
        setInterviews(matchInterviews);
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
    setLoading(false);
  };

  const handleSlotsSent = () => {
    setShowScheduleModal(false);
    loadChat();
  };

  const handleJoinCall = (interview) => {
    setActiveInterview(interview);
    setShowLiveCall(true);
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
      
      // Create notification for candidate
      if (candidate?.user_id) {
        await base44.entities.Notification.create({
          user_id: candidate.user_id,
          type: 'message',
          title: 'New Message',
          message: `You have a new message about ${job?.title || 'a position'}`,
          match_id: matchId,
          job_id: job?.id
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
    setSending(false);
  };

  const sendInterviewInvite = () => {
    setShowScheduleModal(true);
  };

  const saveNotes = async () => {
    if (!match?.id) return;
    setSavingNotes(true);
    try {
      await base44.entities.Match.update(match.id, { notes });
      setMatch({ ...match, notes });
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
    setSavingNotes(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  if (showLiveCall) {
    return (
      <LiveVideoRoom
        interview={activeInterview}
        candidate={candidate}
        candidateUser={candidateUser}
        job={job}
        company={company}
        isRecruiter={true}
        onEnd={() => {
          setShowLiveCall(false);
          setActiveInterview(null);
          loadChat();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>

      {/* Send Interview Slots Modal */}
      <SendInterviewSlots
        open={showScheduleModal}
        onOpenChange={setShowScheduleModal}
        match={match}
        candidate={candidate}
        job={job}
        company={company}
        onSent={handleSlotsSent}
      />

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
            onClick={() => setShowScheduleModal(true)}
            className="whitespace-nowrap"
          >
            <Calendar className="w-4 h-4 mr-2" /> Schedule Interview
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setShowLiveCall(true)}
            className="whitespace-nowrap"
          >
            <Video className="w-4 h-4 mr-2" /> Video Call Now
          </Button>
          <Button 
            size="sm" 
            variant={showNotes ? "default" : "outline"}
            onClick={() => setShowNotes(!showNotes)}
            className={`whitespace-nowrap ${showNotes ? 'swipe-gradient text-white' : ''}`}
          >
            <StickyNote className="w-4 h-4 mr-2" /> Notes
            {showNotes ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>

      {/* Notes Section - Only visible to employer */}
      {showNotes && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                <StickyNote className="w-4 h-4" />
                Private Notes (only you can see this)
              </p>
              <Button 
                size="sm" 
                onClick={saveNotes}
                disabled={savingNotes}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {savingNotes ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                Save
              </Button>
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add private notes about this candidate... (interview feedback, impressions, follow-up items)"
              className="bg-white border-amber-200 min-h-[100px] text-sm"
            />
          </div>
        </div>
      )}

      {/* Interview Cards */}
      {interviews.length > 0 && (
        <div className="px-4 py-3 bg-gray-50">
          <div className="max-w-2xl mx-auto space-y-3">
            {interviews.map((interview) => (
              <InterviewInviteCard
                key={interview.id}
                interview={interview}
                job={job}
                company={company}
                isCandidate={false}
                onJoinCall={() => handleJoinCall(interview)}
              />
            ))}
          </div>
        </div>
      )}

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
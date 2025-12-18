import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, ArrowLeft, Building2, Briefcase, Calendar, Video, 
  CheckCircle2, Clock, Loader2, MoreVertical, FileVideo, Play, Phone, FileText, Save, X
} from 'lucide-react';
import VideoCallButton from '@/components/messaging/VideoCallButton';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import RecordedInterview from '@/components/interview/RecordedInterview';
import LiveVideoRoom from '@/components/interview/LiveVideoRoom';
import InterviewInviteCard from '@/components/interview/InterviewInviteCard';
import ResumeViewer from '@/components/profile/ResumeViewer';

export default function Chat() {
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get('matchId');
  
  const [match, setMatch] = useState(null);
  const [company, setCompany] = useState(null);
  const [job, setJob] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [showRecordedInterview, setShowRecordedInterview] = useState(false);
  const [showLiveCall, setShowLiveCall] = useState(false);
  const [activeInterview, setActiveInterview] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [showResumePanel, setShowResumePanel] = useState(false);
  const [interviewNotes, setInterviewNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (matchId) {
      loadChat();
    }
  }, [matchId]);

  // Real-time polling for new messages
  useEffect(() => {
    if (!matchId) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const chatMessages = await base44.entities.Message.filter({ match_id: matchId });
        const sortedMessages = chatMessages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        if (sortedMessages.length !== messages.length) {
          setMessages(sortedMessages);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [matchId, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChat = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const matchData = await base44.entities.Match.filter({ id: matchId });
      if (matchData.length > 0) {
        setMatch(matchData[0]);

        const [companyData] = await base44.entities.Company.filter({ id: matchData[0].company_id });
        setCompany(companyData);

        const [jobData] = await base44.entities.Job.filter({ id: matchData[0].job_id });
        setJob(jobData);

        const [candidateData] = await base44.entities.Candidate.filter({ id: matchData[0].candidate_id });
        setCandidate(candidateData);

        const chatMessages = await base44.entities.Message.filter({ match_id: matchId });
        setMessages(chatMessages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));

        // Load interviews
        const matchInterviews = await base44.entities.Interview.filter({ match_id: matchId });
        setInterviews(matchInterviews);
        
        // Load notes from the first scheduled/confirmed interview if exists
        const activeInterview = matchInterviews.find(i => ['scheduled', 'confirmed'].includes(i.status));
        if (activeInterview?.interviewer_notes) {
          setInterviewNotes(activeInterview.interviewer_notes);
        }
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
    setLoading(false);
  };

  const saveNotes = async () => {
    const activeInterview = interviews.find(i => ['scheduled', 'confirmed', 'completed'].includes(i.status));
    if (!activeInterview) return;
    
    setSavingNotes(true);
    try {
      await base44.entities.Interview.update(activeInterview.id, {
        interviewer_notes: interviewNotes
      });
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
    setSavingNotes(false);
  };

  const handleStartRecording = (interview) => {
    setActiveInterview(interview);
    setShowRecordedInterview(true);
  };

  const handleJoinLiveCall = (interview) => {
    setActiveInterview(interview);
    setShowLiveCall(true);
  };

  const handleRecordingComplete = async (responses) => {
    // Update interview with recording
    await base44.entities.Interview.update(activeInterview.id, {
      status: 'completed',
      recording_url: responses[0]?.video_url
    });
    
    // Send completion message
    await base44.entities.Message.create({
      match_id: matchId,
      sender_id: user.id,
      sender_type: 'candidate',
      content: '✅ I have completed my video interview responses!',
      message_type: 'system'
    });
    
    setShowRecordedInterview(false);
    setActiveInterview(null);
    loadChat();
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    setSending(true);
    try {
      const message = await base44.entities.Message.create({
        match_id: matchId,
        sender_id: user.id,
        sender_type: 'candidate',
        content: newMessage,
        message_type: 'text'
      });
      setMessages([...messages, message]);
      setNewMessage('');
      
      // Create notification and send email to employer (not the sender)
      if (match?.company_user_id) {
        // Create in-app notification
        await base44.entities.Notification.create({
          user_id: match.company_user_id,
          type: 'message',
          title: 'New Message from Candidate',
          message: `You have a new message about ${job?.title || 'a position'}`,
          match_id: matchId,
          job_id: job?.id,
          navigate_to: 'EmployerChat'
        });

        // Get employer email and send notification
        try {
          const [employerUser] = await base44.entities.User.filter({ id: match.company_user_id });
          if (employerUser?.email) {
            await base44.integrations.Core.SendEmail({
              to: employerUser.email,
              subject: `New message from ${user.full_name || 'a candidate'} - SwipeHire`,
              body: `Hi,\n\nYou have a new message from ${user.full_name || 'a candidate'} about the ${job?.title || 'position'}.\n\nMessage: "${newMessage.substring(0, 100)}${newMessage.length > 100 ? '...' : ''}"\n\nLog in to SwipeHire to respond.\n\nBest,\nSwipeHire Team`
            });
          }
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  if (showRecordedInterview && activeInterview) {
    return (
      <RecordedInterview
        interview={activeInterview}
        onComplete={handleRecordingComplete}
        onClose={() => {
          setShowRecordedInterview(false);
          setActiveInterview(null);
        }}
      />
    );
  }

  if (showLiveCall) {
    return (
      <LiveVideoRoom
        interview={activeInterview}
        candidate={candidate}
        candidateUser={user}
        job={job}
        company={company}
        isRecruiter={false}
        onEnd={() => {
          setShowLiveCall(false);
          setActiveInterview(null);
          loadChat();
        }}
      />
    );
  }

  const hasActiveInterview = interviews.some(i => ['scheduled', 'confirmed'].includes(i.status));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link to={createPageUrl('Matches')} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>

          {company?.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="w-12 h-12 rounded-xl object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-xl swipe-gradient flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          )}

          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">{company?.name || 'Company'}</h2>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              {job?.title || 'Position'}
            </p>
          </div>

          {hasActiveInterview && (
            <Button 
              variant="outline"
              onClick={() => setShowResumePanel(!showResumePanel)}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {showResumePanel ? 'Hide' : 'View'} Resume & Notes
            </Button>
          )}

          <Button variant="ghost" size="icon">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="flex-1 overflow-hidden flex relative">
        {/* Left Side - Chat */}
        <div className={`flex flex-col transition-all duration-300 ${showResumePanel ? 'w-1/2' : 'w-full'}`}>
          {/* Job Info Card */}
          <div className="p-4 bg-gradient-to-r from-pink-50 to-orange-50">
            <div className="max-w-2xl mx-auto space-y-3">
          <Card className="p-4 border-0 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{job?.title}</h3>
                <p className="text-sm text-gray-500">{job?.location} • {job?.job_type}</p>
              </div>
              <Badge className="bg-green-100 text-green-700">
                {match?.match_score || 85}% Match
              </Badge>
            </div>
          </Card>

          {/* Interview Cards */}
          {interviews.map((interview) => (
            <InterviewInviteCard
              key={interview.id}
              interview={interview}
              job={job}
              company={company}
              isCandidate={true}
              onStartRecording={() => handleStartRecording(interview)}
              onJoinCall={() => handleJoinLiveCall(interview)}
              onRefresh={loadChat}
            />
          ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full swipe-gradient mx-auto flex items-center justify-center mb-4">
                <span className="text-3xl">👋</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Start the conversation!</h3>
              <p className="text-gray-500 text-sm">
                Send a message to {company?.name} about the {job?.title} position.
              </p>
            </div>
          )}

          <AnimatePresence>
            {messages.map((message, index) => {
              const isMe = message.sender_type === 'candidate';
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
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/20">
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
          <div className="bg-white border-t border-gray-200 p-4">
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

        {/* Right Side - Resume & Notes Panel */}
        {showResumePanel && hasActiveInterview && (
          <div className="w-1/2 border-l border-gray-200 bg-white flex flex-col shadow-xl">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-pink-500" />
                Interview Materials
              </h3>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowResumePanel(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Resume Viewer */}
            <div className="flex-1 overflow-auto p-4 bg-gray-50">
              {candidate?.resume_url ? (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Candidate Resume</h4>
                  <iframe 
                    src={candidate.resume_url.endsWith('.pdf') 
                      ? candidate.resume_url 
                      : `https://docs.google.com/viewer?url=${encodeURIComponent(candidate.resume_url)}&embedded=true`
                    }
                    className="w-full h-96 rounded-lg border border-gray-200"
                    title="Resume"
                  />
                </div>
              ) : (
                <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200 text-center">
                  <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No resume uploaded yet</p>
                </div>
              )}

              {/* Interview Notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Interview Notes</h4>
                  <Button 
                    size="sm"
                    onClick={saveNotes}
                    disabled={savingNotes}
                    className="swipe-gradient text-white"
                  >
                    {savingNotes ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="Take notes during the interview... These will be saved to the ATS for review later."
                  className="min-h-[300px] resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Notes are automatically saved to the ATS and can be reviewed later in the candidate's profile.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, 
  Maximize2, Minimize2, FileText, Save, User,
  ChevronLeft, ChevronRight, ExternalLink, Loader2,
  Sparkles, CheckCircle2, Mic2, MicOff as MicOffIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function LiveVideoRoom({ interview, candidate, candidateUser, job, company, isRecruiter, onEnd, match, messages = [] }) {
  const [localStream, setLocalStream] = useState(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const [notes, setNotes] = useState(interview?.interviewer_notes || '');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [generatingNotes, setGeneratingNotes] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionStatus, setTranscriptionStatus] = useState('');
  
  const localVideoRef = useRef(null);
  const timerRef = useRef(null);
  const autoSaveRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    startCall();
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Auto-save notes every 30 seconds
    autoSaveRef.current = setInterval(() => {
      if (notes) {
        saveNotes(true);
      }
    }, 30000);

    // Check transcription support on mount
    const hasTranscriptionSupport = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    if (!hasTranscriptionSupport) {
      setTranscriptionStatus('⚠️ Auto-transcription requires Chrome or Edge browser');
    }

    return () => {
      endCall();
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing media:', err);
    }
  };

  const endCall = async () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setInCall(false);
    
    // Save notes before ending
    if (notes) {
      await saveNotes(false);
    }
    
    // Mark interview as completed
    if (interview?.id && isRecruiter) {
      await base44.entities.Interview.update(interview.id, { 
        status: 'completed' 
      });
    }

    // Notify other party that call ended
    if (match?.id) {
      const otherUserId = isRecruiter ? match.candidate_user_id : match.company_user_id;
      await base44.entities.Notification.create({
        user_id: otherUserId,
        type: 'system',
        title: 'Interview Ended',
        message: `${candidateUser?.full_name || company?.name || 'The other party'} has ended the video interview.`,
        match_id: match.id,
        navigate_to: 'CommunicationHub'
      });
    }
    
    if (onEnd) onEnd();
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleTranscription = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Auto-transcription is only supported in Chrome and Edge browsers. Please switch browsers to use this feature.');
      return;
    }

    if (isTranscribing) {
      // Stop transcription
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsTranscribing(false);
      setTranscriptionStatus('');
    } else {
      // Start transcription
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsTranscribing(true);
        setTranscriptionStatus('Listening...');
      };
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          setNotes(prev => {
            const newNote = `[${timestamp}] ${finalTranscript.trim()}\n`;
            return prev ? prev + newNote : newNote;
          });
        }
        
        setTranscriptionStatus(interimTranscript || 'Listening...');
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setTranscriptionStatus('Error: ' + event.error);
        if (event.error === 'no-speech') {
          setTranscriptionStatus('No speech detected');
        }
      };
      
      recognition.onend = () => {
        if (isTranscribing) {
          // Auto-restart if still enabled
          recognition.start();
        }
      };
      
      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const saveNotes = async (isAutoSave = false) => {
    if (saving) return; // Prevent concurrent saves
    
    setSaving(true);
    try {
      // Save to interview if exists
      if (interview?.id) {
        await base44.entities.Interview.update(interview.id, { interviewer_notes: notes });
      }
      
      // Save directly to Match notes (replace, don't append)
      if (match?.id) {
        await base44.entities.Match.update(match.id, { notes: notes });
      }
      
      setLastSaved(new Date());
      
      // Show success popup
      if (!isAutoSave) {
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 2000);
      }
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
    setSaving(false);
  };

  const generateAINotes = async () => {
    setGeneratingNotes(true);
    try {
      const candidateName = candidateUser?.full_name || 'Candidate';
      const jobTitle = job?.title || 'Position';
      const skills = candidate?.skills?.join(', ') || 'Not specified';
      const experience = candidate?.experience?.map(e => `${e.title} at ${e.company}`).join(', ') || 'Not specified';
      
      // Format conversation for AI analysis
      const conversationText = messages.length > 0 
        ? messages.map(m => `${m.sender_type === 'employer' ? 'Recruiter' : 'Candidate'}: ${m.content}`).join('\n')
        : 'No conversation messages yet.';
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this interview conversation and generate professional interview notes for a recruiter.

CANDIDATE INFO:
- Name: ${candidateName}
- Position Applied: ${jobTitle}
- Skills: ${skills}
- Experience: ${experience}
- Interview Duration: ${formatDuration(callDuration)}

CONVERSATION:
${conversationText}

Based on the conversation above, generate detailed interview notes with:
1. **Summary** - Brief overview of the conversation
2. **Key Discussion Points** - Main topics covered
3. **Candidate Strengths** - Positives observed from the conversation
4. **Areas of Concern** - Any red flags or concerns
5. **Technical Assessment** - Based on discussion
6. **Communication Style** - How well they communicated
7. **Next Steps** - Recommended follow-up actions
8. **Overall Impression** - Final assessment

Be specific and reference actual conversation content where possible. Use bullet points.`,
        response_json_schema: {
          type: "object",
          properties: {
            notes: { type: "string" }
          }
        }
      });
      
      const generatedNotes = result.notes || result;
      setNotes(prev => prev ? `${prev}\n\n${generatedNotes}` : generatedNotes);
    } catch (error) {
      console.error('Failed to generate notes:', error);
    }
    setGeneratingNotes(false);
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const participantName = isRecruiter 
    ? candidateUser?.full_name || 'Candidate'
    : company?.name || 'Recruiter';

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>

      {/* Left Panel - Notes */}
      <div className="w-96 bg-white flex flex-col border-r border-gray-200 relative shadow-xl">
        {/* Save Success Popup */}
        <AnimatePresence>
          {showSaveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Notes Saved!
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 border-b bg-gradient-to-r from-pink-50 to-orange-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-pink-500" />
              <h3 className="font-semibold text-gray-900">
                {isRecruiter ? 'Interview Notes' : 'My Notes'}
              </h3>
            </div>
            <Button
              size="sm"
              variant={isTranscribing ? "default" : "outline"}
              onClick={toggleTranscription}
              className={isTranscribing ? "swipe-gradient text-white animate-pulse" : ""}
            >
              {isTranscribing ? (
                <>
                  <MicOffIcon className="w-3 h-3 mr-1" />
                  Stop
                </>
              ) : (
                <>
                  <Mic2 className="w-3 h-3 mr-1" />
                  Auto-Transcribe
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            {isRecruiter ? 'Auto-syncs to candidate profile' : 'Take notes during your interview'}
          </p>
          {isTranscribing && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-gray-600">{transcriptionStatus}</span>
            </div>
          )}
        </div>
        <div className="flex-1 p-4 flex flex-col">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={isRecruiter 
              ? "Take notes during the interview...&#10;&#10;• First impressions&#10;• Technical skills demonstrated&#10;• Communication & presentation&#10;• Questions asked by candidate&#10;• Cultural fit observations&#10;• Red flags / Green flags&#10;• Salary expectations discussed&#10;• Availability & notice period"
              : "Take notes during the interview...&#10;&#10;• Key points discussed&#10;• Questions to ask&#10;• Important details to remember&#10;• Company culture observations&#10;• Next steps&#10;• Follow-up items"
            }
            className="flex-1 resize-none min-h-0 text-sm leading-relaxed"
          />
          <div className="space-y-2 mt-3">
            {isRecruiter && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={generateAINotes}
                disabled={generatingNotes}
                className="w-full"
              >
                {generatingNotes ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Sparkles className="w-3 h-3 mr-1 text-purple-500" />
                )}
                {generatingNotes ? 'Generating...' : 'AI Generate Notes Template'}
              </Button>
            )}
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={() => saveNotes(false)}
                disabled={saving}
                className="flex-1 swipe-gradient text-white"
              >
                {saving ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Save className="w-3 h-3 mr-1" />
                )}
                Save Notes
              </Button>
            </div>
            {lastSaved && (
              <p className="text-xs text-gray-400 text-center">
                Last saved {lastSaved.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Center - Video Area */}
      <div className="flex-1 flex flex-col">
        {/* Remote Video */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full swipe-gradient mx-auto flex items-center justify-center mb-4">
                <span className="text-4xl text-white font-bold">
                  {participantName.charAt(0)}
                </span>
              </div>
              <p className="text-white text-xl font-medium">{participantName}</p>
              <p className="text-white/50">Connecting...</p>
            </div>
          </div>

          {/* Call Duration */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white font-mono">{formatDuration(callDuration)}</span>
          </div>

          {/* Local Video PiP */}
          <motion.div
            drag
            dragConstraints={{ left: 0, right: 300, top: 0, bottom: 300 }}
            className="absolute bottom-28 right-6 w-48 h-64 md:w-64 md:h-80 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/30 cursor-move hover:border-pink-500/50 transition-colors"
          >
            {isVideoOn ? (
              <video
                ref={localVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
                style={{ transform: 'scaleX(-1)' }}
              />
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                <div className="text-center">
                  <VideoOff className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Camera Off</p>
                </div>
              </div>
            )}
            <div className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
              You
            </div>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="p-8 flex items-center justify-center gap-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMic}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all ${
              isMicOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isMicOn ? <Mic className="w-7 h-7 text-white" /> : <MicOff className="w-7 h-7 text-white" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleVideo}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all ${
              isVideoOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isVideoOn ? <Video className="w-7 h-7 text-white" /> : <VideoOff className="w-7 h-7 text-white" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={endCall}
            className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-2xl transition-all"
          >
            <PhoneOff className="w-8 h-8 text-white" />
          </motion.button>
        </div>
      </div>

      {/* Right Panel - Resume */}
      <div className="w-96 bg-white flex flex-col border-l border-gray-200 shadow-xl">
        {/* Candidate Info */}
        <div className="p-4 border-b bg-gradient-to-r from-pink-50 to-orange-50">
          <div className="flex items-center gap-3">
            {candidate?.photo_url ? (
              <img src={candidate.photo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
                <User className="w-6 h-6 text-pink-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{candidateUser?.full_name}</h3>
              <p className="text-sm text-gray-500 truncate">{candidate?.headline}</p>
            </div>
          </div>
          <div className="mt-3">
            <Badge className="bg-white text-pink-600 border border-pink-200">
              {job?.title}
            </Badge>
          </div>
        </div>

        {/* Resume Section */}
        <div className="flex-1 overflow-y-auto p-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-pink-500" />
            Resume & Profile
          </h4>
          
          {candidate?.resume_url ? (
            <div className="space-y-4">
              <a
                href={candidate.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-xl hover:opacity-90 transition-opacity font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Open Full Resume
              </a>
              
              {/* Quick Skills View */}
              {candidate?.skills?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-medium">Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {candidate.skills.slice(0, 10).map((skill, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {candidate.skills.length > 10 && (
                      <Badge variant="outline" className="text-xs">
                        +{candidate.skills.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Experience Summary */}
              {candidate?.experience?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-medium">Experience</p>
                  <div className="space-y-3">
                    {candidate.experience.slice(0, 3).map((exp, i) => (
                      <div key={i} className="text-sm bg-gray-50 rounded-lg p-2">
                        <p className="font-medium text-gray-900">{exp.title}</p>
                        <p className="text-gray-500 text-xs">{exp.company}</p>
                        {exp.start_date && (
                          <p className="text-gray-400 text-xs mt-1">
                            {exp.start_date} - {exp.end_date || 'Present'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {candidate?.bio && (
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-medium">About</p>
                  <p className="text-sm text-gray-600">{candidate.bio}</p>
                </div>
              )}

              {/* Location & Contact */}
              {candidate?.location && (
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  📍 {candidate.location}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No resume uploaded</p>
              
              {/* Still show skills if available */}
              {candidate?.skills?.length > 0 && (
                <div className="mt-4 text-left">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {candidate.skills.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
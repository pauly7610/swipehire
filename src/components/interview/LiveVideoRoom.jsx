import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, 
  Maximize2, Minimize2, FileText, Save, User,
  ChevronLeft, ChevronRight, ExternalLink, Loader2,
  Sparkles, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function LiveVideoRoom({ interview, candidate, candidateUser, job, company, isRecruiter, onEnd, match }) {
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
  
  const localVideoRef = useRef(null);
  const timerRef = useRef(null);
  const autoSaveRef = useRef(null);

  useEffect(() => {
    startCall();
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Auto-save notes every 30 seconds
    autoSaveRef.current = setInterval(() => {
      if (notes && isRecruiter) {
        saveNotes(true);
      }
    }, 30000);

    return () => {
      endCall();
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
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
    }
    // Save notes before ending
    if (notes && isRecruiter) {
      await saveNotes(false);
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

  const saveNotes = async (isAutoSave = false) => {
    if (!isRecruiter) return;
    
    setSaving(true);
    try {
      // Save to interview if exists
      if (interview?.id) {
        await base44.entities.Interview.update(interview.id, { interviewer_notes: notes });
      }
      
      // Also save to Match for the candidate notes page
      if (match?.id) {
        const existingNotes = match.notes || '';
        const timestamp = new Date().toLocaleString();
        const updatedNotes = existingNotes 
          ? `${existingNotes}\n\n--- Interview Notes (${timestamp}) ---\n${notes}`
          : `--- Interview Notes (${timestamp}) ---\n${notes}`;
        await base44.entities.Match.update(match.id, { notes: updatedNotes });
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
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate interview notes template for a recruiter interviewing a candidate.
        
Candidate: ${candidateName}
Position: ${jobTitle}
Skills: ${skills}
Experience: ${experience}
Interview Duration: ${formatDuration(callDuration)}

Create professional interview notes with the following sections:
1. First Impressions
2. Technical Skills Assessment
3. Communication & Soft Skills
4. Culture Fit
5. Key Strengths
6. Areas of Concern
7. Follow-up Questions
8. Overall Recommendation

Keep it concise with bullet points. Leave placeholders like [Add observation] where the recruiter should fill in details.`,
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

      {/* Left Panel - Notes (Recruiter only) */}
      {isRecruiter && (
        <div className="w-80 bg-white flex flex-col border-r border-gray-200 relative">
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
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-pink-500" />
              Interview Notes
            </h3>
            <p className="text-xs text-gray-500 mt-1">Auto-syncs to candidate profile</p>
          </div>
          <div className="flex-1 p-4 flex flex-col">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Take notes during the interview...&#10;&#10;• First impressions&#10;• Technical skills&#10;• Communication&#10;• Questions asked&#10;• Red flags / Green flags"
              className="flex-1 resize-none min-h-0 text-sm"
            />
            <div className="space-y-2 mt-3">
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
      )}

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
            dragConstraints={{ left: 0, right: 200, top: 0, bottom: 200 }}
            className="absolute bottom-24 left-4 w-32 h-44 md:w-48 md:h-64 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20"
          >
            {isVideoOn ? (
              <video
                ref={localVideoRef}
                className="w-full h-full object-cover mirror"
                autoPlay
                muted
                playsInline
                style={{ transform: 'scaleX(-1)' }}
              />
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                <VideoOff className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </motion.div>
        </div>

        {/* Controls */}
        <div className="p-6 flex items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMic}
            className={`w-14 h-14 rounded-full flex items-center justify-center ${
              isMicOn ? 'bg-white/20' : 'bg-red-500'
            }`}
          >
            {isMicOn ? <Mic className="w-6 h-6 text-white" /> : <MicOff className="w-6 h-6 text-white" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center ${
              isVideoOn ? 'bg-white/20' : 'bg-red-500'
            }`}
          >
            {isVideoOn ? <Video className="w-6 h-6 text-white" /> : <VideoOff className="w-6 h-6 text-white" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={endCall}
            className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg"
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </motion.button>
        </div>
      </div>

      {/* Right Panel - Resume */}
      <div className="w-80 bg-white flex flex-col border-l border-gray-200">
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
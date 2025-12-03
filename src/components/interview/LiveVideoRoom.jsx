import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, 
  Maximize2, Minimize2, FileText, Save, User,
  ChevronLeft, ChevronRight, ExternalLink, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function LiveVideoRoom({ interview, candidate, candidateUser, job, company, isRecruiter, onEnd }) {
  const [localStream, setLocalStream] = useState(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const [notes, setNotes] = useState(interview?.interviewer_notes || '');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
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
    if (!isRecruiter || !interview?.id) return;
    
    setSaving(true);
    try {
      await base44.entities.Interview.update(interview.id, { interviewer_notes: notes });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
    setSaving(false);
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

      {/* Main Video Area */}
      <div className={`flex-1 flex flex-col transition-all ${showSidebar ? 'mr-80' : ''}`}>
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

          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70"
          >
            {showSidebar ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>

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

      {/* Sidebar - Resume & Notes */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl flex flex-col"
          >
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
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 border-b">
                <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-pink-500" />
                  Resume
                </h4>
                {candidate?.resume_url ? (
                  <div className="space-y-3">
                    <a
                      href={candidate.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-xl hover:opacity-90 transition-opacity font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Full Resume
                    </a>
                    
                    {/* Quick Skills View */}
                    {candidate?.skills?.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Key Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {candidate.skills.slice(0, 8).map((skill, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience Summary */}
                    {candidate?.experience?.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Recent Experience</p>
                        <div className="space-y-2">
                          {candidate.experience.slice(0, 2).map((exp, i) => (
                            <div key={i} className="text-sm">
                              <p className="font-medium text-gray-900">{exp.title}</p>
                              <p className="text-gray-500">{exp.company}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No resume uploaded</p>
                  </div>
                )}
              </div>

              {/* Notes Section - Only for Recruiter */}
              {isRecruiter && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-pink-500" />
                      Interview Notes
                    </h4>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => saveNotes(false)}
                      disabled={saving}
                      className="h-8"
                    >
                      {saving ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Save className="w-3 h-3 mr-1" />
                      )}
                      Save
                    </Button>
                  </div>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Take notes during the interview... They'll be saved automatically."
                    className="min-h-[200px] resize-none"
                  />
                  {lastSaved && (
                    <p className="text-xs text-gray-400 mt-2">
                      Last saved: {lastSaved.toLocaleTimeString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
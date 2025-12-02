import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Video, VideoOff, Mic, MicOff, Phone, MessageSquare,
  Star, Clock, ChevronRight, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

const FEEDBACK_CRITERIA = [
  { key: 'communication', label: 'Communication Skills' },
  { key: 'technical', label: 'Technical Knowledge' },
  { key: 'problem_solving', label: 'Problem Solving' },
  { key: 'culture_fit', label: 'Culture Fit' },
  { key: 'enthusiasm', label: 'Enthusiasm & Interest' }
];

export default function VideoInterviewRoom({ interview, candidate, job, onEnd, onSubmitFeedback }) {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [duration, setDuration] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({
    ratings: {},
    notes: '',
    recommendation: '',
    strengths: '',
    improvements: ''
  });
  const localVideoRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    startLocalVideo();
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    return () => {
      clearInterval(timerRef.current);
      stopLocalVideo();
    };
  }, []);

  const startLocalVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Failed to access camera:', error);
    }
  };

  const stopLocalVideo = () => {
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    stopLocalVideo();
    clearInterval(timerRef.current);
    setShowFeedback(true);
  };

  const handleSubmitFeedback = () => {
    onSubmitFeedback?.(feedback);
    onEnd?.();
  };

  const setRating = (key, value) => {
    setFeedback(prev => ({
      ...prev,
      ratings: { ...prev.ratings, [key]: value }
    }));
  };

  if (showFeedback) {
    return (
      <div className="min-h-screen bg-gray-900 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-6">Interview Feedback</h2>
              
              {/* Rating Criteria */}
              <div className="space-y-4 mb-6">
                {FEEDBACK_CRITERIA.map(criteria => (
                  <div key={criteria.key} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{criteria.label}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => setRating(criteria.key, star)}
                          className="p-1"
                        >
                          <Star 
                            className={`w-6 h-6 ${
                              (feedback.ratings[criteria.key] || 0) >= star 
                                ? 'fill-amber-400 text-amber-400' 
                                : 'text-gray-300'
                            }`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendation */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Recommendation</label>
                <div className="flex gap-2">
                  {['Strong Hire', 'Hire', 'Maybe', 'No Hire'].map(rec => (
                    <Badge
                      key={rec}
                      className={`cursor-pointer ${
                        feedback.recommendation === rec 
                          ? 'bg-pink-500 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      onClick={() => setFeedback(prev => ({ ...prev, recommendation: rec }))}
                    >
                      {rec}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Key Strengths</label>
                  <Textarea 
                    value={feedback.strengths}
                    onChange={e => setFeedback(prev => ({ ...prev, strengths: e.target.value }))}
                    placeholder="What stood out positively?"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Areas for Improvement</label>
                  <Textarea 
                    value={feedback.improvements}
                    onChange={e => setFeedback(prev => ({ ...prev, improvements: e.target.value }))}
                    placeholder="What could be better?"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Additional Notes</label>
                  <Textarea 
                    value={feedback.notes}
                    onChange={e => setFeedback(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any other observations..."
                    rows={3}
                  />
                </div>
              </div>

              <Button 
                onClick={handleSubmitFeedback}
                className="w-full mt-6"
                style={{ background: 'linear-gradient(135deg, #FF005C 0%, #FF7B00 100%)' }}
              >
                Submit Feedback <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Main Video Area */}
      <div className="flex-1 relative">
        {/* Remote Video (placeholder) */}
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-white">{candidate?.headline?.charAt(0) || 'C'}</span>
            </div>
            <p className="text-white text-lg">Waiting for candidate to join...</p>
          </div>
        </div>

        {/* Local Video (PiP) */}
        <motion.div 
          className="absolute bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden shadow-lg"
          drag
          dragConstraints={{ left: -500, right: 0, top: -300, bottom: 0 }}
        >
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          {!isVideoOn && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </motion.div>

        {/* Interview Info */}
        <div className="absolute top-4 left-4 flex items-center gap-3">
          <Badge className="bg-red-500 text-white animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white mr-2" />
            LIVE
          </Badge>
          <Badge variant="secondary" className="bg-gray-800/80 text-white">
            <Clock className="w-3 h-3 mr-1" />
            {formatDuration(duration)}
          </Badge>
        </div>

        {/* Job Info */}
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="bg-gray-800/80 text-white">
            {job?.title}
          </Badge>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="secondary"
            size="icon"
            className={`rounded-full w-12 h-12 ${!isMicOn ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            onClick={() => setIsMicOn(!isMicOn)}
          >
            {isMicOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className={`rounded-full w-12 h-12 ${!isVideoOn ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            onClick={() => setIsVideoOn(!isVideoOn)}
          >
            {isVideoOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
          </Button>

          <Button
            onClick={handleEndCall}
            className="rounded-full w-14 h-14 bg-red-500 hover:bg-red-600"
          >
            <Phone className="w-6 h-6 text-white rotate-[135deg]" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className="rounded-full w-12 h-12 bg-gray-700 hover:bg-gray-600"
          >
            <MessageSquare className="w-5 h-5 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}
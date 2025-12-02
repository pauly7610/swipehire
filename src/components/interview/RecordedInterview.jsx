import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Video, VideoOff, Mic, MicOff, Play, Square, 
  RotateCcw, Send, CheckCircle, Clock, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function RecordedInterview({ interview, onComplete, onClose }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes max
  const [isPreview, setIsPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState([]);
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const questions = interview?.questions || [
    "Tell us about yourself and your background.",
    "Why are you interested in this position?",
    "What are your greatest strengths?"
  ];

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    await startStream();
    chunksRef.current = [];
    
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm'
    });
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      setRecordedUrl(URL.createObjectURL(blob));
      setIsPreview(true);
    };
    
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    setTimeLeft(300);
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      stopStream();
    }
  };

  const reRecord = async () => {
    setRecordedBlob(null);
    setRecordedUrl(null);
    setIsPreview(false);
    setTimeLeft(300);
    await startStream();
  };

  const submitResponse = async () => {
    if (!recordedBlob) return;
    
    setSubmitting(true);
    try {
      // Upload video
      const { file_url } = await base44.integrations.Core.UploadFile({ 
        file: new File([recordedBlob], `response_${currentQuestionIndex}.webm`, { type: 'video/webm' })
      });
      
      const newResponses = [...responses, { 
        question: questions[currentQuestionIndex], 
        video_url: file_url 
      }];
      setResponses(newResponses);
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setRecordedBlob(null);
        setRecordedUrl(null);
        setIsPreview(false);
        setTimeLeft(300);
      } else {
        // All questions answered
        if (onComplete) {
          onComplete(newResponses);
        }
      }
    } catch (err) {
      console.error('Failed to upload:', err);
    }
    setSubmitting(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>

      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <Button variant="ghost" onClick={onClose} className="text-white">
          <ChevronLeft className="w-5 h-5 mr-1" /> Exit
        </Button>
        <div className="text-white text-center">
          <p className="text-sm text-white/70">Question {currentQuestionIndex + 1} of {questions.length}</p>
        </div>
        <div className="w-20" />
      </div>

      {/* Progress */}
      <div className="px-4">
        <Progress 
          value={((currentQuestionIndex + (recordedBlob ? 1 : 0)) / questions.length) * 100} 
          className="h-1 bg-white/20"
        />
      </div>

      {/* Question */}
      <div className="p-6 text-center">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-6"
        >
          <p className="text-white text-lg font-medium">
            {questions[currentQuestionIndex]}
          </p>
        </motion.div>
      </div>

      {/* Video Area */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="relative w-full max-w-lg aspect-video bg-gray-900 rounded-2xl overflow-hidden">
          {isPreview && recordedUrl ? (
            <video
              src={recordedUrl}
              className="w-full h-full object-cover"
              controls
              autoPlay
            />
          ) : (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
          )}

          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="font-medium">{formatTime(timeLeft)}</span>
            </div>
          )}

          {/* Timer warning */}
          {isRecording && timeLeft < 60 && (
            <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1.5 rounded-full text-sm">
              <Clock className="w-4 h-4 inline mr-1" /> Less than 1 min
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 space-y-4">
        {!isRecording && !isPreview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <Button
              onClick={startRecording}
              className="swipe-gradient text-white h-16 px-8 rounded-full text-lg shadow-lg"
            >
              <Video className="w-6 h-6 mr-2" /> Start Recording
            </Button>
            <p className="text-white/50 text-sm mt-3">Maximum 5 minutes per response</p>
          </motion.div>
        )}

        {isRecording && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <Button
              onClick={stopRecording}
              className="bg-red-500 hover:bg-red-600 text-white h-16 px-8 rounded-full text-lg"
            >
              <Square className="w-6 h-6 mr-2" /> Stop Recording
            </Button>
          </motion.div>
        )}

        {isPreview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center gap-4">
            <Button
              onClick={reRecord}
              variant="outline"
              className="h-14 px-6 rounded-full border-white/30 text-white hover:bg-white/10"
            >
              <RotateCcw className="w-5 h-5 mr-2" /> Re-record
            </Button>
            <Button
              onClick={submitResponse}
              disabled={submitting}
              className="swipe-gradient text-white h-14 px-8 rounded-full text-lg"
            >
              {submitting ? 'Uploading...' : (
                currentQuestionIndex < questions.length - 1 ? (
                  <>Next Question <ChevronRight className="w-5 h-5 ml-2" /></>
                ) : (
                  <><CheckCircle className="w-5 h-5 mr-2" /> Submit Interview</>
                )
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
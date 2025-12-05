import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { 
  Video, Circle, Square, Play, Pause, RotateCcw, Upload, 
  CheckCircle2, Loader2, Clock, Lightbulb, X, Scissors, SkipBack, SkipForward
} from 'lucide-react';
import { motion } from 'framer-motion';

const TIPS = [
  "Introduce yourself and your current role",
  "Highlight your key skills and achievements",
  "Explain what you're looking for in your next role",
  "Keep it under 60 seconds",
  "Smile and show your personality!"
];

export default function VideoIntroRecorder({ open, onOpenChange, onVideoSaved, existingVideo }) {
  const [mode, setMode] = useState(existingVideo ? 'preview' : 'tips'); // tips, recording, preview, editing, uploading
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(existingVideo || null);
  const [timer, setTimer] = useState(0);
  const [uploading, setUploading] = useState(false);
  
  // Editing state
  const [videoDuration, setVideoDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const videoRef = useRef(null);
  const previewVideoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 720, height: 1280 },
        audio: true 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setMode('recording');
    } catch (err) {
      console.error('Camera access denied:', err);
      alert('Please allow camera access to record your video introduction.');
    }
  };

  const startRecording = () => {
    if (!streamRef.current) {
      console.error('No stream available');
      return;
    }
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      setRecordedUrl(URL.createObjectURL(blob));
      stopStream();
      setMode('preview');
    };

    recorderRef.current = recorder;
    recorder.start(100);
    setRecording(true);
    setTimer(0);

    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev >= 60) {
          stopRecording();
          return 60;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
    setRecording(false);
  };

  const retake = () => {
    setRecordedBlob(null);
    setRecordedUrl(null);
    setTimer(0);
    startCamera();
  };

  const handleUpload = async () => {
    if (!recordedBlob) return;
    
    setUploading(true);
    try {
      const file = new File([recordedBlob], 'video_intro.webm', { type: 'video/webm' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onVideoSaved(file_url);
      onOpenChange(false);
    } catch (err) {
      console.error('Upload failed:', err);
    }
    setUploading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview for editing instead of direct upload
    const url = URL.createObjectURL(file);
    setRecordedUrl(url);
    setRecordedBlob(file);
    setMode('editing');
  };

  // Video editing functions
  const handleVideoLoaded = () => {
    if (previewVideoRef.current) {
      const duration = previewVideoRef.current.duration;
      setVideoDuration(duration);
      setTrimEnd(duration);
    }
  };

  const handleTimeUpdate = () => {
    if (previewVideoRef.current) {
      const time = previewVideoRef.current.currentTime;
      setCurrentTime(time);
      
      // Stop at trim end
      if (time >= trimEnd) {
        previewVideoRef.current.pause();
        previewVideoRef.current.currentTime = trimStart;
        setIsPlaying(false);
      }
    }
  };

  const togglePlayPause = () => {
    if (previewVideoRef.current) {
      if (isPlaying) {
        previewVideoRef.current.pause();
      } else {
        if (isFinite(trimStart) && (previewVideoRef.current.currentTime < trimStart || previewVideoRef.current.currentTime >= trimEnd)) {
          previewVideoRef.current.currentTime = trimStart;
        }
        previewVideoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seekTo = (time) => {
    if (previewVideoRef.current && isFinite(time)) {
      previewVideoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleTrimChange = (values) => {
    setTrimStart(values[0]);
    setTrimEnd(values[1]);
    if (previewVideoRef.current && isFinite(values[0])) {
      previewVideoRef.current.currentTime = values[0];
      setCurrentTime(values[0]);
    }
  };

  const goToEdit = () => {
    setMode('editing');
  };

  const handleSaveWithTrim = async () => {
    if (!recordedBlob) return;
    
    setUploading(true);
    try {
      // For now, upload the full video (trimming would require server-side processing)
      // The trim values could be stored as metadata
      let file;
      if (recordedBlob instanceof File) {
        file = recordedBlob;
      } else {
        file = new File([recordedBlob], 'video_intro.webm', { type: 'video/webm' });
      }
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onVideoSaved(file_url);
      onOpenChange(false);
    } catch (err) {
      console.error('Upload failed:', err);
    }
    setUploading(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-black border-0">
        <div className="relative">
          {mode === 'tips' && (
            <div className="p-6 space-y-4 bg-white rounded-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-pink-500" />
                  Record Video Introduction
                </DialogTitle>
              </DialogHeader>

              <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <span className="font-medium text-gray-900">Tips for a great intro</span>
                </div>
                <ul className="space-y-2">
                  {TIPS.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3">
                <Button onClick={startCamera} className="flex-1 swipe-gradient text-white">
                  <Video className="w-4 h-4 mr-2" /> Start Recording
                </Button>
                <label className="flex-1">
                  <input 
                    type="file" 
                    accept="video/*" 
                    className="hidden" 
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <Button variant="outline" className="w-full" asChild disabled={uploading}>
                    <span>
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                      Upload
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          )}

          {mode === 'recording' && (
            <div className="relative aspect-[3/4] max-h-[60vh] flex items-center justify-center">
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline
                className="w-full h-full object-contain"
              />
              
              {/* SwipeHire Logo */}
              <span className="absolute bottom-4 right-4 text-white font-bold text-lg drop-shadow-lg">SwipeHire</span>
              
              {/* Timer Overlay */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full flex items-center gap-2">
                {recording && <Circle className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />}
                <span className="text-white font-mono">{formatTime(timer)}</span>
                <span className="text-white/60">/ 1:00</span>
              </div>

              {/* Progress Bar */}
              {recording && (
                <div className="absolute bottom-20 left-4 right-4">
                  <Progress value={(timer / 60) * 100} className="h-1" />
                </div>
              )}

              {/* Controls */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                {!recording ? (
                  <Button 
                    onClick={startRecording}
                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
                  >
                    <Circle className="w-8 h-8 fill-white text-white" />
                  </Button>
                ) : (
                  <Button 
                    onClick={stopRecording}
                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
                  >
                    <Square className="w-6 h-6 fill-white text-white" />
                  </Button>
                )}
              </div>

              {/* Close Button */}
              <button 
                onClick={() => { stopStream(); onOpenChange(false); }}
                className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {mode === 'preview' && recordedUrl && (
            <div className="relative aspect-[3/4] max-h-[60vh] flex items-center justify-center">
              <video 
                src={recordedUrl} 
                controls 
                className="w-full h-full object-contain"
              />
              
              {/* SwipeHire Logo */}
              <span className="absolute bottom-16 right-4 text-white font-bold text-lg drop-shadow-lg pointer-events-none">SwipeHire</span>
              
              {/* Actions */}
              <div className="absolute bottom-4 left-4 right-4 flex gap-3">
                <Button onClick={retake} variant="secondary" className="flex-1">
                  <RotateCcw className="w-4 h-4 mr-2" /> Retake
                </Button>
                <Button onClick={goToEdit} variant="secondary" className="flex-1">
                  <Scissors className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button 
                  onClick={handleUpload} 
                  disabled={uploading}
                  className="flex-1 swipe-gradient text-white"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => onOpenChange(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {mode === 'editing' && recordedUrl && (
            <div className="bg-black">
              {/* Video Preview */}
              <div className="relative aspect-[3/4] max-h-[50vh] flex items-center justify-center">
                <video 
                  ref={previewVideoRef}
                  src={recordedUrl} 
                  className="w-full h-full object-contain"
                  onLoadedMetadata={handleVideoLoaded}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                />
                
                {/* SwipeHire Logo */}
                <span className="absolute bottom-4 right-4 text-white font-bold text-lg drop-shadow-lg pointer-events-none">SwipeHire</span>
                
                {/* Play/Pause Overlay */}
                <button 
                  onClick={togglePlayPause}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
                >
                  {!isPlaying && (
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-8 h-8 text-gray-900 ml-1" />
                    </div>
                  )}
                </button>

                {/* Close Button */}
                <button 
                  onClick={() => onOpenChange(false)}
                  className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Editing Controls */}
              <div className="p-4 bg-gray-900 space-y-4">
                {/* Trim Label */}
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-pink-400" />
                    <span className="text-sm font-medium">Trim Video</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    Duration: {formatTime(Math.round(trimEnd - trimStart))}
                  </span>
                </div>

                {/* Timeline */}
                <div className="space-y-2">
                  {/* Current position indicator */}
                  <div className="h-1 bg-gray-700 rounded-full relative">
                    <div 
                      className="absolute h-full bg-pink-500 rounded-full"
                      style={{ 
                        left: `${(trimStart / videoDuration) * 100}%`,
                        width: `${((trimEnd - trimStart) / videoDuration) * 100}%`
                      }}
                    />
                    <div 
                      className="absolute w-2 h-2 bg-white rounded-full -top-0.5"
                      style={{ left: `${(currentTime / videoDuration) * 100}%` }}
                    />
                  </div>

                  {/* Trim Slider */}
                  <Slider
                    value={[trimStart, trimEnd]}
                    min={0}
                    max={videoDuration || 60}
                    step={0.1}
                    onValueChange={handleTrimChange}
                    className="w-full"
                  />

                  {/* Time Labels */}
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{formatTime(Math.round(trimStart))}</span>
                    <span>{formatTime(Math.round(currentTime))}</span>
                    <span>{formatTime(Math.round(trimEnd))}</span>
                  </div>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center justify-center gap-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => seekTo(trimStart)}
                    className="text-white hover:bg-gray-800"
                  >
                    <SkipBack className="w-5 h-5" />
                  </Button>
                  <Button 
                    onClick={togglePlayPause}
                    className="w-12 h-12 rounded-full swipe-gradient"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => seekTo(trimEnd)}
                    className="text-white hover:bg-gray-800"
                  >
                    <SkipForward className="w-5 h-5" />
                  </Button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button 
                    onClick={retake} 
                    variant="outline" 
                    className="flex-1 border-gray-600 text-white hover:bg-gray-800"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" /> Retake
                  </Button>
                  <Button 
                    onClick={handleSaveWithTrim} 
                    disabled={uploading}
                    className="flex-1 swipe-gradient text-white"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    {uploading ? 'Saving...' : 'Save Video'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
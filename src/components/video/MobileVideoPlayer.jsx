import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause } from 'lucide-react';

export default function MobileVideoPlayer({ 
  videoUrl, 
  isActive, 
  onView, 
  onPlaybackSpeedChange,
  videoRef: externalVideoRef 
}) {
  const internalVideoRef = useRef(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSpeedSelector, setShowSpeedSelector] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const longPressTimer = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
        onView?.();
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowSpeedSelector(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    if (!showSpeedSelector) {
      togglePlay();
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    onPlaybackSpeedChange?.(speed);
    setShowSpeedSelector(false);
  };

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        loop
        muted={false}
        playsInline
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />

      {/* Play/Pause Overlay */}
      <AnimatePresence>
        {!isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none"
          >
            <div className="w-20 h-20 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-10 h-10 text-white ml-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playback Speed Selector */}
      <AnimatePresence>
        {showSpeedSelector && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setShowSpeedSelector(false)}
          >
            <div className="bg-black/90 rounded-2xl p-6 space-y-3" onClick={(e) => e.stopPropagation()}>
              <p className="text-white text-center text-sm mb-4">Playback Speed</p>
              {[0.75, 1, 1.25].map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`w-full px-6 py-3 rounded-xl text-white font-semibold transition-all ${
                    playbackSpeed === speed 
                      ? 'bg-gradient-to-r from-pink-500 to-orange-500' 
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
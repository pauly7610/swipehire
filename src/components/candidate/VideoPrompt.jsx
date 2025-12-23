import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Play, Sparkles, TrendingUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoIntroRecorder from '@/components/candidate/VideoIntroRecorder';

/**
 * Video Prompt Component
 * Encourages candidates to record "Day in the Life" videos
 */
export default function VideoPrompt({ candidate, onComplete }) {
  const [showRecorder, setShowRecorder] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Don't show if already has video or dismissed
  if (candidate?.video_intro_url || dismissed) {
    return null;
  }

  const prompts = [
    {
      title: "Walk me through a recent project",
      icon: Briefcase,
      benefit: "Shows problem-solving skills"
    },
    {
      title: "What's your ideal work environment?",
      icon: Building2,
      benefit: "Helps find culture fit"
    },
    {
      title: "Describe a typical day in your role",
      icon: Clock,
      benefit: "Gives employers context"
    }
  ];

  return (
    <>
      <AnimatePresence>
        {!showRecorder && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pink-500/10 to-transparent rounded-bl-full" />
              
              <button
                onClick={() => setDismissed(true)}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/50 transition-colors z-10"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>

              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  Stand Out with Video
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-slate-900/60 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">3x more views</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Profiles with video get 3x more recruiter attention</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Quick prompts (30-60 seconds each):</p>
                    {prompts.map((prompt, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-1.5" />
                        <div>
                          <span className="font-medium text-gray-800 dark:text-gray-200">{prompt.title}</span>
                          <span className="text-gray-500 dark:text-gray-500"> • {prompt.benefit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => setShowRecorder(true)}
                      className="w-full swipe-gradient text-white shadow-lg"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Record Video Intro
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {showRecorder && (
        <VideoIntroRecorder
          candidate={candidate}
          onComplete={(videoUrl) => {
            setShowRecorder(false);
            if (onComplete) onComplete(videoUrl);
          }}
          onClose={() => setShowRecorder(false)}
        />
      )}
    </>
  );
}
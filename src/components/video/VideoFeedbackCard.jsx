import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function VideoFeedbackCard({ swipe, candidate, job, company, onDismiss }) {
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateFeedback();
  }, [swipe]);

  const generateFeedback = async () => {
    setLoading(true);
    try {
      const prompt = `You are a hiring coach. A recruiter from ${company?.name || 'a company'} swiped right on this candidate's video profile.

Candidate: ${candidate?.headline || 'Professional'}
Skills: ${candidate?.skills?.join(', ') || 'Various skills'}

Generate:
1. One sentence on why they were swiped (what stood out)
2. Two specific tips to improve their profile visibility and match rate

Keep it encouraging, specific, and actionable. Use a supportive tone.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            why_swiped: { type: 'string' },
            improvement_tips: {
              type: 'array',
              items: { type: 'string' },
              maxItems: 2
            }
          }
        }
      });

      setFeedback(result);
    } catch (error) {
      console.error('Failed to generate feedback:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-24 left-4 right-4 z-50"
      >
        <Card className="bg-gradient-to-br from-purple-500/95 to-pink-500/95 backdrop-blur-xl border-0 shadow-2xl">
          <CardContent className="p-4 text-white">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <p className="font-semibold">Generating feedback...</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!feedback) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-24 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:max-w-md"
      >
        <Card className="bg-gradient-to-br from-purple-500/95 to-pink-500/95 backdrop-blur-xl border-0 shadow-2xl">
          <CardContent className="p-5 text-white">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-bold text-lg">Why You Were Swiped</h3>
              </div>
              <button 
                onClick={onDismiss}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-white/90 text-sm leading-relaxed mb-4">
              {feedback.why_swiped}
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white/80 text-xs font-semibold uppercase tracking-wide">
                <TrendingUp className="w-3 h-3" />
                <span>Improve Your Visibility</span>
              </div>
              <ul className="space-y-2">
                {feedback.improvement_tips?.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/90">
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="flex-1">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              onClick={onDismiss}
              className="w-full mt-4 bg-white text-purple-600 hover:bg-white/90 font-semibold"
            >
              Got it!
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Sparkles, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * "Why You Were Swiped" Feedback Panel
 * Shows AI-generated feedback after swipes
 */
export default function SwipeFeedbackPanel({ swipe, candidate, job, company, onClose }) {
  const [feedback, setFeedback] = useState(null);
  const [generating, setGenerating] = useState(true);

  useEffect(() => {
    generateFeedback();
  }, [swipe]);

  const generateFeedback = async () => {
    setGenerating(true);
    try {
      const direction = swipe.direction;
      
      let prompt = '';
      if (direction === 'right' || direction === 'super') {
        prompt = `A recruiter from ${company?.name} just swiped right on this candidate.
        
        Candidate profile:
        - Title: ${candidate?.headline}
        - Skills: ${candidate?.skills?.join(', ')}
        - Experience: ${candidate?.experience_level}
        
        Job: ${job?.title}
        Requirements: ${job?.skills_required?.join(', ')}
        
        Generate:
        1. Why they swiped right (2-3 specific reasons)
        2. One actionable tip to improve match rate for future roles
        
        Be specific, encouraging, and actionable.`;
      } else {
        prompt = `A recruiter passed on this candidate.
        
        Candidate profile:
        - Title: ${candidate?.headline}
        - Skills: ${candidate?.skills?.join(', ')}
        
        Job they passed on: ${job?.title}
        
        Generate constructive feedback:
        1. Possible reasons for the pass (neutral, not discouraging)
        2. 1-2 specific improvements to increase future match rate
        
        Be helpful and growth-oriented.`;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            reasons: { type: "array", items: { type: "string" } },
            improvement_tip: { type: "string" }
          }
        }
      });

      setFeedback(response);
    } catch (error) {
      console.error('Failed to generate feedback:', error);
    }
    setGenerating(false);
  };

  if (!feedback || generating) return null;

  const isPositive = swipe.direction === 'right' || swipe.direction === 'super';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-24 md:bottom-8 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50"
      >
        <Card className={`border-2 ${isPositive ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-300'} shadow-2xl`}>
          <div className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {isPositive ? (
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-sm text-gray-900">
                    {isPositive ? '🎉 You Were Swiped!' : '💡 Improve Your Match Rate'}
                  </h3>
                  <p className="text-xs text-gray-600">{company?.name}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Reasons */}
            <div className="space-y-1.5">
              {feedback.reasons?.map((reason, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className={`w-1 h-1 rounded-full ${isPositive ? 'bg-green-500' : 'bg-blue-500'} mt-1.5`} />
                  <p className="text-xs text-gray-700 leading-relaxed">{reason}</p>
                </div>
              ))}
            </div>

            {/* Improvement Tip */}
            {feedback.improvement_tip && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs font-bold text-gray-900 mb-1">💪 Boost Your Profile:</p>
                <p className="text-xs text-gray-700 leading-relaxed">{feedback.improvement_tip}</p>
              </div>
            )}

            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white text-xs h-8"
            >
              Got it!
            </Button>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
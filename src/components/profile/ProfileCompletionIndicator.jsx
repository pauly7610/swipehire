import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

/**
 * Profile Completion Indicator
 * Shows candidates what's missing and drives profile quality
 */
export default function ProfileCompletionIndicator({ candidate, onNavigate }) {
  const calculateCompletion = () => {
    const fields = [
      { key: 'headline', label: 'Job Title', weight: 15 },
      { key: 'bio', label: 'Bio', weight: 10 },
      { key: 'photo_url', label: 'Profile Photo', weight: 10 },
      { key: 'skills', label: 'Skills (3+)', weight: 15, check: (val) => val?.length >= 3 },
      { key: 'experience', label: 'Work Experience', weight: 15, check: (val) => val?.length >= 1 },
      { key: 'education', label: 'Education', weight: 10, check: (val) => val?.length >= 1 },
      { key: 'resume_url', label: 'Resume', weight: 15 },
      { key: 'video_intro_url', label: 'Video Intro', weight: 10 },
    ];

    let completed = 0;
    let total = 0;
    const missing = [];

    fields.forEach(field => {
      total += field.weight;
      const value = candidate?.[field.key];
      const isComplete = field.check ? field.check(value) : (value && (Array.isArray(value) ? value.length > 0 : true));
      
      if (isComplete) {
        completed += field.weight;
      } else {
        missing.push({ ...field, value });
      }
    });

    return {
      percentage: Math.round((completed / total) * 100),
      missing,
      completed: fields.length - missing.length,
      total: fields.length
    };
  };

  const { percentage, missing, completed, total } = calculateCompletion();
  const isComplete = percentage === 100;

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {isComplete ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
              Profile Strength
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {completed} of {total} sections complete
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-pink-600">{percentage}%</p>
          </div>
        </div>

        <Progress value={percentage} className="h-2 mb-4" />

        {!isComplete && missing.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Complete your profile to get more matches:</p>
            <div className="space-y-1.5">
              {missing.slice(0, 3).map((field, i) => (
                <motion.button
                  key={field.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onNavigate && onNavigate()}
                  className="w-full flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/30 transition-colors group border border-gray-200 dark:border-slate-700"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-pink-600 dark:group-hover:text-pink-400 font-medium">
                    Add {field.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-pink-500" />
                </motion.button>
              ))}
            </div>
            {missing.length > 3 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                +{missing.length - 3} more items
              </p>
            )}
          </motion.div>
        )}

        {isComplete && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-900/40">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              Your profile is complete! You're ready to match with top employers.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
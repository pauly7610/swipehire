import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Zap, Loader2, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { evaluateApplication } from '@/components/evaluation/AutoEvaluator';

export default function QuickApplyBottomSheet({ open, onOpenChange, job, company, candidate, user, onApply }) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleQuickApply = async () => {
    setApplying(true);
    try {
      const application = await base44.entities.Application.create({
        candidate_id: candidate.id,
        job_id: job.id,
        company_id: company.id,
        resume_url: candidate.resume_url,
        video_pitch_url: candidate.video_intro_url,
        applied_via: 'swipe',
        status: 'applied'
      });

      await evaluateApplication(application.id);

      await base44.entities.Swipe.create({
        swiper_id: user.id,
        swiper_type: 'candidate',
        target_id: job.id,
        target_type: 'job',
        direction: 'right',
        job_id: job.id
      });

      await base44.entities.Notification.create({
        user_id: company.user_id,
        type: 'job_match',
        title: '🎯 New Application',
        message: `${user.full_name} applied for ${job.title}`,
        job_id: job.id,
        navigate_to: 'ATS'
      });

      setApplied(true);
      setTimeout(() => {
        onOpenChange(false);
        onApply?.();
      }, 1500);
    } catch (error) {
      alert('Application failed. Try again.');
    }
    setApplying(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => onOpenChange(false)}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 shadow-2xl"
          >
            <div className="p-6 pb-8">
              {/* Handle */}
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />

              {applied ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Application Sent! 🎉</h3>
                  <p className="text-gray-500">You'll hear back soon</p>
                </div>
              ) : (
                <>
                  {/* Job Summary */}
                  <div className="flex items-start gap-3 mb-6 p-4 bg-gradient-to-r from-pink-50 to-orange-50 rounded-2xl">
                    {company?.logo_url && (
                      <img src={company.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{job?.title}</h3>
                      <p className="text-sm text-gray-600">{company?.name}</p>
                    </div>
                  </div>

                  {/* What's Included */}
                  <div className="mb-6 space-y-2">
                    <h4 className="font-semibold text-gray-900 text-sm">Submitting:</h4>
                    <div className="space-y-2">
                      {candidate?.video_intro_url && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          Video introduction
                        </div>
                      )}
                      {candidate?.resume_url && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          Resume
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Profile & skills
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <Button
                      onClick={handleQuickApply}
                      disabled={applying}
                      className="w-full h-14 swipe-gradient text-white text-lg font-bold rounded-2xl"
                    >
                      {applying ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Zap className="w-5 h-5 mr-2" />
                          Apply Now
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => onOpenChange(false)}
                      variant="ghost"
                      className="w-full"
                      disabled={applying}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
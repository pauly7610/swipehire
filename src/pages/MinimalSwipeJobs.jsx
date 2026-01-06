import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, CheckCircle2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SwipeStack from '@/components/swipe/SwipeStack';
import JobDetailsSheet from '@/components/swipe/JobDetailsSheet';
import { autoApplyToJob } from '@/components/lib/auto-apply';
import { analyzeJobDescription, calculateMatchScore } from '@/components/lib/resume-intelligence';
import { colors, springs } from '@/components/lib/design-system';
import { toast } from 'sonner';

/**
 * Minimal Swipe Jobs Page
 * Sorce-inspired beautiful swipe experience with RezPass intelligence
 */
export default function MinimalSwipeJobs() {
  const [user, setUser] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicationInProgress, setApplicationInProgress] = useState(false);
  const [applicationProgress, setApplicationProgress] = useState(null);

  // Load user, candidate and jobs
  useEffect(() => {
    loadCandidateAndJobs();
  }, []);

  const loadCandidateAndJobs = async () => {
    try {
      // Load user
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load candidate profile
      const [candidateData] = await base44.entities.Candidate.filter({ user_id: currentUser.id });
      setCandidate(candidateData);

      // Load jobs
      await loadJobs();
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      // Fetch available jobs
      const jobList = await base44.entities.Job.filter({ is_active: true }, '-created_date', 50);

      // Get companies
      const companyIds = [...new Set(jobList.map(j => j.company_id))];
      const companies = await base44.entities.Company.list();
      const companyMap = {};
      companies.forEach(c => { companyMap[c.id] = c; });

      // Calculate match scores for each job
      const jobsWithScores = await Promise.all(
        jobList.map(async (job) => {
          try {
            const company = companyMap[job.company_id];
            const analysis = await analyzeJobDescription(
              job.description,
              job.title,
              company?.name
            );
            const matchScore = calculateMatchScore(candidate, analysis);
            return { ...job, company, matchScore, analysis };
          } catch (error) {
            console.error('Error analyzing job:', error);
            return { ...job, company: companyMap[job.company_id], matchScore: 75 };
          }
        })
      );

      // Sort by match score
      jobsWithScores.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

      setJobs(jobsWithScores);
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error('Failed to load jobs');
    }
  };

  // Handle swipe action
  const handleSwipe = async (job, direction) => {
    if (direction === 'like' || direction === 'superlike') {
      // Auto-apply to job!
      await handleAutoApply(job);
    } else {
      // Pass on job
      await recordSwipe(job, 'pass');
      toast('Passed', {
        icon: '👋',
        description: `You passed on ${job.title}`,
      });
    }
  };

  // Handle auto-apply
  const handleAutoApply = async (job) => {
    setApplicationInProgress(true);

    try {
      // Show progress toast
      const progressToast = toast.loading('Applying to job...', {
        description: 'Customizing your resume',
      });

      const result = await autoApplyToJob(candidate, job, {
        reviewBeforeSubmit: false, // Auto-submit (can be configured per user persona)
        onProgress: (progress) => {
          setApplicationProgress(progress);
          toast.loading('Applying to job...', {
            id: progressToast,
            description: progress.message,
          });
        },
        onComplete: (result) => {
          toast.success('Application submitted!', {
            id: progressToast,
            description: `You applied to ${job.title} at ${job.company?.name}`,
            duration: 3000,
          });
          showSuccessAnimation(job);
        },
        onError: (error) => {
          toast.error('Application failed', {
            id: progressToast,
            description: error.message,
          });
        }
      });

      // Record swipe
      await recordSwipe(job, 'like', true);

    } catch (error) {
      console.error('Auto-apply error:', error);
      toast.error('Failed to apply', {
        description: error.message,
      });
    } finally {
      setApplicationInProgress(false);
      setApplicationProgress(null);
    }
  };

  // Record swipe action
  const recordSwipe = async (job, direction, applied = false) => {
    try {
      await base44.entities.Swipe.create({
        candidate_id: candidate.id,
        swiper_id: user.id,
        swiper_type: 'candidate',
        job_id: job.id,
        direction: direction === 'like' ? 'right' : direction === 'superlike' ? 'super_right' : 'left',
        applied,
      });
    } catch (error) {
      console.error('Error recording swipe:', error);
    }
  };

  // Show success animation
  const showSuccessAnimation = (job) => {
    // You could show a full-screen celebration here
    // For now, we'll just use a toast
  };

  // Handle card tap (show details)
  const handleCardTap = (job) => {
    setSelectedJob(job);
  };

  // Handle apply from detail sheet
  const handleApplyFromSheet = (job) => {
    setSelectedJob(null);
    handleAutoApply(job);
  };

  // Handle pass from detail sheet
  const handlePassFromSheet = (job) => {
    setSelectedJob(null);
    recordSwipe(job, 'pass');
    toast('Passed', {
      icon: '👋',
      description: `You passed on ${job.title}`,
    });
  };

  // Need more jobs callback
  const handleNeedMore = () => {
    loadJobs();
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Finding perfect matches...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-pink-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="flex-shrink-0 p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Discover Jobs
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Swipe right to auto-apply
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-full"
            style={{ background: colors.primary.gradient }}
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.button>
        </div>
      </header>

      {/* Swipe Stack */}
      <div className="flex-1 relative px-4">
        <SwipeStack
          jobs={jobs}
          onSwipe={handleSwipe}
          onCardTap={handleCardTap}
          onNeedMore={handleNeedMore}
          isLoading={loading}
        />
      </div>

      {/* Bottom Info */}
      <div className="flex-shrink-0 p-6 pt-4">
        <div className="flex items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span>Auto-Apply</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>ATS Optimized</span>
          </div>
        </div>
      </div>

      {/* Job Details Sheet */}
      <JobDetailsSheet
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        onApply={handleApplyFromSheet}
        onPass={handlePassFromSheet}
      />

      {/* Application Progress Overlay */}
      <AnimatePresence>
        {applicationInProgress && applicationProgress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={springs.bouncy}
              className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-sm mx-4"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center mb-4">
                  <Sparkles className="w-10 h-10 animate-pulse" style={{ color: colors.primary.DEFAULT }} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Applying Magic ✨
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {applicationProgress.message}
                </p>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full"
                    style={{ background: colors.success.gradient }}
                    initial={{ width: 0 }}
                    animate={{ width: `${applicationProgress.progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  {applicationProgress.progress}%
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
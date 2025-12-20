import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import JobCard from '@/components/swipe/JobCard';
import SwipeControls from '@/components/swipe/SwipeControls';
import MatchModal from '@/components/swipe/MatchModal';
import { useAIMatching } from '@/components/matching/useAIMatching';
import CandidateChatbot from '@/components/engagement/CandidateChatbot';
import { Loader2, Inbox, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import SwipeFeedback from '@/components/matching/SwipeFeedback';
import QuickApplyBottomSheet from '@/components/candidate/QuickApplyBottomSheet';
import DealBreakerModal from '@/components/matching/DealBreakerModal';
import OnboardingTooltip from '@/components/onboarding/OnboardingTooltip';
import analytics from '@/components/analytics/Analytics';
import ReferCandidateModal from '@/components/referral/ReferCandidateModal';
import { trackInterestSignal, useJobDwellTracking } from '@/components/engagement/InterestTracker';
import DayInLifePreview from '@/components/readiness/DayInLifePreview';
import ApplicationReadinessGate from '@/components/readiness/ApplicationReadinessGate';
import CompanyInsightCard from '@/components/insights/CompanyInsightCard';
import FitConfidenceScore from '@/components/confidence/FitConfidenceScore';
import { sendMatchNotificationEmails } from '@/components/email/EmailAutomation';
import { Button } from '@/components/ui/button';
import { Zap, Heart } from 'lucide-react';

export default function SwipeJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [swipeHistory, setSwipeHistory] = useState([]);
  const [showMatch, setShowMatch] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [swipedJobIds, setSwipedJobIds] = useState(new Set());
  const [dealBreakerWarnings, setDealBreakerWarnings] = useState([]);
  const [currentMatchScore, setCurrentMatchScore] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [pendingSwipe, setPendingSwipe] = useState(null);
  const [swipeCount, setSwipeCount] = useState(0);
  const [showQuickApply, setShowQuickApply] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showDealBreakerModal, setShowDealBreakerModal] = useState(false);
  const [pendingDealBreakerSwipe, setPendingDealBreakerSwipe] = useState(null);
  const [showReferModal, setShowReferModal] = useState(false);
  const [showReadinessGate, setShowReadinessGate] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showSwipeFeedback, setShowSwipeFeedback] = useState(false);
  const [swipeFeedbackDirection, setSwipeFeedbackDirection] = useState(null);

  const { checkDealBreakers, calculateMatchScore } = useAIMatching();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  const passOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);
  const applyOpacity = useTransform(x, [0, 50, 100], [0, 0.5, 1]);

  useEffect(() => {
    loadData();
  }, []);

  // PREFETCH next 3 cards
  useEffect(() => {
    if (!currentJob) return;
    
    const prefetchJobs = jobs.slice(currentIndex + 1, currentIndex + 4);
    prefetchJobs.forEach(job => {
      const company = companies[job.company_id];
      if (company?.logo_url) {
        const img = new Image();
        img.src = company.logo_url;
      }
    });
  }, [currentIndex, jobs, companies]);

  const loadData = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        navigate(createPageUrl('Welcome'), { replace: true });
        return;
      }

      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [candidateData] = await base44.entities.Candidate.filter({ user_id: currentUser.id });
      if (!candidateData) {
        navigate(createPageUrl('Onboarding'), { replace: true });
        return;
      }
      setCandidate(candidateData);

      // PARALLEL DATA LOAD
      const [existingSwipes, allJobs, allCompanies] = await Promise.all([
        base44.entities.Swipe.filter({ swiper_id: currentUser.id, swiper_type: 'candidate' }),
        base44.entities.Job.filter({ is_active: true }),
        base44.entities.Company.list()
      ]);

      const swipedIds = new Set(existingSwipes.map(s => s.target_id));
      setSwipedJobIds(swipedIds);

      const availableJobs = allJobs.filter(j => !swipedIds.has(j.id));
      setJobs(availableJobs);

      const companyMap = {};
      allCompanies.forEach(c => { companyMap[c.id] = c; });
      setCompanies(companyMap);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const currentJob = jobs[currentIndex];
  const currentCompany = (currentJob && companies[currentJob.company_id]) || null;

  // Track dwell time on current job
  useJobDwellTracking(user?.id, candidate?.id, currentJob?.id);

  // Check deal breakers and calculate match score for current job
  useEffect(() => {
    if (currentJob && candidate && currentJob.company_id) {
      const company = companies[currentJob.company_id] || null;
      if (company) {
          const { violations } = checkDealBreakers(candidate, currentJob, company);
          setDealBreakerWarnings(violations);

          const { score } = calculateMatchScore(candidate, currentJob, company);
          setCurrentMatchScore(score);
        } else {
          setDealBreakerWarnings([]);
          setCurrentMatchScore(null);
        }
      } else {
        setDealBreakerWarnings([]);
        setCurrentMatchScore(null);
      }
    }, [currentJob, candidate, companies, checkDealBreakers, calculateMatchScore]);

  const handleSwipe = async (direction, feedback = null) => {
    if (!currentJob || !user) return;

    // Track interest signal
    if (direction === 'right' || direction === 'super') {
      await trackInterestSignal(user.id, candidate.id, currentJob.id, 'swipe_right', {
        match_score: currentMatchScore,
        is_super: direction === 'super'
      });
    }

    // Track analytics
    analytics.track('Job Swiped', {
      direction,
      jobId: currentJob.id,
      jobTitle: currentJob.title,
      companyId: currentJob.company_id,
      matchScore: currentMatchScore,
      hasDealBreakers: dealBreakerWarnings.length > 0
    });

    const swipeData = {
      swiper_id: user.id,
      swiper_type: 'candidate',
      target_id: currentJob.id,
      target_type: 'job',
      direction,
      job_id: currentJob.id,
      feedback: feedback || undefined
    };

    setSwipeHistory([...swipeHistory, { index: currentIndex, job: currentJob }]);
    setSwipeCount(prev => prev + 1);
    
    await base44.entities.Swipe.create(swipeData);

    // Check for mutual match (if employer swiped right on this candidate for this job)
    if (direction === 'right' || direction === 'super') {
      // Notify the employer (anonymous) that someone swiped on their job
      const company = companies[currentJob.company_id];
      if (company?.user_id) {
        await base44.entities.Notification.create({
          user_id: company.user_id,
          type: 'system',
          title: '👀 Someone is interested!',
          message: `A candidate swiped right on your ${currentJob.title} position. Check your candidates to find them!`
        });
      }
      
      // Check if employer swiped right on this candidate (for any of their jobs or directly on candidate)
      if (candidate) {
        const employerSwipes = await base44.entities.Swipe.filter({
          swiper_type: 'employer',
          target_id: candidate.id,
          direction: 'right'
        });

        const mutualSwipe = employerSwipes.find(s => s.direction === 'right' || s.direction === 'super');

        if (mutualSwipe) {
          const company = companies[currentJob.company_id] || null;
          // Create match
          const match = await base44.entities.Match.create({
            candidate_id: candidate.id,
            company_id: currentJob.company_id,
            job_id: currentJob.id,
            candidate_user_id: user.id,
            company_user_id: company?.user_id,
            match_score: currentMatchScore || 85
          });

          // Notify both parties
          await Promise.all([
            base44.entities.Notification.create({
              user_id: user.id,
              type: 'new_match',
              title: '🎉 It\'s a Match!',
              message: `You matched with ${company?.name || 'a company'} for ${currentJob.title}!`,
              match_id: match.id,
              job_id: currentJob.id
            }),
            company?.user_id ? base44.entities.Notification.create({
              user_id: company.user_id,
              type: 'new_match',
              title: '🎉 It\'s a Match!',
              message: `You matched with a candidate for ${currentJob.title}!`,
              match_id: match.id,
              job_id: currentJob.id
            }) : Promise.resolve()
          ]);

          setMatchData({ match, job: currentJob, company: company, candidate });
          setShowMatch(true);
          
          // Send match notification emails
          await sendMatchNotificationEmails(match, currentJob, company, candidate);
        }
      }
    }

    setIsFlipped(false);
    setCurrentIndex(currentIndex + 1);
    x.set(0);

    // Show micro-feedback (optional, dismissible, non-blocking)
    if ((swipeCount + 1) % 3 === 0) {
      setSwipeFeedbackDirection(direction);
      setShowSwipeFeedback(true);
      setTimeout(() => setShowSwipeFeedback(false), 3000);
    }
    };

    const handleUndo = async () => {
    if (swipeHistory.length === 0) return;
    const lastSwipe = swipeHistory[swipeHistory.length - 1];
    
    // Delete the last swipe from database
    try {
      const lastSwipes = await base44.entities.Swipe.filter({
        swiper_id: user.id,
        target_id: lastSwipe.job.id,
        swiper_type: 'candidate'
      }, '-created_date', 1);
      
      if (lastSwipes.length > 0) {
        await base44.entities.Swipe.delete(lastSwipes[0].id);
      }
    } catch (error) {
      console.error('Failed to delete swipe:', error);
    }
    
    setSwipeHistory(swipeHistory.slice(0, -1));
    setCurrentIndex(lastSwipe.index);
  };

  const handleDragEnd = (event, info) => {
    const threshold = 80;
    const velocity = info.velocity.x;
    const yOffset = info.offset.y;
    
    // Swipe up = Save for later
    if (yOffset < -100 || info.velocity.y < -500) {
      handleSave();
      return;
    }
    
    if (info.offset.x > threshold || velocity > 500) {
      triggerSwipe('right');
    } else if (info.offset.x < -threshold || velocity < -500) {
      triggerSwipe('left');
    } else {
      x.set(0);
    }
  };

  const handleSave = async () => {
    if (!currentJob || !user || !candidate) return;
    await trackInterestSignal(user.id, candidate.id, currentJob.id, 'save');
    
    // Show feedback
    const toast = document.createElement('div');
    toast.className = 'fixed top-20 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl px-5 py-3 shadow-2xl z-50';
    toast.innerHTML = '<div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-yellow-500"></div><p class="text-sm font-semibold text-gray-800">📌 Saved for later</p></div>';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
    
    setCurrentIndex(currentIndex + 1);
    x.set(0);
  };

  const triggerSwipe = (direction) => {
    // Check for deal breakers on right swipe
    if (direction === 'right' && dealBreakerWarnings.length > 0) {
      setPendingDealBreakerSwipe({ direction, job: currentJob });
      setShowDealBreakerModal(true);
      return;
    }
    
    // Show feedback dialog every 5 swipes
    if ((swipeCount + 1) % 5 === 0) {
      setPendingSwipe({ direction, job: currentJob });
      setShowFeedback(true);
    } else {
      handleSwipe(direction);
    }
  };

  const handleFeedbackSubmit = (feedback) => {
    if (pendingSwipe) {
      handleSwipe(pendingSwipe.direction, feedback);
    }
    setShowFeedback(false);
    setPendingSwipe(null);
  };

  const handleFeedbackSkip = () => {
    if (pendingSwipe) {
      handleSwipe(pendingSwipe.direction);
    }
    setShowFeedback(false);
    setPendingSwipe(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4">
        <div className="max-w-md mx-auto">
          {/* Skeleton Loader */}
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded-lg w-3/4 mx-auto" />
            <div className="h-[520px] bg-gray-200 rounded-3xl" />
            <div className="flex gap-4 justify-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full" />
              <div className="w-16 h-16 bg-gray-200 rounded-full" />
              <div className="w-16 h-16 bg-gray-200 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 md:p-8 pb-24">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
        .swipe-gradient-text {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        @keyframes subtle-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
      `}</style>

      <div className="max-w-md mx-auto">
        {/* Header - High-Tech */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-white to-gray-50/80 backdrop-blur-xl border border-gray-200/60 rounded-full mb-3 shadow-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold tracking-wide text-gray-700">AI INTELLIGENCE</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-1 tracking-tight">Discover Your Next Role</h1>
          <p className="text-sm font-medium text-gray-500">Smart-ranked • Instant apply</p>
        </motion.div>

        {/* Smart Micro-feedback Toast */}
        <AnimatePresence>
          {showSwipeFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="absolute top-20 left-1/2 -translate-x-1/2 z-50"
            >
              <div className="bg-white/95 backdrop-blur-xl border border-gray-200/60 rounded-2xl px-5 py-3 shadow-2xl">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${swipeFeedbackDirection === 'right' ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`} />
                  <p className="text-sm font-semibold text-gray-800">
                    {swipeFeedbackDirection === 'right' 
                      ? currentMatchScore >= 80 ? '✨ Strong apply' : '✓ Applied' 
                      : '✓ Passed'}
                  </p>
                  {swipeFeedbackDirection === 'right' && currentMatchScore < 80 && currentMatchScore >= 60 && (
                    <span className="text-xs text-gray-500">Good fit, 1 skill gap</span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card Stack */}
        <div className="relative h-[520px] mb-8"
          style={{
            touchAction: 'pan-y pinch-zoom'
          }}
        >
          {currentJob ? (
            <>
              {/* Background cards for depth */}
              {jobs[currentIndex + 2] && (
                <motion.div 
                  className="absolute inset-0 scale-90 opacity-30"
                  initial={{ scale: 0.85, opacity: 0.2 }}
                  animate={{ scale: 0.90, opacity: 0.3 }}
                  transition={{ duration: 0.2 }}
                >
                  <JobCard
                    job={jobs[currentIndex + 2]}
                    company={companies[jobs[currentIndex + 2].company_id]}
                    isFlipped={false}
                  />
                </motion.div>
              )}
              {jobs[currentIndex + 1] && (
                <motion.div 
                  className="absolute inset-0 scale-95 opacity-50"
                  initial={{ scale: 0.90, opacity: 0.3 }}
                  animate={{ scale: 0.95, opacity: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  <JobCard
                    job={jobs[currentIndex + 1]}
                    company={companies[jobs[currentIndex + 1].company_id]}
                    isFlipped={false}
                  />
                </motion.div>
              )}

              {/* Active card */}
              <motion.div
                className="absolute inset-0 cursor-grab active:cursor-grabbing will-change-transform select-none"
                style={{ x, rotate, opacity }}
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.2}
                dragTransition={{ bounceStiffness: 400, bounceDamping: 25 }}
                onDragEnd={handleDragEnd}
                whileDrag={{ scale: 1.03, cursor: 'grabbing' }}
                whileTap={{ scale: 1.01 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 600, 
                  damping: 35,
                  mass: 0.8
                }}
              >
                <JobCard
                  job={currentJob}
                  company={currentCompany}
                  isFlipped={isFlipped}
                  onFlip={() => setIsFlipped(!isFlipped)}
                  matchScore={currentMatchScore}
                  onQuickApply={() => setShowReadinessGate(true)}
                  onRefer={() => setShowReferModal(true)}
                />

                {/* Swipe indicators */}
                <motion.div
                  className="absolute top-8 left-8 px-4 py-2 border-4 border-red-500 rounded-lg"
                  style={{ 
                    opacity: passOpacity,
                    rotate: -20
                  }}
                >
                  <span className="text-red-500 font-bold text-2xl">PASS</span>
                </motion.div>
                <motion.div
                  className="absolute top-8 right-8 px-4 py-2 border-4 border-green-500 rounded-lg"
                  style={{ 
                    opacity: applyOpacity,
                    rotate: 20
                  }}
                >
                  <span className="text-green-500 font-bold text-2xl">APPLY</span>
                </motion.div>
                
                {/* Swipe Up indicator */}
                <motion.div
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-yellow-500/90 backdrop-blur-sm rounded-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 0.8, y: 0 }}
                  transition={{ delay: 1, duration: 0.5 }}
                >
                  <span className="text-white font-bold text-xs">↑ SAVE</span>
                </motion.div>
              </motion.div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
                <Inbox className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">You're All Caught Up</h3>
              <p className="text-sm text-gray-500">We'll notify you when new matches arrive</p>
            </div>
          )}
        </div>

        {/* Intelligence Layer - Compact Warnings */}
                  {dealBreakerWarnings.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 bg-white/80 backdrop-blur-md border border-amber-200/60 rounded-2xl shadow-lg"
                    >
                      <div className="flex items-center gap-2 text-amber-700 mb-2">
                        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-xs tracking-wide">REQUIREMENTS CHECK</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {dealBreakerWarnings.map((warning, i) => (
                          <Badge key={i} className="bg-amber-50 text-amber-700 text-[10px] font-semibold border-0 px-2 py-1">
                            {warning.text}
                          </Badge>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Controls - High-Tech */}
                  {currentJob && (
                    <div className="space-y-3">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-2"
                      >
                        <Button 
                          onClick={() => setShowInsights(true)}
                          variant="outline"
                          className="flex-1 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-bold text-sm shadow-lg h-11 rounded-xl transition-all"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          View Intelligence
                        </Button>
                        <Button
                          onClick={handleSave}
                          variant="outline"
                          className="px-4 border-gray-300 hover:border-yellow-400 hover:bg-yellow-50 text-gray-700 hover:text-yellow-600 font-bold text-sm shadow-lg h-11 rounded-xl transition-all"
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                      </motion.div>

                      <SwipeControls
                        onSwipe={triggerSwipe}
                        onUndo={handleUndo}
                        canUndo={swipeHistory.length > 0}
                        isPremium={candidate?.is_premium}
                        onSave={handleSave}
                        onInteraction={async (type) => {
                          if (type === 'view' && currentJob) {
                            await trackInterestSignal(user.id, candidate.id, currentJob.id, 'click');
                          }
                        }}
                      />
                    </div>
                  )}

        {/* Progress - Refined */}
        {jobs.length > 0 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="flex gap-1">
              {[...Array(Math.min(jobs.length, 5))].map((_, i) => (
                <div 
                  key={i}
                  className={`h-1 rounded-full transition-all ${
                    i === currentIndex ? 'w-6 bg-pink-500' : 'w-1 bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400 font-medium">
              {currentIndex + 1}/{jobs.length}
            </span>
          </div>
        )}
      </div>

      {/* Match Modal */}
              <MatchModal
                isOpen={showMatch}
                onClose={() => setShowMatch(false)}
                match={matchData?.match}
                candidate={matchData?.candidate}
                company={matchData?.company}
                job={matchData?.job}
              />

              {/* AI Chatbot */}
              <CandidateChatbot company={currentCompany} job={currentJob} />

              {/* Feedback Dialog */}
              <SwipeFeedback
                open={showFeedback}
                onOpenChange={setShowFeedback}
                direction={pendingSwipe?.direction}
                targetName={pendingSwipe?.job?.title || 'this job'}
                onSubmit={handleFeedbackSubmit}
                onSkip={handleFeedbackSkip}
              />

              {/* Quick Apply Bottom Sheet */}
              <QuickApplyBottomSheet
                open={showQuickApply}
                onOpenChange={setShowQuickApply}
                job={currentJob}
                company={currentCompany}
                candidate={candidate}
                user={user}
                onApply={() => handleSwipe('right')}
              />

              {/* Deal Breaker Modal */}
              <DealBreakerModal
                open={showDealBreakerModal}
                onOpenChange={setShowDealBreakerModal}
                dealBreakers={dealBreakerWarnings}
                targetName="job"
                onProceed={() => {
                  setShowDealBreakerModal(false);
                  if (pendingDealBreakerSwipe) {
                    handleSwipe(pendingDealBreakerSwipe.direction);
                    setPendingDealBreakerSwipe(null);
                  }
                }}
                onCancel={() => {
                  setShowDealBreakerModal(false);
                  setPendingDealBreakerSwipe(null);
                }}
              />

              {/* Refer Modal */}
              <ReferCandidateModal
                open={showReferModal}
                onOpenChange={setShowReferModal}
                job={currentJob}
                company={currentCompany}
                user={user}
                userType="candidate"
              />

              {/* Onboarding Tooltip */}
              <OnboardingTooltip pageName="SwipeJobs" />

              {/* Insights Modal */}
              {showInsights && currentJob && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowInsights(false)}>
                  <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-4">
                      <FitConfidenceScore candidate={candidate} job={currentJob} />
                      <CompanyInsightCard companyId={currentJob.company_id} jobId={currentJob.id} />
                      <DayInLifePreview job={currentJob} company={currentCompany} />
                    </div>
                  </div>
                </div>
              )}

              {/* Application Readiness Gate */}
              {showReadinessGate && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                    <ApplicationReadinessGate
                      candidate={candidate}
                      job={currentJob}
                      onProceed={() => {
                        setShowReadinessGate(false);
                        setShowQuickApply(true);
                      }}
                      onCancel={() => {
                        setShowReadinessGate(false);
                        navigate(createPageUrl('CandidateProfile'));
                      }}
                    />
                  </div>
                </div>
              )}
              </div>
              );
              }
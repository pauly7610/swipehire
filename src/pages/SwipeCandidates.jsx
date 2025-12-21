import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import CandidateCard from '@/components/swipe/CandidateCard';
import SwipeControls from '@/components/swipe/SwipeControls';
import MatchModal from '@/components/swipe/MatchModal';

import { useAIMatching } from '@/components/matching/useAIMatching';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Inbox, Briefcase, Sparkles } from 'lucide-react';
import SwipeFeedback from '@/components/matching/SwipeFeedback';
import FavoriteCandidateButton from '@/components/networking/FavoriteCandidateButton';
import DetailedMatchInsights from '@/components/matching/DetailedMatchInsights';

export default function SwipeCandidates() {
  const [searchParams] = useSearchParams();
  const jobIdParam = searchParams.get('jobId');

  const [candidates, setCandidates] = useState([]);
  const [users, setUsers] = useState({});
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(jobIdParam || '');
  const [company, setCompany] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [swipeHistory, setSwipeHistory] = useState([]);
  const [showMatch, setShowMatch] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [user, setUser] = useState(null);
  const [exitX, setExitX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [currentInsights, setCurrentInsights] = useState(null);
  const [currentScore, setCurrentScore] = useState(75);
  const [showFeedback, setShowFeedback] = useState(false);
  const [pendingSwipe, setPendingSwipe] = useState(null);
  const [swipeCount, setSwipeCount] = useState(0);

  const { calculateMatchScore } = useAIMatching();

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  const passOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);
  const applyOpacity = useTransform(x, [0, 50, 100], [0, 0.5, 1]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load all data in parallel
      const [companyResults, allUsers, allCandidates] = await Promise.all([
        base44.entities.Company.filter({ user_id: currentUser.id }),
        base44.entities.User.list(),
        base44.entities.Candidate.list()
      ]);

      const [companyData] = companyResults;
      
      if (!companyData) {
        window.location.href = createPageUrl('Onboarding');
        return;
      }

      setCompany(companyData);

      const userMap = {};
      allUsers.forEach(u => { userMap[u.id] = u; });
      setUsers(userMap);

      if (companyData) {
        const [companyJobs, existingSwipes] = await Promise.all([
          base44.entities.Job.filter({ company_id: companyData.id, is_active: true }),
          base44.entities.Swipe.filter({ swiper_id: currentUser.id, swiper_type: 'employer' })
        ]);
        setJobs(companyJobs);

        const initialJobId = jobIdParam || (companyJobs.length > 0 ? companyJobs[0].id : '');
        setSelectedJobId(initialJobId);

        // Filter candidates based on swipes for the selected job
        if (initialJobId) {
          const swipedCandidateIds = new Set(
            existingSwipes.filter(s => s.job_id === initialJobId).map(s => s.target_id)
          );
          const availableCandidates = allCandidates.filter(c => !swipedCandidateIds.has(c.id));
          setCandidates(availableCandidates);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  // Only reload candidates when job changes (not on initial load)
  const loadCandidatesForJob = async (jobId) => {
    if (!jobId || !user) return;

    const [existingSwipes, allCandidates] = await Promise.all([
      base44.entities.Swipe.filter({ swiper_id: user.id, swiper_type: 'employer', job_id: jobId }),
      base44.entities.Candidate.list()
    ]);
    
    const swipedCandidateIds = new Set(existingSwipes.map(s => s.target_id));
    const availableCandidates = allCandidates.filter(c => !swipedCandidateIds.has(c.id));
    setCandidates(availableCandidates);
    setCurrentIndex(0);
  };

  const handleJobChange = (jobId) => {
    setSelectedJobId(jobId);
    loadCandidatesForJob(jobId);
  };

  const currentCandidate = candidates[currentIndex];
  const currentCandidateUser = currentCandidate ? users[currentCandidate.user_id] : null;
  const selectedJob = jobs.find(j => j.id === selectedJobId);

  // Calculate insights when candidate changes
  useEffect(() => {
    if (currentCandidate && selectedJob && company) {
      const { score, insights } = calculateMatchScore(currentCandidate, selectedJob, company);
      setCurrentScore(score);
      setCurrentInsights(insights);
    }
  }, [currentCandidate, selectedJob, company, calculateMatchScore]);

  const handleSwipe = async (direction, feedback = null) => {
    if (!currentCandidate || !selectedJobId) return;

    const swipeData = {
      swiper_id: user.id,
      swiper_type: 'employer',
      target_id: currentCandidate.id,
      target_type: 'candidate',
      direction,
      job_id: selectedJobId,
      feedback: feedback || undefined
    };

    setSwipeHistory([...swipeHistory, { index: currentIndex, candidate: currentCandidate }]);
    setSwipeCount(prev => prev + 1);

    await base44.entities.Swipe.create(swipeData);

    // Check for mutual match
    if (direction === 'right' || direction === 'super') {
      const candidateSwipes = await base44.entities.Swipe.filter({
        swiper_type: 'candidate',
        swiper_id: currentCandidate.user_id,
        target_id: selectedJobId
      });

      const mutualSwipe = candidateSwipes.find(s => s.direction === 'right' || s.direction === 'super');

      if (mutualSwipe) {
                                const match = await base44.entities.Match.create({
                                  candidate_id: currentCandidate.id,
                                  company_id: company.id,
                                  job_id: selectedJobId,
                                  candidate_user_id: currentCandidate.user_id,
                                  company_user_id: user.id,
                                  match_score: currentScore
                                });

                    // Notify both parties
                    await Promise.all([
                      base44.entities.Notification.create({
                        user_id: currentCandidate.user_id,
                        type: 'new_match',
                        title: '🎉 New Match!',
                        message: `You matched with ${company.name} for ${selectedJob.title}!`,
                        match_id: match.id,
                        job_id: selectedJobId
                      }),
                      base44.entities.Notification.create({
                        user_id: user.id,
                        type: 'new_match',
                        title: '🎉 New Match!',
                        message: `${currentCandidateUser?.full_name || 'A candidate'} matched for ${selectedJob.title}!`,
                        match_id: match.id,
                        job_id: selectedJobId
                      })
                    ]);

                    setMatchData({ match, job: selectedJob, company, candidate: currentCandidate });
                    setShowMatch(true);
                  }
    }

    setIsFlipped(false);
    setCurrentIndex(currentIndex + 1);
    x.set(0);
  };

  const handleUndo = async () => {
    if (swipeHistory.length === 0) return;
    const lastSwipe = swipeHistory[swipeHistory.length - 1];
    
    // Delete the last swipe from database
    try {
      const lastSwipes = await base44.entities.Swipe.filter({
        swiper_id: user.id,
        target_id: lastSwipe.candidate.id,
        swiper_type: 'employer'
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

  const handleCardDragEnd = (event, info) => {
    const threshold = 150;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (Math.abs(offset) > threshold || Math.abs(velocity) > 500) {
      const direction = offset > 0 ? 'right' : 'left';
      setExitX(direction === 'right' ? 1000 : -1000);
      setTimeout(() => {
        triggerSwipe(direction);
        setExitX(0);
      }, 300);
    }
    setIsDragging(false);
  };

  const handleDragEnd = (event, info) => {
    const threshold = 80;
    const velocity = info.velocity.x;
    const yOffset = info.offset.y;
    
    // Swipe up = Save to favorites
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
    if (!currentCandidate || !user || !company) return;
    
    await base44.entities.FavoriteCandidate.create({
      company_id: company.id,
      candidate_id: currentCandidate.id,
      recruiter_user_id: user.id,
      job_id: selectedJobId
    });
    
    const toast = document.createElement('div');
    toast.className = 'fixed top-20 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl px-5 py-3 shadow-2xl z-50';
    toast.innerHTML = '<div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-yellow-500"></div><p class="text-sm font-semibold text-gray-800">⭐ Added to favorites</p></div>';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
    
    setCurrentIndex(currentIndex + 1);
    x.set(0);
  };

  const triggerSwipe = (direction) => {
    // Show feedback dialog every 5 swipes
    if ((swipeCount + 1) % 5 === 0) {
      setPendingSwipe({ direction, candidate: currentCandidate });
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4">
        <div className="max-w-md mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded-lg w-2/3 mx-auto" />
            <div className="h-12 bg-gray-200 rounded-xl" />
            <div className="h-[540px] bg-gray-200 rounded-3xl" />
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>

      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Find Candidates</h1>
          <p className="text-gray-500 dark:text-gray-400">Swipe right on talent you want to connect with</p>
        </div>

        {/* Job Selector */}
        <div className="mb-6">
          <Select value={selectedJobId} onValueChange={handleJobChange}>
            <SelectTrigger className="w-full h-12 bg-white dark:bg-slate-900 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-pink-500" />
                <SelectValue placeholder="Select a job" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Card Stack */}
        <div className="relative h-[540px] mb-8"
          style={{
            touchAction: 'pan-y pinch-zoom'
          }}
        >
          {!selectedJobId ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-lg">
              <Briefcase className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Select a Job</h3>
              <p className="text-gray-500 dark:text-gray-400">Choose a job posting to start finding candidates</p>
            </div>
          ) : currentCandidate ? (
            <>
              {/* Background cards for depth */}
              {candidates[currentIndex + 2] && (
                <motion.div 
                  className="absolute inset-0 scale-90 opacity-30"
                  initial={{ scale: 0.85, opacity: 0.2 }}
                  animate={{ scale: 0.90, opacity: 0.3 }}
                  transition={{ duration: 0.2 }}
                >
                  <CandidateCard
                    candidate={candidates[currentIndex + 2]}
                    user={users[candidates[currentIndex + 2].user_id]}
                    isFlipped={false}
                  />
                </motion.div>
              )}
              {candidates[currentIndex + 1] && (
                <motion.div 
                  className="absolute inset-0 scale-95 opacity-50"
                  initial={{ scale: 0.90, opacity: 0.3 }}
                  animate={{ scale: 0.95, opacity: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  <CandidateCard
                    candidate={candidates[currentIndex + 1]}
                    user={users[candidates[currentIndex + 1].user_id]}
                    isFlipped={false}
                  />
                </motion.div>
              )}

              {/* Active card */}
              <div className="absolute inset-0">
                <CandidateCard
                  candidate={currentCandidate}
                  user={currentCandidateUser}
                  isFlipped={isFlipped}
                  onFlip={() => setIsFlipped(!isFlipped)}
                  matchScore={currentScore}
                  exitX={exitX}
                  isDragging={isDragging}
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={handleCardDragEnd}
                />
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-lg">
              <Inbox className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No More Candidates</h3>
              <p className="text-gray-500 dark:text-gray-400">Check back later for new applicants!</p>
            </div>
          )}
        </div>

        {/* Favorite Button & Match Insights */}
                  {currentCandidate && selectedJobId && (
                    <div className="mb-4 space-y-3">
                      <div className="flex items-center justify-between bg-white dark:bg-slate-900 dark:border-slate-800 rounded-xl p-3 shadow-sm">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Save to favorites</span>
                        <FavoriteCandidateButton 
                          candidateId={currentCandidate.id}
                          companyId={company?.id}
                          recruiterUserId={user?.id}
                          jobId={selectedJobId}
                        />
                      </div>
                      <DetailedMatchInsights 
                        candidate={currentCandidate}
                        job={selectedJob}
                        company={company}
                        score={currentScore}
                        insights={currentInsights}
                      />
                    </div>
                  )}

                  {/* Controls */}
                  {currentCandidate && selectedJobId && (
                    <SwipeControls
                      onSwipe={triggerSwipe}
                      onUndo={handleUndo}
                      canUndo={swipeHistory.length > 0}
                      isPremium={true}
                      onSave={handleSave}
                    />
                  )}

        {/* Progress */}
        {candidates.length > 0 && selectedJobId && (
          <div className="mt-6 text-center text-sm text-gray-400 dark:text-gray-500">
            {currentIndex + 1} of {candidates.length} candidates
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
                    viewerType="employer"
                  />

      {/* Feedback Dialog */}
      <SwipeFeedback
        open={showFeedback}
        onOpenChange={setShowFeedback}
        direction={pendingSwipe?.direction}
        targetName={users[pendingSwipe?.candidate?.user_id]?.full_name || 'this candidate'}
        onSubmit={handleFeedbackSubmit}
        onSkip={handleFeedbackSkip}
      />
    </div>
  );
}
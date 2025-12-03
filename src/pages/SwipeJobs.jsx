import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import JobCard from '@/components/swipe/JobCard';
import SwipeControls from '@/components/swipe/SwipeControls';
import MatchModal from '@/components/swipe/MatchModal';
import { useAIMatching } from '@/components/matching/useAIMatching';
import CandidateChatbot from '@/components/engagement/CandidateChatbot';
import { Loader2, Inbox, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import SwipeFeedback from '@/components/matching/SwipeFeedback';

export default function SwipeJobs() {
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

  const { checkDealBreakers, calculateMatchScore } = useAIMatching();
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

      const [candidateData] = await base44.entities.Candidate.filter({ user_id: currentUser.id });
      setCandidate(candidateData);

      // Get already swiped jobs
      const existingSwipes = await base44.entities.Swipe.filter({ 
        swiper_id: currentUser.id,
        swiper_type: 'candidate'
      });
      const swipedIds = new Set(existingSwipes.map(s => s.target_id));
      setSwipedJobIds(swipedIds);

      // Get active jobs
      const allJobs = await base44.entities.Job.filter({ is_active: true });
      const availableJobs = allJobs.filter(j => !swipedIds.has(j.id));
      setJobs(availableJobs);

      // Get companies
      const allCompanies = await base44.entities.Company.list();
      const companyMap = {};
      allCompanies.forEach(c => { companyMap[c.id] = c; });
      setCompanies(companyMap);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const currentJob = jobs[currentIndex];
  const currentCompany = currentJob ? companies[currentJob.company_id] : null;

  // Check deal breakers and calculate match score for current job
    useEffect(() => {
      if (currentJob && candidate && currentCompany) {
        const { violations } = checkDealBreakers(candidate, currentJob, currentCompany);
        setDealBreakerWarnings(violations);

        const { score } = calculateMatchScore(candidate, currentJob, currentCompany);
        setCurrentMatchScore(score);
      } else {
        setDealBreakerWarnings([]);
        setCurrentMatchScore(null);
      }
    }, [currentJob, candidate, currentCompany, checkDealBreakers, calculateMatchScore]);

  const handleSwipe = async (direction, feedback = null) => {
    if (!currentJob || !candidate) return;

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
      if (currentCompany?.user_id) {
        await base44.entities.Notification.create({
          user_id: currentCompany.user_id,
          type: 'system',
          title: '👀 Someone is interested!',
          message: `A candidate swiped right on your ${currentJob.title} position. Check your candidates to find them!`
        });
      }
      
      // Check if employer swiped right on this candidate (for any of their jobs or directly on candidate)
      const employerSwipes = await base44.entities.Swipe.filter({
        swiper_type: 'employer',
        target_id: candidate.id,
        direction: 'right'
      });

      const mutualSwipe = employerSwipes.find(s => s.direction === 'right' || s.direction === 'super');
      
      if (mutualSwipe) {
        // Create match
        const match = await base44.entities.Match.create({
          candidate_id: candidate.id,
          company_id: currentJob.company_id,
          job_id: currentJob.id,
          candidate_user_id: user.id,
          company_user_id: currentCompany?.user_id,
          match_score: currentMatchScore || 85
        });
        
        // Notify both parties
        await Promise.all([
          base44.entities.Notification.create({
            user_id: user.id,
            type: 'new_match',
            title: '🎉 It\'s a Match!',
            message: `You matched with ${currentCompany?.name} for ${currentJob.title}!`,
            match_id: match.id,
            job_id: currentJob.id
          }),
          base44.entities.Notification.create({
            user_id: currentCompany?.user_id,
            type: 'new_match',
            title: '🎉 It\'s a Match!',
            message: `You matched with a candidate for ${currentJob.title}!`,
            match_id: match.id,
            job_id: currentJob.id
          })
        ]);
        
        setMatchData({ match, job: currentJob, company: currentCompany, candidate });
        setShowMatch(true);
      }
    }

    setIsFlipped(false);
    setCurrentIndex(currentIndex + 1);
    x.set(0);
  };

  const handleUndo = () => {
    if (swipeHistory.length === 0) return;
    const lastSwipe = swipeHistory[swipeHistory.length - 1];
    setSwipeHistory(swipeHistory.slice(0, -1));
    setCurrentIndex(lastSwipe.index);
  };

  const handleDragEnd = (event, info) => {
    if (info.offset.x > 100) {
      triggerSwipe('right');
    } else if (info.offset.x < -100) {
      triggerSwipe('left');
    } else {
      x.set(0);
    }
  };

  const triggerSwipe = (direction) => {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-8">
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
      `}</style>

      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Discover Jobs</h1>
          <p className="text-gray-500">Swipe right on opportunities you love</p>
        </div>

        {/* Card Stack */}
        <div className="relative h-[480px] mb-8">
          {currentJob ? (
            <>
              {/* Background card */}
              {jobs[currentIndex + 1] && (
                <div className="absolute inset-0 scale-95 opacity-50">
                  <JobCard
                    job={jobs[currentIndex + 1]}
                    company={companies[jobs[currentIndex + 1].company_id]}
                    isFlipped={false}
                  />
                </div>
              )}

              {/* Active card */}
              <motion.div
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                style={{ x, rotate, opacity }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd}
              >
                <JobCard
                                        job={currentJob}
                                        company={currentCompany}
                                        isFlipped={isFlipped}
                                        onFlip={() => setIsFlipped(!isFlipped)}
                                        matchScore={currentMatchScore}
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
              </motion.div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl shadow-lg">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center mb-4">
                <Inbox className="w-10 h-10 text-pink-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No More Jobs</h3>
              <p className="text-gray-500">Check back later for new opportunities!</p>
            </div>
          )}
        </div>

        {/* Deal Breaker Warnings */}
                  {dealBreakerWarnings.length > 0 && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-center gap-2 text-amber-700 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium text-sm">Deal Breaker Warnings</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {dealBreakerWarnings.map((warning, i) => (
                          <Badge key={i} variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
                            {warning.text}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Controls */}
                  {currentJob && (
                    <SwipeControls
                      onSwipe={triggerSwipe}
                      onUndo={handleUndo}
                      canUndo={swipeHistory.length > 0}
                      isPremium={candidate?.is_premium}
                    />
                  )}

        {/* Progress */}
        {jobs.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-400">
            {currentIndex + 1} of {jobs.length} jobs
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
            </div>
          );
        }
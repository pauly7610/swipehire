import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import CandidateCard from '@/components/swipe/CandidateCard';
import SwipeControls from '@/components/swipe/SwipeControls';
import MatchModal from '@/components/swipe/MatchModal';
import MatchInsights from '@/components/matching/MatchInsights';
import { useAIMatching } from '@/components/matching/useAIMatching';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Inbox, Briefcase, Sparkles } from 'lucide-react';
import SwipeFeedback from '@/components/matching/SwipeFeedback';

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

  useEffect(() => {
    if (selectedJobId) {
      loadCandidatesForJob();
    }
  }, [selectedJobId]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [companyData] = await base44.entities.Company.filter({ user_id: currentUser.id });
      setCompany(companyData);

      if (companyData) {
        const companyJobs = await base44.entities.Job.filter({ company_id: companyData.id, is_active: true });
        setJobs(companyJobs);

        if (jobIdParam) {
          setSelectedJobId(jobIdParam);
        } else if (companyJobs.length > 0) {
          setSelectedJobId(companyJobs[0].id);
        }
      }

      // Load all users for display
      const allUsers = await base44.entities.User.list();
      const userMap = {};
      allUsers.forEach(u => { userMap[u.id] = u; });
      setUsers(userMap);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const loadCandidatesForJob = async () => {
    if (!selectedJobId || !company) return;

    // Get already swiped candidates for this job
    const existingSwipes = await base44.entities.Swipe.filter({
      swiper_id: user?.id,
      swiper_type: 'employer',
      job_id: selectedJobId
    });
    const swipedCandidateIds = new Set(existingSwipes.map(s => s.target_id));

    // Get all candidates
    const allCandidates = await base44.entities.Candidate.list();
    const availableCandidates = allCandidates.filter(c => !swipedCandidateIds.has(c.id));
    setCandidates(availableCandidates);
    setCurrentIndex(0);
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
      `}</style>

      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Find Candidates</h1>
          <p className="text-gray-500">Swipe right on talent you want to connect with</p>
        </div>

        {/* Job Selector */}
        <div className="mb-6">
          <Select value={selectedJobId} onValueChange={setSelectedJobId}>
            <SelectTrigger className="w-full h-12 bg-white">
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
        <div className="relative h-[500px] mb-8">
          {!selectedJobId ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl shadow-lg">
              <Briefcase className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Select a Job</h3>
              <p className="text-gray-500">Choose a job posting to start finding candidates</p>
            </div>
          ) : currentCandidate ? (
            <>
              {/* Background card */}
                              {candidates[currentIndex + 1] && (
                                <div className="absolute inset-0 scale-95 opacity-50">
                                  <CandidateCard
                                    candidate={candidates[currentIndex + 1]}
                                    user={users[candidates[currentIndex + 1].user_id]}
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
                                <CandidateCard
                                  candidate={currentCandidate}
                                  user={currentCandidateUser}
                                  isFlipped={isFlipped}
                                  onFlip={() => setIsFlipped(!isFlipped)}
                                  matchScore={currentScore}
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
                                      <span className="text-green-500 font-bold text-2xl">LIKE</span>
                                    </motion.div>
              </motion.div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl shadow-lg">
              <Inbox className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No More Candidates</h3>
              <p className="text-gray-500">Check back later for new applicants!</p>
            </div>
          )}
        </div>

        {/* Match Insights */}
                  {currentCandidate && selectedJobId && currentInsights && (
                    <div className="mb-4">
                      <MatchInsights insights={currentInsights} score={currentScore} />
                    </div>
                  )}

                  {/* Controls */}
                  {currentCandidate && selectedJobId && (
                    <SwipeControls
                      onSwipe={triggerSwipe}
                      onUndo={handleUndo}
                      canUndo={swipeHistory.length > 0}
                      isPremium={true}
                    />
                  )}

        {/* Progress */}
        {candidates.length > 0 && selectedJobId && (
          <div className="mt-6 text-center text-sm text-gray-400">
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
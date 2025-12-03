import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, User, MapPin, Briefcase, Star, ChevronRight, 
  RefreshCw, Loader2, CheckCircle, X, Zap, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AICandidateSourcing({ jobs, company, onRefresh }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [users, setUsers] = useState({});
  const [swipedIds, setSwipedIds] = useState(new Set());

  useEffect(() => {
    if (jobs.length > 0) {
      loadSuggestions();
    }
  }, [jobs]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      
      const [allCandidates, allUsers, existingSwipes, existingMatches] = await Promise.all([
        base44.entities.Candidate.list(),
        base44.entities.User.list(),
        base44.entities.Swipe.filter({ swiper_id: currentUser.id, swiper_type: 'employer' }),
        base44.entities.Match.filter({ company_id: company?.id })
      ]);

      const userMap = {};
      allUsers.forEach(u => { userMap[u.id] = u; });
      setUsers(userMap);
      setCandidates(allCandidates);

      // Get already swiped/matched candidate IDs
      const swipedCandidateIds = new Set(existingSwipes.map(s => s.target_id));
      const matchedCandidateIds = new Set(existingMatches.map(m => m.candidate_id));
      const excludeIds = new Set([...swipedCandidateIds, ...matchedCandidateIds]);
      setSwipedIds(excludeIds);

      // Generate AI-powered suggestions for each active job
      const activeJobs = jobs.filter(j => j.is_active).slice(0, 3);
      const allSuggestions = [];

      for (const job of activeJobs) {
        const jobSuggestions = await scoreAndRankCandidates(
          allCandidates.filter(c => !excludeIds.has(c.id)),
          job,
          company,
          userMap
        );
        allSuggestions.push({
          job,
          candidates: jobSuggestions.slice(0, 5)
        });
      }

      setSuggestions(allSuggestions);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
    setLoading(false);
  };

  const scoreAndRankCandidates = async (candidateList, job, companyData, userMap) => {
    const scored = candidateList.map(candidate => {
      let score = 0;
      const matchReasons = [];

      // 1. Skills Match (0-40 points)
      const requiredSkills = job.skills_required || [];
      const candidateSkills = (candidate.skills || []).map(s => s.toLowerCase());
      
      const matchingSkills = requiredSkills.filter(skill =>
        candidateSkills.some(cs => 
          cs.includes(skill.toLowerCase()) || skill.toLowerCase().includes(cs)
        )
      );
      
      const skillScore = requiredSkills.length > 0 
        ? Math.round((matchingSkills.length / requiredSkills.length) * 40)
        : 20;
      score += skillScore;
      
      if (matchingSkills.length > 0) {
        matchReasons.push(`${matchingSkills.length}/${requiredSkills.length} skills match`);
      }

      // 2. Experience Level Match (0-25 points)
      if (job.experience_level_required && candidate.experience_level) {
        const levels = ['entry', 'mid', 'senior', 'lead', 'executive'];
        const reqIdx = levels.indexOf(job.experience_level_required);
        const candIdx = levels.indexOf(candidate.experience_level);
        
        if (candIdx >= reqIdx) {
          score += 25;
          matchReasons.push('Experience level matches');
        } else if (candIdx === reqIdx - 1) {
          score += 15;
        }
      }

      // 3. Years of Experience (0-15 points)
      if (job.experience_years_min && candidate.experience_years >= job.experience_years_min) {
        score += 15;
        matchReasons.push(`${candidate.experience_years}+ years experience`);
      }

      // 4. Location Match (0-10 points)
      if (job.job_type === 'remote') {
        score += 10;
        matchReasons.push('Open to remote');
      } else if (job.location && candidate.location) {
        if (candidate.location.toLowerCase().includes(job.location.toLowerCase().split(',')[0])) {
          score += 10;
          matchReasons.push('Location match');
        }
      }

      // 5. Culture Fit (0-10 points)
      if (companyData?.culture_traits && candidate.culture_preferences) {
        const cultureMatch = companyData.culture_traits.some(trait =>
          candidate.culture_preferences.some(pref =>
            pref.toLowerCase().includes(trait.toLowerCase())
          )
        );
        if (cultureMatch) {
          score += 10;
          matchReasons.push('Culture alignment');
        }
      }

      // 6. Profile completeness bonus
      if (candidate.photo_url) score += 3;
      if (candidate.video_intro_url) score += 5;
      if (candidate.resume_url) score += 4;
      if (candidate.headline) score += 3;

      return {
        ...candidate,
        matchScore: Math.min(99, score),
        matchReasons,
        user: userMap[candidate.user_id]
      };
    });

    return scored
      .filter(c => c.matchScore >= 40)
      .sort((a, b) => b.matchScore - a.matchScore);
  };

  const handleQuickSwipe = async (candidate, job, direction) => {
    try {
      const currentUser = await base44.auth.me();
      await base44.entities.Swipe.create({
        swiper_id: currentUser.id,
        swiper_type: 'employer',
        target_id: candidate.id,
        target_type: 'candidate',
        direction,
        job_id: job.id
      });

      // Update local state to remove candidate from suggestions
      setSwipedIds(prev => new Set(prev).add(candidate.id));
      setSuggestions(prev => prev.map(s => ({
        ...s,
        candidates: s.candidates.filter(c => c.id !== candidate.id)
      })));

      if (direction === 'right') {
        // Check for mutual match
        const candidateSwipes = await base44.entities.Swipe.filter({
          swiper_type: 'candidate',
          swiper_id: candidate.user_id,
          target_id: job.id
        });

        if (candidateSwipes.some(s => s.direction === 'right' || s.direction === 'super')) {
          await base44.entities.Match.create({
            candidate_id: candidate.id,
            company_id: company.id,
            job_id: job.id,
            candidate_user_id: candidate.user_id,
            company_user_id: currentUser.id,
            match_score: candidate.matchScore
          });
        }
      }

      onRefresh?.();
    } catch (error) {
      console.error('Swipe failed:', error);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-3" />
          <p className="text-gray-500">AI is finding top candidates...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Candidate Sourcing</CardTitle>
              <p className="text-sm text-gray-500">Top matches for your open positions</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={loadSuggestions} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {suggestions.length === 0 || suggestions.every(s => s.candidates.length === 0) ? (
          <div className="p-8 text-center">
            <Target className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No new candidate suggestions</p>
            <p className="text-sm text-gray-400 mt-1">Post more jobs or check back later</p>
          </div>
        ) : (
          <div className="divide-y">
            {suggestions.filter(s => s.candidates.length > 0).map(({ job, candidates: jobCandidates }) => (
              <div key={job.id} className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="w-4 h-4 text-pink-500" />
                  <span className="font-medium text-gray-900">{job.title}</span>
                  <Badge variant="secondary" className="text-xs">
                    {jobCandidates.length} suggestions
                  </Badge>
                </div>

                <div className="space-y-2">
                  <AnimatePresence>
                    {jobCandidates.slice(0, 3).map((candidate, idx) => (
                      <motion.div
                        key={candidate.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                      >
                        {candidate.photo_url ? (
                          <img src={candidate.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white font-semibold">
                            {candidate.user?.full_name?.charAt(0) || 'C'}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {candidate.user?.full_name || 'Candidate'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{candidate.headline}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {candidate.matchReasons.slice(0, 2).map((reason, i) => (
                              <Badge key={i} variant="secondary" className="text-xs bg-green-50 text-green-700">
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right mr-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-bold text-gray-900">{candidate.matchScore}%</span>
                            </div>
                            <p className="text-xs text-gray-500">match</p>
                          </div>

                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-500"
                              onClick={() => handleQuickSwipe(candidate, job, 'left')}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-8 h-8 rounded-full bg-green-50 hover:bg-green-100 text-green-500"
                              onClick={() => handleQuickSwipe(candidate, job, 'right')}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {jobCandidates.length > 3 && (
                  <Link to={createPageUrl('SwipeCandidates') + `?jobId=${job.id}`}>
                    <Button variant="ghost" size="sm" className="w-full mt-2 text-pink-500">
                      View {jobCandidates.length - 3} more <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
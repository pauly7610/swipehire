import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, MapPin, DollarSign, Briefcase, Building2, User,
  Loader2, Heart, X, Star, ChevronUp, Filter, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useAIMatching } from '@/components/matching/useAIMatching';
import MatchModal from '@/components/swipe/MatchModal';

export default function DiscoverFeed() {
  const [user, setUser] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [company, setCompany] = useState(null);
  const [userType, setUserType] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  
  // Data
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [companies, setCompanies] = useState({});
  const [users, setUsers] = useState({});
  
  // Feed items (mixed jobs and candidates)
  const [feedItems, setFeedItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipedIds, setSwipedIds] = useState(new Set());
  
  // Match modal
  const [showMatch, setShowMatch] = useState(false);
  const [matchData, setMatchData] = useState(null);
  
  const { calculateMatchScore } = useAIMatching();
  
  // Swipe mechanics
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const passOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);
  const applyOpacity = useTransform(x, [0, 50, 100], [0, 0.5, 1]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterFeed();
  }, [searchQuery, activeTab, jobs, candidates, userType]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [allJobs, allCandidates, allCompanies, allUsers] = await Promise.all([
        base44.entities.Job.filter({ is_active: true }),
        base44.entities.Candidate.list(),
        base44.entities.Company.list(),
        base44.entities.User.list()
      ]);

      // Determine user type
      const [candidateData] = allCandidates.filter(c => c.user_id === currentUser.id);
      const [companyData] = allCompanies.filter(c => c.user_id === currentUser.id);
      
      setCandidate(candidateData);
      setCompany(companyData);
      setUserType(companyData ? 'employer' : 'candidate');

      setJobs(allJobs);
      setCandidates(allCandidates.filter(c => c.user_id !== currentUser.id));

      const companyMap = {};
      allCompanies.forEach(c => { companyMap[c.id] = c; });
      setCompanies(companyMap);

      const userMap = {};
      allUsers.forEach(u => { userMap[u.id] = u; });
      setUsers(userMap);

      // Get already swiped items
      const existingSwipes = await base44.entities.Swipe.filter({ swiper_id: currentUser.id });
      setSwipedIds(new Set(existingSwipes.map(s => s.target_id)));
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const filterFeed = () => {
    let items = [];
    const query = searchQuery.toLowerCase();

    if (userType === 'candidate') {
      // Candidates see jobs
      let filteredJobs = jobs.filter(job => !swipedIds.has(job.id));
      
      if (query) {
        filteredJobs = filteredJobs.filter(job => {
          const company = companies[job.company_id];
          const searchText = [
            job.title,
            job.description,
            job.location,
            ...(job.skills_required || []),
            company?.name,
            company?.industry
          ].join(' ').toLowerCase();
          return searchText.includes(query);
        });
      }

      if (activeTab === 'remote') {
        filteredJobs = filteredJobs.filter(j => j.job_type === 'remote');
      } else if (activeTab === 'fulltime') {
        filteredJobs = filteredJobs.filter(j => j.job_type === 'full-time');
      }

      items = filteredJobs.map(job => ({ type: 'job', data: job }));
    } else {
      // Employers see candidates
      let filteredCandidates = candidates.filter(c => !swipedIds.has(c.id));
      
      if (query) {
        filteredCandidates = filteredCandidates.filter(cand => {
          const candUser = users[cand.user_id];
          const searchText = [
            candUser?.full_name,
            cand.headline,
            cand.bio,
            cand.location,
            ...(cand.skills || [])
          ].join(' ').toLowerCase();
          return searchText.includes(query);
        });
      }

      items = filteredCandidates.map(cand => ({ type: 'candidate', data: cand }));
    }

    setFeedItems(items);
    setCurrentIndex(0);
  };

  const handleSwipe = async (direction) => {
    const currentItem = feedItems[currentIndex];
    if (!currentItem) return;

    const swipeData = {
      swiper_id: user.id,
      swiper_type: userType,
      target_id: currentItem.data.id,
      target_type: currentItem.type,
      direction,
      job_id: currentItem.type === 'job' ? currentItem.data.id : undefined
    };

    await base44.entities.Swipe.create(swipeData);
    setSwipedIds(prev => new Set(prev).add(currentItem.data.id));

    // Check for match
    if (direction === 'right' || direction === 'super') {
      if (currentItem.type === 'job' && candidate) {
        // Check if employer swiped right on this candidate for this job
        const employerSwipes = await base44.entities.Swipe.filter({
          swiper_type: 'employer',
          target_id: candidate.id,
          job_id: currentItem.data.id
        });

        const mutualSwipe = employerSwipes.find(s => s.direction === 'right' || s.direction === 'super');
        if (mutualSwipe) {
          const jobCompany = companies[currentItem.data.company_id];
          const match = await base44.entities.Match.create({
            candidate_id: candidate.id,
            company_id: currentItem.data.company_id,
            job_id: currentItem.data.id,
            candidate_user_id: user.id,
            company_user_id: jobCompany?.user_id,
            match_score: 85
          });
          
          setMatchData({ match, job: currentItem.data, company: jobCompany, candidate });
          setShowMatch(true);
        }
      }
    }

    setCurrentIndex(prev => prev + 1);
    x.set(0);
  };

  const handleDragEnd = (event, info) => {
    if (info.offset.x > 100) {
      handleSwipe('right');
    } else if (info.offset.x < -100) {
      handleSwipe('left');
    } else {
      x.set(0);
    }
  };

  const formatSalary = (min, max, type) => {
    if (!min && !max) return null;
    const format = (n) => n >= 1000 ? `$${(n/1000).toFixed(0)}k` : `$${n}`;
    return `${format(min || 0)} - ${format(max || 0)}`;
  };

  const currentItem = feedItems[currentIndex];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <style>{`
        .swipe-gradient { background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%); }
      `}</style>

      {/* Search Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-200 p-4">
        <div className="max-w-md mx-auto">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder={userType === 'candidate' ? "Search jobs, skills, companies..." : "Search candidates, skills..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-full border-gray-200"
            />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full bg-gray-100 rounded-full p-1">
              <TabsTrigger value="all" className="flex-1 rounded-full data-[state=active]:bg-white">All</TabsTrigger>
              {userType === 'candidate' && (
                <>
                  <TabsTrigger value="remote" className="flex-1 rounded-full data-[state=active]:bg-white">Remote</TabsTrigger>
                  <TabsTrigger value="fulltime" className="flex-1 rounded-full data-[state=active]:bg-white">Full-time</TabsTrigger>
                </>
              )}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Swipeable Feed */}
      <div className="p-4 pb-24">
        <div className="max-w-md mx-auto">
          <div className="relative h-[500px]">
            {currentItem ? (
              <>
                {/* Background card */}
                {feedItems[currentIndex + 1] && (
                  <div className="absolute inset-0 scale-95 opacity-50">
                    <FeedCard item={feedItems[currentIndex + 1]} companies={companies} users={users} />
                  </div>
                )}

                {/* Active card */}
                <motion.div
                  className="absolute inset-0 cursor-grab active:cursor-grabbing"
                  style={{ x, rotate }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={handleDragEnd}
                >
                  <FeedCard item={currentItem} companies={companies} users={users} />

                  {/* Swipe indicators */}
                  <motion.div
                    className="absolute top-8 left-8 px-4 py-2 border-4 border-red-500 rounded-lg"
                    style={{ opacity: passOpacity, rotate: -20 }}
                  >
                    <span className="text-red-500 font-bold text-2xl">PASS</span>
                  </motion.div>
                  <motion.div
                    className="absolute top-8 right-8 px-4 py-2 border-4 border-green-500 rounded-lg"
                    style={{ opacity: applyOpacity, rotate: 20 }}
                  >
                    <span className="text-green-500 font-bold text-2xl">
                      {userType === 'candidate' ? 'APPLY' : 'LIKE'}
                    </span>
                  </motion.div>
                </motion.div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl shadow-lg">
                <Sparkles className="w-16 h-16 text-pink-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {searchQuery ? 'No Results' : 'All Caught Up!'}
                </h3>
                <p className="text-gray-500">
                  {searchQuery ? 'Try a different search' : 'Check back later for more'}
                </p>
              </div>
            )}
          </div>

          {/* Swipe Controls */}
          {currentItem && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSwipe('left')}
                className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-red-100"
              >
                <X className="w-8 h-8 text-red-500" />
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSwipe('super')}
                className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-blue-100"
              >
                <Star className="w-6 h-6 text-blue-500" />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSwipe('right')}
                className="w-16 h-16 rounded-full swipe-gradient shadow-lg flex items-center justify-center"
              >
                <Heart className="w-8 h-8 text-white" />
              </motion.button>
            </div>
          )}

          {/* Progress */}
          {feedItems.length > 0 && (
            <div className="mt-4 text-center text-sm text-gray-400">
              {currentIndex + 1} of {feedItems.length}
            </div>
          )}
        </div>
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
    </div>
  );
}

function FeedCard({ item, companies, users }) {
  if (item.type === 'job') {
    const job = item.data;
    const company = companies[job.company_id];
    
    return (
      <Card className="h-full border-0 shadow-xl rounded-3xl overflow-hidden bg-white">
        <CardContent className="h-full p-0 flex flex-col">
          {/* Header */}
          <div className="p-6 bg-gradient-to-br from-pink-50 to-orange-50">
            <div className="flex items-start gap-4">
              {company?.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="w-16 h-16 rounded-2xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                <p className="text-gray-600">{company?.name}</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex flex-wrap gap-2 mb-4">
              {job.location && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {job.location}
                </Badge>
              )}
              <Badge variant="secondary" className="capitalize">
                {job.job_type?.replace('-', ' ')}
              </Badge>
              {job.salary_min && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> 
                  {job.salary_min >= 1000 ? `${(job.salary_min/1000).toFixed(0)}k` : job.salary_min}
                  {job.salary_max && ` - ${job.salary_max >= 1000 ? `${(job.salary_max/1000).toFixed(0)}k` : job.salary_max}`}
                </Badge>
              )}
            </div>

            {job.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{job.description}</p>
            )}

            {job.skills_required?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {job.skills_required.slice(0, 6).map((skill) => (
                  <Badge key={skill} className="bg-pink-100 text-pink-700 text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50">
            <p className="text-center text-sm text-gray-500">
              Swipe right to apply • Swipe left to pass
            </p>
          </div>
        </CardContent>
      </Card>
    );
  } else {
    const cand = item.data;
    const candUser = users[cand.user_id];
    
    return (
      <Card className="h-full border-0 shadow-xl rounded-3xl overflow-hidden bg-white">
        <CardContent className="h-full p-0 flex flex-col">
          {/* Header with photo */}
          <div className="relative h-48 bg-gradient-to-br from-pink-100 to-orange-100">
            {cand.photo_url ? (
              <img src={cand.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-20 h-20 text-pink-300" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900">{candUser?.full_name || 'Candidate'}</h3>
            <p className="text-gray-600 mb-3">{cand.headline}</p>

            {cand.location && (
              <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                <MapPin className="w-4 h-4" /> {cand.location}
              </div>
            )}

            {cand.bio && (
              <p className="text-gray-600 text-sm mb-4">{cand.bio}</p>
            )}

            {cand.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {cand.skills.slice(0, 6).map((skill) => (
                  <Badge key={skill} className="bg-pink-100 text-pink-700 text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50">
            <p className="text-center text-sm text-gray-500">
              Swipe right to connect • Swipe left to pass
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
}
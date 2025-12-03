import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, MapPin, DollarSign, Briefcase, Building2, 
  Loader2, Filter, Star, Clock, Heart, X, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useAIMatching } from '@/components/matching/useAIMatching';

const PAGE_SIZE = 15;

export default function JobsList() {
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    jobType: 'all',
    experienceLevel: 'all'
  });
  const [user, setUser] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [matchScores, setMatchScores] = useState({});
  const [sortBy, setSortBy] = useState('match');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [displayedJobs, setDisplayedJobs] = useState([]);
  const [likedJobs, setLikedJobs] = useState(new Set());
  
  const observerRef = useRef();
  const { calculateMatchScore } = useAIMatching();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    filterAndPaginateJobs();
  }, [searchQuery, filters, sortBy, jobs, matchScores]);

  const loadInitialData = async () => {
    try {
      const [currentUser, allJobs, allCompanies] = await Promise.all([
        base44.auth.me(),
        base44.entities.Job.filter({ is_active: true }),
        base44.entities.Company.list()
      ]);
      
      setUser(currentUser);
      setJobs(allJobs);
      
      const companyMap = {};
      allCompanies.forEach(c => { companyMap[c.id] = c; });
      setCompanies(companyMap);

      // Get candidate profile for match scoring
      const [candidateData] = await base44.entities.Candidate.filter({ user_id: currentUser.id });
      setCandidate(candidateData);

      // Get liked jobs
      const swipes = await base44.entities.Swipe.filter({ 
        swiper_id: currentUser.id, 
        direction: 'right' 
      });
      setLikedJobs(new Set(swipes.map(s => s.target_id)));

      // Calculate match scores
      if (candidateData) {
        const scores = {};
        for (const job of allJobs) {
          const company = companyMap[job.company_id];
          const result = await calculateMatchScore(candidateData, job, company);
          scores[job.id] = result.score;
        }
        setMatchScores(scores);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
    setLoading(false);
  };

  const filterAndPaginateJobs = () => {
    let filtered = [...jobs];
    const query = searchQuery.toLowerCase();

    // Search filter
    if (query) {
      filtered = filtered.filter(job => {
        const company = companies[job.company_id];
        const searchText = [
          job.title,
          job.description,
          job.location,
          ...(job.skills_required || []),
          company?.name
        ].join(' ').toLowerCase();
        return searchText.includes(query);
      });
    }

    // Job type filter
    if (filters.jobType !== 'all') {
      filtered = filtered.filter(j => j.job_type === filters.jobType);
    }

    // Experience filter
    if (filters.experienceLevel !== 'all') {
      filtered = filtered.filter(j => j.experience_level_required === filters.experienceLevel);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'match') {
        return (matchScores[b.id] || 0) - (matchScores[a.id] || 0);
      } else if (sortBy === 'recent') {
        return new Date(b.created_date) - new Date(a.created_date);
      } else if (sortBy === 'salary') {
        return (b.salary_max || 0) - (a.salary_max || 0);
      }
      return 0;
    });

    // Paginate
    const paginated = filtered.slice(0, (page + 1) * PAGE_SIZE);
    setDisplayedJobs(paginated);
    setHasMore(paginated.length < filtered.length);
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      setPage(prev => prev + 1);
      setTimeout(() => setLoadingMore(false), 300);
    }
  }, [loadingMore, hasMore]);

  // Infinite scroll observer
  const lastJobRef = useCallback((node) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, loadMore]);

  const handleQuickApply = async (job) => {
    if (!user || !candidate) return;
    
    if (likedJobs.has(job.id)) {
      // Unlike
      const [swipe] = await base44.entities.Swipe.filter({ 
        swiper_id: user.id, 
        target_id: job.id 
      });
      if (swipe) await base44.entities.Swipe.delete(swipe.id);
      setLikedJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(job.id);
        return newSet;
      });
    } else {
      // Like
      await base44.entities.Swipe.create({
        swiper_id: user.id,
        swiper_type: 'candidate',
        target_id: job.id,
        target_type: 'job',
        direction: 'right',
        job_id: job.id
      });
      setLikedJobs(prev => new Set(prev).add(job.id));
    }
  };

  const formatSalary = (min, max, type) => {
    if (!min && !max) return null;
    const format = (n) => n >= 1000 ? `$${(n/1000).toFixed(0)}k` : `$${n}`;
    const suffix = type === 'yearly' ? '/yr' : type === 'monthly' ? '/mo' : '/hr';
    if (min && max) return `${format(min)} - ${format(max)}${suffix}`;
    if (min) return `${format(min)}+${suffix}`;
    return `Up to ${format(max)}${suffix}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <style>{`
        .swipe-gradient { background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%); }
      `}</style>

      {/* Sticky Search Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="p-4">
          <div className="max-w-2xl mx-auto">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search jobs, skills, companies..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                className="pl-10 h-12 rounded-full"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Select value={filters.jobType} onValueChange={(v) => { setFilters({...filters, jobType: v}); setPage(0); }}>
                <SelectTrigger className="w-[120px] h-9 rounded-full text-sm">
                  <Briefcase className="w-3 h-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(0); }}>
                <SelectTrigger className="w-[120px] h-9 rounded-full text-sm">
                  <Filter className="w-3 h-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="match">Best Match</SelectItem>
                  <SelectItem value="recent">Newest</SelectItem>
                  <SelectItem value="salary">Salary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs Feed */}
      <div className="p-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm text-gray-500 mb-4">{displayedJobs.length} jobs found</p>

          <div className="space-y-3">
            <AnimatePresence>
              {displayedJobs.map((job, index) => {
                const company = companies[job.company_id];
                const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type);
                const matchScore = matchScores[job.id];
                const isLast = index === displayedJobs.length - 1;
                const isLiked = likedJobs.has(job.id);

                return (
                  <motion.div
                    key={job.id}
                    ref={isLast ? lastJobRef : null}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.3) }}
                  >
                    <Card className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex">
                          {/* Quick Action Side */}
                          <button
                            onClick={() => handleQuickApply(job)}
                            className={`w-16 flex-shrink-0 flex items-center justify-center transition-colors ${
                              isLiked 
                                ? 'bg-gradient-to-b from-pink-500 to-orange-500' 
                                : 'bg-gray-100 hover:bg-pink-50'
                            }`}
                          >
                            <Heart className={`w-6 h-6 ${isLiked ? 'text-white fill-white' : 'text-gray-400'}`} />
                          </button>

                          {/* Content */}
                          <Link 
                            to={createPageUrl('PublicJobView') + `?id=${job.id}`}
                            className="flex-1 p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              {company?.logo_url ? (
                                <img src={company.logo_url} alt={company.name} className="w-12 h-12 rounded-xl object-cover" />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                                  <Building2 className="w-6 h-6 text-pink-500" />
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h3 className="font-semibold text-gray-900 line-clamp-1">{job.title}</h3>
                                    <p className="text-sm text-gray-600">{company?.name}</p>
                                  </div>
                                  
                                  {matchScore && (
                                    <Badge className="bg-pink-100 text-pink-700 text-xs flex-shrink-0">
                                      {matchScore}%
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
                                  {job.location && (
                                    <span className="flex items-center gap-0.5">
                                      <MapPin className="w-3 h-3" /> {job.location}
                                    </span>
                                  )}
                                  {salary && (
                                    <span className="flex items-center gap-0.5">
                                      <DollarSign className="w-3 h-3" /> {salary}
                                    </span>
                                  )}
                                  <Badge variant="outline" className="text-xs capitalize py-0">
                                    {job.job_type?.replace('-', ' ')}
                                  </Badge>
                                </div>

                                {job.skills_required?.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {job.skills_required.slice(0, 3).map((skill) => (
                                      <Badge key={skill} variant="secondary" className="text-xs py-0 bg-gray-100">
                                        {skill}
                                      </Badge>
                                    ))}
                                    {job.skills_required.length > 3 && (
                                      <Badge variant="secondary" className="text-xs py-0 bg-gray-100">
                                        +{job.skills_required.length - 3}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Loading More */}
          {loadingMore && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
            </div>
          )}

          {/* End of List */}
          {!hasMore && displayedJobs.length > 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>You've seen all jobs!</p>
            </div>
          )}

          {/* No Results */}
          {displayedJobs.length === 0 && !loading && (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No jobs found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
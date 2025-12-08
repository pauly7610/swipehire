import React, { useState, useEffect } from 'react';
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
  Loader2, Filter, ChevronDown, Star, Clock, Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useAIMatching } from '@/components/matching/useAIMatching';

export default function BrowseJobs() {
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    jobType: 'all',
    experienceLevel: 'all',
    location: ''
  });
  const [user, setUser] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [matchScores, setMatchScores] = useState({});
  const [sortBy, setSortBy] = useState('match');
  
  const { calculateMatchScore } = useAIMatching();

  useEffect(() => {
    loadData();
  }, []);

  const handleJobAction = (action) => {
    if (!user) {
      setShowLoginPrompt(true);
      return false;
    }
    return true;
  };

  const loadData = async () => {
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

      // Calculate match scores for all jobs
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

  const formatSalary = (min, max, type) => {
    if (!min && !max) return null;
    const format = (n) => n >= 1000 ? `$${(n/1000).toFixed(0)}k` : `$${n}`;
    const suffix = type === 'yearly' ? '/yr' : type === 'monthly' ? '/mo' : '/hr';
    if (min && max) return `${format(min)} - ${format(max)}${suffix}`;
    if (min) return `${format(min)}+${suffix}`;
    return `Up to ${format(max)}${suffix}`;
  };

  const filteredJobs = jobs.filter(job => {
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchableText = [
        job.title,
        job.description,
        job.location,
        ...(job.skills_required || []),
        companies[job.company_id]?.name
      ].join(' ').toLowerCase();
      if (!searchableText.includes(query)) return false;
    }

    // Job type filter
    if (filters.jobType !== 'all' && job.job_type !== filters.jobType) return false;

    // Experience level filter
    if (filters.experienceLevel !== 'all' && job.experience_level_required !== filters.experienceLevel) return false;

    // Location filter
    if (filters.location && !job.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;

    return true;
  });

  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'match') {
      return (matchScores[b.id] || 0) - (matchScores[a.id] || 0);
    } else if (sortBy === 'recent') {
      return new Date(b.created_date) - new Date(a.created_date);
    } else if (sortBy === 'salary') {
      return (b.salary_max || 0) - (a.salary_max || 0);
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pb-24">
      <style>{`
        .swipe-gradient { background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%); }
      `}</style>

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Browse All Jobs</h1>
          <p className="text-gray-500">{filteredJobs.length} open positions</p>
        </div>

        {/* Search & Filters */}
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search jobs, skills, companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Select value={filters.jobType} onValueChange={(v) => setFilters({...filters, jobType: v})}>
                  <SelectTrigger className="w-[130px]">
                    <Briefcase className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.experienceLevel} onValueChange={(v) => setFilters({...filters, experienceLevel: v})}>
                  <SelectTrigger className="w-[140px]">
                    <Users className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="entry">Entry</SelectItem>
                    <SelectItem value="mid">Mid</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[130px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="match">Best Match</SelectItem>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="salary">Highest Salary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        {sortedJobs.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No jobs found matching your criteria</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedJobs.map((job, index) => {
              const company = companies[job.company_id];
              const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type);
              const matchScore = matchScores[job.id];

              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Company Logo */}
                        {company?.logo_url ? (
                          <img 
                            src={company.logo_url} 
                            alt={company.name}
                            className="w-14 h-14 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                            <Building2 className="w-7 h-7 text-pink-500" />
                          </div>
                        )}

                        {/* Job Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                              <p className="text-gray-600">{company?.name}</p>
                            </div>
                            
                            {/* Match Score */}
                            {matchScore && (
                              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-pink-100 to-orange-100">
                                <Star className="w-4 h-4 text-pink-500" />
                                <span className="text-sm font-semibold text-pink-600">{matchScore}% match</span>
                              </div>
                            )}
                          </div>

                          {/* Meta Info */}
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {job.location}
                              </span>
                            )}
                            {salary && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                {salary}
                              </span>
                            )}
                            <Badge variant="secondary" className="capitalize">
                              {job.job_type?.replace('-', ' ')}
                            </Badge>
                            {job.experience_level_required && (
                              <Badge variant="outline" className="capitalize">
                                {job.experience_level_required}
                              </Badge>
                            )}
                          </div>

                          {/* Skills */}
                          {job.skills_required?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {job.skills_required.slice(0, 5).map((skill) => (
                                <Badge 
                                  key={skill} 
                                  variant="secondary"
                                  className="bg-gray-100 text-gray-600 text-xs"
                                >
                                  {skill}
                                </Badge>
                              ))}
                              {job.skills_required.length > 5 && (
                                <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
                                  +{job.skills_required.length - 5}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-3 mt-4 pt-3 border-t">
                            <Link to={createPageUrl('PublicJobView') + `?id=${job.id}`}>
                              <Button size="sm" className="swipe-gradient text-white">
                                View Details
                              </Button>
                            </Link>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Posted {formatDistanceToNow(new Date(job.created_date), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Search, Filter, MapPin, Briefcase, Star, X, Loader2, Heart, User, MessageCircle, GitBranch, Send } from 'lucide-react';
import FavoriteCandidateButton from '@/components/networking/FavoriteCandidateButton';
import RecruiterSignalPanel from '@/components/recruiter/RecruiterSignalPanel';

export default function BrowseCandidates() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [skillFilter, setSkillFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [minExperience, setMinExperience] = useState('');
  const [maxExperience, setMaxExperience] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [showBulkMessage, setShowBulkMessage] = useState(false);
  const [showBulkPipeline, setShowBulkPipeline] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedPipeline, setSelectedPipeline] = useState('matched');
  const [jobs, setJobs] = useState([]);
  const [sending, setSending] = useState(false);
  const [readinessMap, setReadinessMap] = useState({});
  const [selectedCandidateForSignals, setSelectedCandidateForSignals] = useState(null);

  // Get unique values for filters
  const [industries, setIndustries] = useState([]);
  const [locations, setLocations] = useState([]);
  const [allSkills, setAllSkills] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [candidates, searchQuery, experienceLevel, industryFilter, locationFilter, skillFilter, minExperience, maxExperience, sortBy]);

  const loadData = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        navigate(createPageUrl('Welcome'), { replace: true });
        return;
      }

      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [companyData] = await base44.entities.Company.filter({ user_id: currentUser.id });
      
      if (!companyData) {
        console.error('No company profile found');
        navigate(createPageUrl('Onboarding'), { replace: true });
        return;
      }

      setCompany(companyData);

      // Load all data in parallel for better performance
      const [allCandidates, favs, companyJobs, allUsers, readinessData] = await Promise.all([
        base44.entities.Candidate.list(),
        base44.entities.FavoriteCandidate.filter({ company_id: companyData.id }),
        base44.entities.Job.filter({ company_id: companyData.id, is_active: true }),
        base44.entities.User.list(),
        base44.entities.ApplicationReadiness.list()
      ]);

      // Create users map
      const userMapping = {};
      allUsers.forEach(u => { userMapping[u.id] = u; });
      setUsersMap(userMapping);

      setCandidates(allCandidates);
      setFavorites(favs);
      setJobs(companyJobs);

      // Map readiness data
      const readMap = {};
      readinessData.forEach(r => {
        readMap[r.candidate_id] = r;
      });
      setReadinessMap(readMap);

      // Extract unique values for filters
      const uniqueIndustries = [...new Set(allCandidates.map(c => c.industry).filter(Boolean))];
      const uniqueLocations = [...new Set(allCandidates.map(c => c.location).filter(Boolean))];
      const uniqueSkills = [...new Set(allCandidates.flatMap(c => c.skills || []))];
      
      setIndustries(uniqueIndustries);
      setLocations(uniqueLocations);
      setAllSkills(uniqueSkills);

    } catch (error) {
      console.error('Failed to load data:', error);
      navigate(createPageUrl('Welcome'), { replace: true });
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...candidates];

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.headline?.toLowerCase().includes(query) ||
        c.bio?.toLowerCase().includes(query) ||
        c.skills?.some(s => s.toLowerCase().includes(query)) ||
        c.location?.toLowerCase().includes(query)
      );
    }

    // Experience level
    if (experienceLevel !== 'all') {
      filtered = filtered.filter(c => c.experience_level === experienceLevel);
    }

    // Industry
    if (industryFilter !== 'all') {
      filtered = filtered.filter(c => c.industry === industryFilter);
    }

    // Location
    if (locationFilter !== 'all') {
      filtered = filtered.filter(c => c.location === locationFilter);
    }

    // Skill filter
    if (skillFilter) {
      filtered = filtered.filter(c => 
        c.skills?.some(s => s.toLowerCase().includes(skillFilter.toLowerCase()))
      );
    }

    // Experience years
    if (minExperience) {
      filtered = filtered.filter(c => (c.experience_years || 0) >= parseInt(minExperience));
    }
    if (maxExperience) {
      filtered = filtered.filter(c => (c.experience_years || 0) <= parseInt(maxExperience));
    }

    // Sorting
    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    } else if (sortBy === 'experience') {
      filtered.sort((a, b) => (b.experience_years || 0) - (a.experience_years || 0));
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => (a.headline || '').localeCompare(b.headline || ''));
    }

    setFilteredCandidates(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setExperienceLevel('all');
    setIndustryFilter('all');
    setLocationFilter('all');
    setSkillFilter('');
    setMinExperience('');
    setMaxExperience('');
    setSortBy('recent');
  };

  const toggleSelectCandidate = (candidateId) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId) 
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const selectAll = () => {
    if (selectedCandidates.length === filteredCandidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(filteredCandidates.map(c => c.id));
    }
  };

  const bulkFavorite = async () => {
    const toFavorite = selectedCandidates.filter(id => !isFavorited(id));
    const newFavs = await Promise.all(
      toFavorite.map(candidateId => 
        base44.entities.FavoriteCandidate.create({
          company_id: company.id,
          candidate_id: candidateId,
          recruiter_user_id: user.id
        })
      )
    );
    setFavorites([...favorites, ...newFavs]);
    setSelectedCandidates([]);
  };

  const sendBulkMessage = async () => {
    if (!bulkMessage.trim()) return;
    
    setSending(true);
    try {
      const candidatesList = filteredCandidates.filter(c => selectedCandidates.includes(c.id));
      
      await Promise.all(
        candidatesList.map(async (candidate) => {
          // Create notification for each candidate
          await base44.entities.Notification.create({
            user_id: candidate.user_id,
            type: 'message',
            title: `Message from ${company.name}`,
            message: bulkMessage,
            navigate_to: 'CommunicationHub'
          });

          // Send email
          const users = await base44.entities.User.list();
          const candidateUser = users.find(u => u.id === candidate.user_id);
          if (candidateUser?.email) {
            await base44.integrations.Core.SendEmail({
              to: candidateUser.email,
              subject: `Message from ${company.name} on SwipeHire`,
              body: bulkMessage
            });
          }
        })
      );

      setShowBulkMessage(false);
      setBulkMessage('');
      setSelectedCandidates([]);
    } catch (error) {
      console.error('Failed to send messages:', error);
    }
    setSending(false);
  };

  const addToPipeline = async () => {
    if (!selectedJob) return;
    
    setSending(true);
    try {
      const candidatesList = filteredCandidates.filter(c => selectedCandidates.includes(c.id));
      
      await Promise.all(
        candidatesList.map(candidate => 
          base44.entities.Match.create({
            candidate_id: candidate.id,
            company_id: company.id,
            job_id: selectedJob,
            status: selectedPipeline,
            candidate_user_id: candidate.user_id,
            company_user_id: user.id
          })
        )
      );

      setShowBulkPipeline(false);
      setSelectedJob('');
      setSelectedCandidates([]);
    } catch (error) {
      console.error('Failed to add to pipeline:', error);
    }
    setSending(false);
  };

  const isFavorited = (candidateId) => {
    return favorites.some(f => f.candidate_id === candidateId);
  };

  const handleFavoriteToggle = async (candidateId) => {
    const existing = favorites.find(f => f.candidate_id === candidateId);
    
    if (existing) {
      await base44.entities.FavoriteCandidate.delete(existing.id);
      setFavorites(favorites.filter(f => f.id !== existing.id));
    } else {
      const newFav = await base44.entities.FavoriteCandidate.create({
        company_id: company.id,
        candidate_id: candidateId,
        recruiter_user_id: user.id
      });
      setFavorites([...favorites, newFav]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-24">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 pt-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Candidates</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">{filteredCandidates.length} found</p>
        </div>

        {/* Search and Filters - Mobile First */}
        <Card className="mb-4 dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-3 space-y-3">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Search candidates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400 px-1">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Quick search:</span>
                <code className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded font-mono">Python AND React</code>
                <code className="px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded font-mono">Senior OR Lead</code>
                <code className="px-1.5 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded font-mono">NOT Remote</code>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="entry">Entry</SelectItem>
                  <SelectItem value="mid">Mid</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="experience">Experience</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="h-11"
              >
                <Filter className="w-4 h-4" />
              </Button>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Experience Level</label>
                  <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Industry</label>
                  <Select value={industryFilter} onValueChange={setIndustryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Industries</SelectItem>
                      {industries.map(ind => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Location</label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {locations.map(loc => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Skills</label>
                  <Input
                    placeholder="Filter by skills..."
                    value={skillFilter}
                    onChange={(e) => setSkillFilter(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Min Years Experience</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minExperience}
                    onChange={(e) => setMinExperience(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Max Years Experience</label>
                  <Input
                    type="number"
                    placeholder="20"
                    value={maxExperience}
                    onChange={(e) => setMaxExperience(e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Count and Actions */}
        <div className="mb-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-gray-600 dark:text-gray-400">
              {filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? 's' : ''} found
            </p>
            {selectedCandidates.length > 0 && (
              <Badge className="bg-pink-500">{selectedCandidates.length} selected</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="experience">Most Experience</SelectItem>
                <SelectItem value="name">Alphabetical</SelectItem>
              </SelectContent>
            </Select>

            {/* Bulk Actions */}
            {selectedCandidates.length > 0 && (
              <>
                <Button onClick={() => setShowBulkMessage(true)} variant="outline" className="border-blue-500 text-blue-500">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
                <Button onClick={() => setShowBulkPipeline(true)} variant="outline" className="border-purple-500 text-purple-500">
                  <GitBranch className="w-4 h-4 mr-2" />
                  Add to Pipeline
                </Button>
                <Button onClick={bulkFavorite} variant="outline" className="border-pink-500 text-pink-500">
                  <Heart className="w-4 h-4 mr-2" />
                  Favorite
                </Button>
              </>
            )}

            {/* Select All */}
            <Button variant="outline" onClick={selectAll}>
              {selectedCandidates.length === filteredCandidates.length ? 'Deselect All' : 'Select All'}
            </Button>

            {/* View Favorites */}
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl('FavoriteCandidates'))}
            >
              <Heart className="w-4 h-4 mr-2 text-pink-500" />
              Favorites ({favorites.length})
            </Button>
          </div>
        </div>

        {/* Candidates List */}
        <div className="space-y-4">
          {filteredCandidates.map((candidate) => (
            <Card 
              key={candidate.id} 
              className={`hover:shadow-lg transition-all duration-300 group relative dark:bg-slate-900 dark:border-slate-800 ${selectedCandidates.includes(candidate.id) ? 'ring-1 ring-pink-500' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Select Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedCandidates.includes(candidate.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelectCandidate(candidate.id);
                    }}
                    className="w-5 h-5 rounded border-gray-300 text-pink-500 focus:ring-pink-500 cursor-pointer flex-shrink-0"
                  />

                  {/* Profile Photo */}
                  <div className="cursor-pointer flex-shrink-0" onClick={() => navigate(createPageUrl('ViewCandidateProfile') + `?candidateId=${candidate.id}`)}>
                    {candidate.photo_url ? (
                      <img
                        src={candidate.photo_url}
                        alt={candidate.headline}
                        className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg swipe-gradient flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(createPageUrl('ViewCandidateProfile') + `?candidateId=${candidate.id}`)}>
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate mb-1">
                          {usersMap[candidate.user_id]?.full_name || candidate.headline || 'Professional'}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          {candidate.headline && <span>{candidate.headline}</span>}
                          {candidate.headline && candidate.industry && <span>•</span>}
                          {candidate.industry && <span>{candidate.industry}</span>}
                          {(candidate.headline || candidate.industry) && candidate.location && <span>•</span>}
                          {candidate.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{candidate.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Experience Badge */}
                      {candidate.experience_level && (
                        <Badge className="swipe-gradient text-white capitalize flex-shrink-0">
                          {candidate.experience_level}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {candidate.experience_years && (
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span>{candidate.experience_years} years exp</span>
                        </div>
                      )}
                      {candidate.resume_url && (
                        <Badge variant="outline" className="text-xs">
                          Resume Available
                        </Badge>
                      )}
                    </div>

                    {/* Bio */}
                    {candidate.bio && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">
                        {candidate.bio}
                      </p>
                    )}

                    {/* Skills */}
                    {candidate.skills && candidate.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.skills.slice(0, 6).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {candidate.skills.length > 6 && (
                          <Badge variant="secondary" className="text-xs">
                            +{candidate.skills.length - 6}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Recruiter Signals Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCandidateForSignals(candidate);
                      }}
                      className="border-purple-200 text-purple-600 hover:bg-purple-50"
                    >
                      Insights
                    </Button>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFavoriteToggle(candidate.id);
                      }}
                      className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-all"
                    >
                      <Heart
                        className={`w-5 h-5 ${isFavorited(candidate.id) ? 'fill-pink-500 text-pink-500' : 'text-gray-400'}`}
                      />
                    </button>

                    {/* View Profile Button */}
                    <Button
                      size="sm"
                      className="swipe-gradient text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(createPageUrl('ViewCandidateProfile') + `?candidateId=${candidate.id}`);
                      }}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredCandidates.length === 0 && (
          <Card className="p-12 dark:bg-slate-900 dark:border-slate-800">
            <div className="text-center">
              <Search className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No candidates found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Try adjusting your filters or search query</p>
              <Button onClick={clearFilters} variant="outline">
                Clear All Filters
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Bulk Message Dialog */}
      <Dialog open={showBulkMessage} onOpenChange={setShowBulkMessage}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message to {selectedCandidates.length} Candidates</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Type your message here..."
              value={bulkMessage}
              onChange={(e) => setBulkMessage(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowBulkMessage(false)}>
                Cancel
              </Button>
              <Button 
                onClick={sendBulkMessage} 
                disabled={!bulkMessage.trim() || sending}
                className="swipe-gradient text-white"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send to All
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Pipeline Dialog */}
      <Dialog open={showBulkPipeline} onOpenChange={setShowBulkPipeline}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {selectedCandidates.length} Candidates to Pipeline</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Select Job</label>
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a job..." />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map(job => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Pipeline Stage</label>
              <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="interviewing">Interviewing</SelectItem>
                  <SelectItem value="offered">Offered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowBulkPipeline(false)}>
                Cancel
              </Button>
              <Button 
                onClick={addToPipeline} 
                disabled={!selectedJob || sending}
                className="swipe-gradient text-white"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <GitBranch className="w-4 h-4 mr-2" />
                )}
                Add to Pipeline
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recruiter Signals Modal */}
      <Dialog open={!!selectedCandidateForSignals} onOpenChange={() => setSelectedCandidateForSignals(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Candidate Intelligence</DialogTitle>
          </DialogHeader>
          {selectedCandidateForSignals && (
            <RecruiterSignalPanel 
              candidate={selectedCandidateForSignals}
              readiness={readinessMap[selectedCandidateForSignals.id]}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
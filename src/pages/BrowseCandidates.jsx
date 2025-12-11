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
import { Search, Filter, MapPin, Briefcase, Star, X, Loader2, Heart, User } from 'lucide-react';
import FavoriteCandidateButton from '@/components/networking/FavoriteCandidateButton';

export default function BrowseCandidates() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  
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
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [companyData] = await base44.entities.Company.filter({ user_id: currentUser.id });
      setCompany(companyData);

      // Load all data in parallel for better performance
      const [allCandidates, favs] = await Promise.all([
        base44.entities.Candidate.list(),
        companyData ? base44.entities.FavoriteCandidate.filter({ company_id: companyData.id }) : Promise.resolve([])
      ]);

      setCandidates(allCandidates);
      setFavorites(favs);

      // Extract unique values for filters
      const uniqueIndustries = [...new Set(allCandidates.map(c => c.industry).filter(Boolean))];
      const uniqueLocations = [...new Set(allCandidates.map(c => c.location).filter(Boolean))];
      const uniqueSkills = [...new Set(allCandidates.flatMap(c => c.skills || []))];
      
      setIndustries(uniqueIndustries);
      setLocations(uniqueLocations);
      setAllSkills(uniqueSkills);

    } catch (error) {
      console.error('Failed to load data:', error);
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Candidates</h1>
          <p className="text-gray-600">Search and discover talented professionals</p>
        </div>

        {/* Search and Filter Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by name, title, skills, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>

              {/* Filter Button */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="h-12"
              >
                <Filter className="w-5 h-5 mr-2" />
                Filters
                {(experienceLevel !== 'all' || industryFilter !== 'all' || locationFilter !== 'all' || skillFilter || minExperience || maxExperience) && (
                  <Badge className="ml-2 bg-pink-500">Active</Badge>
                )}
              </Button>

              {/* Clear Filters */}
              {(searchQuery || experienceLevel !== 'all' || industryFilter !== 'all' || locationFilter !== 'all' || skillFilter || minExperience || maxExperience) && (
                <Button variant="ghost" onClick={clearFilters} className="h-12">
                  <X className="w-5 h-5 mr-2" />
                  Clear
                </Button>
              )}
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Experience Level</label>
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
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Industry</label>
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
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Location</label>
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
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Skills</label>
                  <Input
                    placeholder="Filter by skills..."
                    value={skillFilter}
                    onChange={(e) => setSkillFilter(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Min Years Experience</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minExperience}
                    onChange={(e) => setMinExperience(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Max Years Experience</label>
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
            <p className="text-gray-600">
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
              <Button onClick={bulkFavorite} variant="outline" className="border-pink-500 text-pink-500">
                <Heart className="w-4 h-4 mr-2" />
                Favorite Selected
              </Button>
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

        {/* Candidates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCandidates.map((candidate) => (
            <Card 
              key={candidate.id} 
              className={`hover:shadow-lg transition-all group relative ${selectedCandidates.includes(candidate.id) ? 'ring-2 ring-pink-500' : ''}`}
            >
              <CardContent className="pt-6">
                {/* Select Checkbox */}
                <div className="absolute top-4 left-4 z-10">
                  <input
                    type="checkbox"
                    checked={selectedCandidates.includes(candidate.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelectCandidate(candidate.id);
                    }}
                    className="w-5 h-5 rounded border-gray-300 text-pink-500 focus:ring-pink-500 cursor-pointer"
                  />
                </div>

                {/* Favorite Button */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFavoriteToggle(candidate.id);
                    }}
                    className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <Heart
                      className={`w-5 h-5 ${isFavorited(candidate.id) ? 'fill-pink-500 text-pink-500' : 'text-gray-400'}`}
                    />
                  </button>
                </div>

                <div className="cursor-pointer" onClick={() => navigate(createPageUrl('ViewCandidateProfile') + `?candidateId=${candidate.id}`)}>
                  {/* Profile Photo */}
                  <div className="flex justify-center mb-4">
                    {candidate.photo_url ? (
                      <img
                        src={candidate.photo_url}
                        alt={candidate.headline}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center border-4 border-white shadow-lg">
                        <User className="w-12 h-12 text-pink-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="text-center mb-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{candidate.headline || 'Professional'}</h3>
                    {candidate.industry && (
                      <p className="text-sm text-gray-600 mb-2">{candidate.industry}</p>
                    )}
                    {candidate.location && (
                      <div className="flex items-center justify-center gap-1 text-gray-500 text-sm">
                        <MapPin className="w-4 h-4" />
                        <span>{candidate.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Experience */}
                  {(candidate.experience_level || candidate.experience_years) && (
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {candidate.experience_level && <span className="capitalize">{candidate.experience_level}</span>}
                        {candidate.experience_level && candidate.experience_years && ' • '}
                        {candidate.experience_years && <span>{candidate.experience_years} years</span>}
                      </span>
                    </div>
                  )}

                  {/* Bio */}
                  {candidate.bio && (
                    <p className="text-sm text-gray-600 text-center mb-4 line-clamp-2">
                      {candidate.bio}
                    </p>
                  )}

                  {/* Skills */}
                  {candidate.skills && candidate.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {candidate.skills.slice(0, 5).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {candidate.skills.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{candidate.skills.length - 5} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* View Profile Button */}
                  <Button
                    className="w-full mt-4 swipe-gradient text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(createPageUrl('ViewCandidateProfile') + `?candidateId=${candidate.id}`);
                    }}
                  >
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredCandidates.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No candidates found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your filters or search query</p>
              <Button onClick={clearFilters} variant="outline">
                Clear All Filters
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
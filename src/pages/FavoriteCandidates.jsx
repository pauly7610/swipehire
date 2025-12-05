import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Star, Search, MapPin, Briefcase, MessageCircle, User, 
  Loader2, Trash2, Eye, Filter 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import QuickMessageDialog from '@/components/networking/QuickMessageDialog';

export default function FavoriteCandidates() {
  const [favorites, setFavorites] = useState([]);
  const [candidates, setCandidates] = useState({});
  const [users, setUsers] = useState({});
  const [jobs, setJobs] = useState([]);
  const [company, setCompany] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageCandidate, setMessageCandidate] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const [companyData] = await base44.entities.Company.filter({ user_id: user.id });
      if (!companyData) {
        setLoading(false);
        return;
      }
      setCompany(companyData);

      const [favoritesData, allCandidates, allUsers, allJobs] = await Promise.all([
        base44.entities.FavoriteCandidate.filter({ company_id: companyData.id }),
        base44.entities.Candidate.list(),
        base44.entities.User.list(),
        base44.entities.Job.filter({ company_id: companyData.id })
      ]);

      setFavorites(favoritesData);
      setJobs(allJobs);

      const candidateMap = {};
      allCandidates.forEach(c => { candidateMap[c.id] = c; });
      setCandidates(candidateMap);

      const userMap = {};
      allUsers.forEach(u => { userMap[u.id] = u; });
      setUsers(userMap);
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
    setLoading(false);
  };

  const removeFavorite = async (favoriteId) => {
    await base44.entities.FavoriteCandidate.delete(favoriteId);
    setFavorites(favorites.filter(f => f.id !== favoriteId));
  };

  const filteredFavorites = favorites.filter(fav => {
    const candidate = candidates[fav.candidate_id];
    const user = candidate ? users[candidate.user_id] : null;
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user?.full_name?.toLowerCase().includes(search) ||
      candidate?.headline?.toLowerCase().includes(search) ||
      candidate?.skills?.some(s => s.toLowerCase().includes(search))
    );
  });

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
        .swipe-gradient { background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%); }
      `}</style>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
              Favorite Candidates
            </h1>
            <p className="text-gray-500">{favorites.length} candidates shortlisted</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search by name, skills, or headline..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Favorites List */}
        {filteredFavorites.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <Star className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">
                {favorites.length === 0 
                  ? "No favorite candidates yet. Star candidates while swiping to add them here."
                  : "No candidates match your search."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredFavorites.map((fav) => {
              const candidate = candidates[fav.candidate_id];
              const user = candidate ? users[candidate.user_id] : null;
              const job = fav.job_id ? jobs.find(j => j.id === fav.job_id) : null;

              if (!candidate) return null;

              return (
                <Card key={fav.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {candidate.photo_url ? (
                        <img src={candidate.photo_url} alt="" className="w-16 h-16 rounded-xl object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                          <User className="w-8 h-8 text-pink-500" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{user?.full_name || 'Candidate'}</h3>
                            <p className="text-gray-600 text-sm">{candidate.headline}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setMessageCandidate({ candidate, user })}
                              className="text-pink-500 hover:bg-pink-50"
                            >
                              <MessageCircle className="w-5 h-5" />
                            </Button>
                            <Link to={createPageUrl('ViewCandidateProfile') + `?id=${candidate.id}`}>
                              <Button variant="ghost" size="icon">
                                <Eye className="w-5 h-5" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFavorite(fav.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          {candidate.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {candidate.location}
                            </span>
                          )}
                          {candidate.experience_years && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3" /> {candidate.experience_years} yrs
                            </span>
                          )}
                        </div>

                        {candidate.skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {candidate.skills.slice(0, 5).map(skill => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {job && (
                          <Badge className="mt-2 bg-blue-100 text-blue-700">
                            For: {job.title}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Message Dialog */}
      <QuickMessageDialog
        open={!!messageCandidate}
        onOpenChange={() => setMessageCandidate(null)}
        recipientId={messageCandidate?.user?.id}
        recipientName={messageCandidate?.user?.full_name}
        senderId={currentUser?.id}
        senderName={currentUser?.full_name}
      />
    </div>
  );
}
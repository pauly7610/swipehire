import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Heart, Search, MapPin, Briefcase, Building2, Users, 
  Loader2, ExternalLink, Bell, BellOff 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FollowedCompanies() {
  const [follows, setFollows] = useState([]);
  const [companies, setCompanies] = useState({});
  const [jobs, setJobs] = useState([]);
  const [candidate, setCandidate] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const [candidateData] = await base44.entities.Candidate.filter({ user_id: user.id });
      if (!candidateData) {
        setLoading(false);
        return;
      }
      setCandidate(candidateData);

      const [followsData, allCompanies, allJobs] = await Promise.all([
        base44.entities.CompanyFollow.filter({ candidate_id: candidateData.id }),
        base44.entities.Company.list(),
        base44.entities.Job.filter({ is_active: true })
      ]);

      setFollows(followsData);
      setJobs(allJobs);

      const companyMap = {};
      allCompanies.forEach(c => { companyMap[c.id] = c; });
      setCompanies(companyMap);
    } catch (err) {
      console.error('Error loading followed companies:', err);
    }
    setLoading(false);
  };

  const unfollowCompany = async (followId) => {
    await base44.entities.CompanyFollow.delete(followId);
    setFollows(follows.filter(f => f.id !== followId));
  };

  const filteredFollows = follows.filter(follow => {
    const company = companies[follow.company_id];
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      company?.name?.toLowerCase().includes(search) ||
      company?.industry?.toLowerCase().includes(search) ||
      company?.location?.toLowerCase().includes(search)
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
              <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
              Companies You Follow
            </h1>
            <p className="text-gray-500">{follows.length} companies followed</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search by company name, industry, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Companies List */}
        {filteredFollows.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <Heart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">
                {follows.length === 0 
                  ? "You're not following any companies yet. Follow companies to get updates on their jobs."
                  : "No companies match your search."}
              </p>
              <Link to={createPageUrl('BrowseJobs')}>
                <Button className="mt-4 swipe-gradient text-white">
                  Discover Companies
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredFollows.map((follow) => {
              const company = companies[follow.company_id];
              const companyJobs = jobs.filter(j => j.company_id === follow.company_id);

              if (!company) return null;

              return (
                <Card key={follow.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {company.logo_url ? (
                        <img src={company.logo_url} alt={company.name} className="w-14 h-14 rounded-xl object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                          <Building2 className="w-7 h-7 text-pink-500" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <Link to={createPageUrl('CompanyProfile') + `?companyId=${company.id}`}>
                            <h3 className="font-semibold text-gray-900 hover:text-pink-500 transition-colors">
                              {company.name}
                            </h3>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => unfollowCompany(follow.id)}
                            className="text-pink-500 hover:bg-pink-50"
                          >
                            <Heart className="w-4 h-4 fill-pink-500 mr-1" /> Following
                          </Button>
                        </div>

                        <p className="text-sm text-gray-600">{company.industry}</p>

                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          {company.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {company.location}
                            </span>
                          )}
                          {company.size && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" /> {company.size}
                            </span>
                          )}
                        </div>

                        {companyJobs.length > 0 && (
                          <Link to={createPageUrl('CompanyProfile') + `?companyId=${company.id}`}>
                            <Badge className="mt-2 bg-green-100 text-green-700 cursor-pointer hover:bg-green-200">
                              <Briefcase className="w-3 h-3 mr-1" />
                              {companyJobs.length} open position{companyJobs.length > 1 ? 's' : ''}
                            </Badge>
                          </Link>
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
    </div>
  );
}
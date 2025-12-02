import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, Briefcase, Building2, Clock, CheckCircle2, 
  XCircle, Calendar, Loader2, Inbox
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [companies, setCompanies] = useState({});
  const [jobs, setJobs] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const user = await base44.auth.me();
      const [candidate] = await base44.entities.Candidate.filter({ user_id: user.id });
      
      if (candidate) {
        const allMatches = await base44.entities.Match.filter({ candidate_id: candidate.id });
        setMatches(allMatches);

        const allCompanies = await base44.entities.Company.list();
        const companyMap = {};
        allCompanies.forEach(c => { companyMap[c.id] = c; });
        setCompanies(companyMap);

        const allJobs = await base44.entities.Job.list();
        const jobMap = {};
        allJobs.forEach(j => { jobMap[j.id] = j; });
        setJobs(jobMap);
      }
    } catch (error) {
      console.error('Failed to load matches:', error);
    }
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      matched: { color: 'bg-blue-100 text-blue-700', icon: MessageCircle, label: 'Matched' },
      interviewing: { color: 'bg-purple-100 text-purple-700', icon: Calendar, label: 'Interviewing' },
      offered: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Offer Received' },
      hired: { color: 'swipe-gradient text-white', icon: CheckCircle2, label: 'Hired!' },
      rejected: { color: 'bg-gray-100 text-gray-500', icon: XCircle, label: 'Not Selected' },
    };
    const config = statusConfig[status] || statusConfig.matched;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <config.icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredMatches = filter === 'all' 
    ? matches 
    : matches.filter(m => m.status === filter);

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
        .swipe-gradient-text {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Matches</h1>
        <p className="text-gray-500 mb-6">Connect with employers who are interested in you</p>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList className="w-full bg-white rounded-xl p-1 shadow-sm">
            <TabsTrigger value="all" className="flex-1 data-[state=active]:swipe-gradient data-[state=active]:text-white rounded-lg">
              All
            </TabsTrigger>
            <TabsTrigger value="matched" className="flex-1 data-[state=active]:swipe-gradient data-[state=active]:text-white rounded-lg">
              New
            </TabsTrigger>
            <TabsTrigger value="interviewing" className="flex-1 data-[state=active]:swipe-gradient data-[state=active]:text-white rounded-lg">
              Interviews
            </TabsTrigger>
            <TabsTrigger value="offered" className="flex-1 data-[state=active]:swipe-gradient data-[state=active]:text-white rounded-lg">
              Offers
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Matches List */}
        <div className="space-y-4">
          {filteredMatches.length === 0 ? (
            <Card className="p-12 text-center">
              <Inbox className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches yet</h3>
              <p className="text-gray-500">Keep swiping to find your perfect match!</p>
            </Card>
          ) : (
            filteredMatches.map((match, index) => {
              const company = companies[match.company_id];
              const job = jobs[match.job_id];

              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={createPageUrl('Chat') + `?matchId=${match.id}`}>
                    <Card className="p-4 hover:shadow-lg transition-all cursor-pointer border-0 shadow-sm">
                      <div className="flex items-start gap-4">
                        {/* Company Logo */}
                        <Link to={createPageUrl('CompanyProfile') + `?id=${company?.id}`} onClick={(e) => e.stopPropagation()}>
                          {company?.logo_url ? (
                            <img 
                              src={company.logo_url} 
                              alt={company.name}
                              className="w-14 h-14 rounded-xl object-cover hover:ring-2 hover:ring-pink-500 transition-all"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl swipe-gradient flex items-center justify-center hover:opacity-90 transition-opacity">
                              <Building2 className="w-7 h-7 text-white" />
                            </div>
                          )}
                        </Link>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-gray-900 truncate">{job?.title || 'Position'}</h3>
                              <Link 
                                to={createPageUrl('CompanyProfile') + `?id=${company?.id}`} 
                                onClick={(e) => e.stopPropagation()}
                                className="text-gray-600 text-sm hover:text-pink-600 transition-colors"
                              >
                                {company?.name || 'Company'}
                              </Link>
                            </div>
                            {getStatusBadge(match.status)}
                          </div>

                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                            {match.match_score && (
                              <span className="flex items-center gap-1">
                                <span className="font-semibold text-pink-500">{match.match_score}%</span> match
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(new Date(match.created_date), 'MMM d')}
                            </span>
                          </div>
                        </div>

                        {/* Chat indicator */}
                        <div className="flex items-center">
                          <MessageCircle className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
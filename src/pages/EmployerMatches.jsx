import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MessageCircle, User, Briefcase, Calendar, CheckCircle2, 
  XCircle, MoreVertical, Loader2, Inbox, Send, Video
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import InterviewScheduler from '@/components/interview/InterviewScheduler';
import { sendStatusChangeNotification } from '@/components/status/StatusChangeHandler';
import HiredCelebration from '@/components/status/HiredCelebration';

export default function EmployerMatches() {
  const [matches, setMatches] = useState([]);
  const [candidates, setCandidates] = useState({});
  const [users, setUsers] = useState({});
  const [jobs, setJobs] = useState({});
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [schedulingMatch, setSchedulingMatch] = useState(null);
  const [hiredCelebration, setHiredCelebration] = useState(null);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const user = await base44.auth.me();
      const [company] = await base44.entities.Company.filter({ user_id: user.id });

      if (company) {
        setCompany(company);
        const allMatches = await base44.entities.Match.filter({ company_id: company.id });
        setMatches(allMatches);

        const allCandidates = await base44.entities.Candidate.list();
        const candidateMap = {};
        allCandidates.forEach(c => { candidateMap[c.id] = c; });
        setCandidates(candidateMap);

        const allUsers = await base44.entities.User.list();
        const userMap = {};
        allUsers.forEach(u => { userMap[u.id] = u; });
        setUsers(userMap);

        const allJobs = await base44.entities.Job.filter({ company_id: company.id });
        const jobMap = {};
        allJobs.forEach(j => { jobMap[j.id] = j; });
        setJobs(jobMap);
      }
    } catch (error) {
      console.error('Failed to load matches:', error);
    }
    setLoading(false);
  };

  const updateMatchStatus = async (matchId, status) => {
    await base44.entities.Match.update(matchId, { status });
    setMatches(matches.map(m => m.id === matchId ? { ...m, status } : m));
    
    // Send automatic notification
    const match = matches.find(m => m.id === matchId);
    if (match) {
      const candidate = candidates[match.candidate_id];
      const job = jobs[match.job_id];
      if (candidate && job && company) {
        sendStatusChangeNotification(match, status, candidate, job, company);
        
        // Show hired celebration
        if (status === 'hired') {
          const candidateUser = users[candidate.user_id];
          setHiredCelebration({
            candidateName: candidateUser?.full_name,
            jobTitle: job.title,
            companyName: company.name
          });
        }
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      matched: { color: 'bg-blue-100 text-blue-700', label: 'New Match' },
      interviewing: { color: 'bg-purple-100 text-purple-700', label: 'Interviewing' },
      offered: { color: 'bg-amber-100 text-amber-700', label: 'Offer Sent' },
      hired: { color: 'swipe-gradient text-white', label: 'Hired!' },
      rejected: { color: 'bg-gray-100 text-gray-500', label: 'Rejected' },
    };
    const config = statusConfig[status] || statusConfig.matched;
    return <Badge className={config.color}>{config.label}</Badge>;
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
      `}</style>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Candidate Matches</h1>
        <p className="text-gray-500 mb-6">Manage your candidate pipeline</p>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList className="bg-white rounded-xl p-1 shadow-sm">
            <TabsTrigger value="all" className="data-[state=active]:swipe-gradient data-[state=active]:text-white rounded-lg">
              All ({matches.length})
            </TabsTrigger>
            <TabsTrigger value="matched" className="data-[state=active]:swipe-gradient data-[state=active]:text-white rounded-lg">
              New ({matches.filter(m => m.status === 'matched').length})
            </TabsTrigger>
            <TabsTrigger value="interviewing" className="data-[state=active]:swipe-gradient data-[state=active]:text-white rounded-lg">
              Interviewing ({matches.filter(m => m.status === 'interviewing').length})
            </TabsTrigger>
            <TabsTrigger value="offered" className="data-[state=active]:swipe-gradient data-[state=active]:text-white rounded-lg">
              Offered ({matches.filter(m => m.status === 'offered').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Matches List */}
        {filteredMatches.length === 0 ? (
          <Card className="p-12 text-center border-0 shadow-lg">
            <Inbox className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No matches yet</h3>
            <p className="text-gray-500 mb-6">Start swiping on candidates to find your perfect hire!</p>
            <Link to={createPageUrl('SwipeCandidates')}>
              <Button className="swipe-gradient text-white">Find Candidates</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredMatches.map((match, index) => {
              const candidate = candidates[match.candidate_id];
              const candidateUser = candidate ? users[candidate.user_id] : null;
              const job = jobs[match.job_id];

              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Candidate Photo */}
                        {candidate?.photo_url ? (
                          <img 
                            src={candidate.photo_url}
                            alt={candidateUser?.full_name}
                            className="w-16 h-16 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                            <User className="w-8 h-8 text-pink-400" />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {candidateUser?.full_name || 'Candidate'}
                              </h3>
                              <p className="text-gray-600">{candidate?.headline}</p>
                              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                <Briefcase className="w-4 h-4" />
                                <span>{job?.title || 'Position'}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {getStatusBadge(match.status)}
                              {match.match_score && (
                                <Badge variant="outline" className="text-pink-500 border-pink-200">
                                  {match.match_score}% match
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Skills */}
                          {candidate?.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {candidate.skills.slice(0, 4).map((skill) => (
                                <Badge key={skill} variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                            <Link to={createPageUrl('EmployerChat') + `?matchId=${match.id}`}>
                              <Button size="sm" className="swipe-gradient text-white">
                                <MessageCircle className="w-4 h-4 mr-2" /> Message
                              </Button>
                            </Link>
                            
                            {match.status === 'matched' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSchedulingMatch(match)}
                              >
                                <Calendar className="w-4 h-4 mr-2" /> Schedule Interview
                              </Button>
                            )}

                            {match.status === 'interviewing' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateMatchStatus(match.id, 'offered')}
                              >
                                <Send className="w-4 h-4 mr-2" /> Send Offer
                              </Button>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-5 h-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => updateMatchStatus(match.id, 'interviewing')}>
                                  <Video className="w-4 h-4 mr-2" /> Schedule Interview
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateMatchStatus(match.id, 'offered')}>
                                  <Send className="w-4 h-4 mr-2" /> Send Offer
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateMatchStatus(match.id, 'hired')} className="text-green-600">
                                  <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Hired
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateMatchStatus(match.id, 'rejected')} className="text-red-600">
                                  <XCircle className="w-4 h-4 mr-2" /> Reject
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

      {/* Interview Scheduler Dialog */}
      <Dialog open={!!schedulingMatch} onOpenChange={() => setSchedulingMatch(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
          </DialogHeader>
          {schedulingMatch && (
            <InterviewScheduler
              match={schedulingMatch}
              candidate={candidates[schedulingMatch.candidate_id]}
              job={jobs[schedulingMatch.job_id]}
              company={company}
              onScheduled={() => {
                setSchedulingMatch(null);
                loadMatches();
              }}
              onClose={() => setSchedulingMatch(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Hired Celebration */}
      <HiredCelebration
        isOpen={!!hiredCelebration}
        onClose={() => setHiredCelebration(null)}
        candidateName={hiredCelebration?.candidateName}
        jobTitle={hiredCelebration?.jobTitle}
        companyName={hiredCelebration?.companyName}
      />
    </div>
  );
}
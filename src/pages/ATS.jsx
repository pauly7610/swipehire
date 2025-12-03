import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, Briefcase, Search, Filter, ChevronRight, Calendar,
  MessageCircle, Video, FileText, Star, Clock, CheckCircle2,
  XCircle, ArrowUpCircle, Loader2, Mail, Phone, MapPin,
  MoreVertical, Eye, UserPlus, Trash2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const PIPELINE_STAGES = [
  { id: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-700' },
  { id: 'screening', label: 'Screening', color: 'bg-purple-100 text-purple-700' },
  { id: 'interviewing', label: 'Interviewing', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'offered', label: 'Offered', color: 'bg-green-100 text-green-700' },
  { id: 'hired', label: 'Hired', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' },
];

export default function ATS() {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [matches, setMatches] = useState([]);
  const [candidates, setCandidates] = useState({});
  const [users, setUsers] = useState({});
  const [selectedJob, setSelectedJob] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [viewMode, setViewMode] = useState('pipeline');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const [companyData] = await base44.entities.Company.filter({ user_id: user.id });
      setCompany(companyData);

      if (companyData) {
        const [companyJobs, allMatches, allCandidates, allUsers] = await Promise.all([
          base44.entities.Job.filter({ company_id: companyData.id }),
          base44.entities.Match.filter({ company_id: companyData.id }),
          base44.entities.Candidate.list(),
          base44.entities.User.list()
        ]);

        setJobs(companyJobs);
        setMatches(allMatches);

        const candidateMap = {};
        allCandidates.forEach(c => { candidateMap[c.id] = c; });
        setCandidates(candidateMap);

        const userMap = {};
        allUsers.forEach(u => { userMap[u.id] = u; });
        setUsers(userMap);
      }
    } catch (error) {
      console.error('Failed to load ATS data:', error);
    }
    setLoading(false);
  };

  const updateMatchStatus = async (matchId, newStatus) => {
    await base44.entities.Match.update(matchId, { status: newStatus });
    setMatches(matches.map(m => m.id === matchId ? { ...m, status: newStatus } : m));
    
    if (selectedCandidate?.id === matchId) {
      setSelectedCandidate({ ...selectedCandidate, status: newStatus });
    }
  };

  const addNote = async () => {
    if (!noteText.trim() || !selectedCandidate) return;
    
    const currentNotes = selectedCandidate.notes || '';
    const timestamp = format(new Date(), 'MMM d, yyyy h:mm a');
    const newNotes = `${currentNotes}\n\n[${timestamp}]\n${noteText}`.trim();
    
    await base44.entities.Match.update(selectedCandidate.id, { notes: newNotes });
    setSelectedCandidate({ ...selectedCandidate, notes: newNotes });
    setMatches(matches.map(m => m.id === selectedCandidate.id ? { ...m, notes: newNotes } : m));
    setNoteText('');
  };

  const getFilteredMatches = () => {
    let filtered = matches;
    
    if (selectedJob !== 'all') {
      filtered = filtered.filter(m => m.job_id === selectedJob);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(m => {
        const candidate = candidates[m.candidate_id];
        const user = candidate ? users[candidate.user_id] : null;
        const name = user?.full_name?.toLowerCase() || '';
        const skills = candidate?.skills?.join(' ').toLowerCase() || '';
        return name.includes(searchQuery.toLowerCase()) || skills.includes(searchQuery.toLowerCase());
      });
    }
    
    return filtered;
  };

  const getMatchesByStage = (stage) => {
    return getFilteredMatches().filter(m => {
      if (stage === 'applied') return m.status === 'matched';
      if (stage === 'screening') return m.status === 'screening';
      if (stage === 'interviewing') return m.status === 'interviewing';
      if (stage === 'offered') return m.status === 'offered';
      if (stage === 'hired') return m.status === 'hired';
      if (stage === 'rejected') return m.status === 'rejected';
      return false;
    });
  };

  const openCandidateDetails = (match) => {
    setSelectedCandidate(match);
    setShowCandidateModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  const filteredMatches = getFilteredMatches();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Applicant Tracking</h1>
            <p className="text-gray-500">{filteredMatches.length} candidates in pipeline</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {jobs.map(job => (
                  <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          {PIPELINE_STAGES.map(stage => (
            <Card key={stage.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-gray-900">{getMatchesByStage(stage.id).length}</p>
                <p className="text-sm text-gray-500">{stage.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View Toggle */}
        <Tabs value={viewMode} onValueChange={setViewMode} className="mb-6">
          <TabsList className="bg-white rounded-xl p-1 shadow-sm">
            <TabsTrigger value="pipeline" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white rounded-lg">
              Pipeline View
            </TabsTrigger>
            <TabsTrigger value="list" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white rounded-lg">
              List View
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Pipeline View */}
        {viewMode === 'pipeline' && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {PIPELINE_STAGES.filter(s => s.id !== 'rejected').map(stage => (
              <div key={stage.id} className="flex-shrink-0 w-72">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                  <Badge className={stage.color}>{getMatchesByStage(stage.id).length}</Badge>
                </div>
                
                <div className="space-y-3 min-h-[200px] bg-gray-100 rounded-xl p-3">
                  <AnimatePresence>
                    {getMatchesByStage(stage.id).map((match) => {
                      const candidate = candidates[match.candidate_id];
                      const user = candidate ? users[candidate.user_id] : null;
                      const job = jobs.find(j => j.id === match.job_id);
                      
                      return (
                        <motion.div
                          key={match.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <Card 
                            className="cursor-pointer hover:shadow-md transition-shadow border-0"
                            onClick={() => openCandidateDetails(match)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center gap-3">
                                {candidate?.photo_url ? (
                                  <img src={candidate.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-white font-bold">
                                    {user?.full_name?.charAt(0) || '?'}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate">{user?.full_name || 'Unknown'}</p>
                                  <p className="text-xs text-gray-500 truncate">{job?.title}</p>
                                </div>
                              </div>
                              
                              {match.match_score && (
                                <div className="mt-2 flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-pink-500 to-orange-500 rounded-full"
                                      style={{ width: `${match.match_score}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium text-gray-600">{match.match_score}%</span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                {format(new Date(match.created_date), 'MMM d')}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  
                  {getMatchesByStage(stage.id).length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No candidates
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-600">Candidate</th>
                    <th className="text-left p-4 font-medium text-gray-600">Job</th>
                    <th className="text-left p-4 font-medium text-gray-600">Stage</th>
                    <th className="text-left p-4 font-medium text-gray-600">Match</th>
                    <th className="text-left p-4 font-medium text-gray-600">Applied</th>
                    <th className="text-left p-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatches.map((match) => {
                    const candidate = candidates[match.candidate_id];
                    const user = candidate ? users[candidate.user_id] : null;
                    const job = jobs.find(j => j.id === match.job_id);
                    const stage = PIPELINE_STAGES.find(s => 
                      (s.id === 'applied' && match.status === 'matched') || s.id === match.status
                    );
                    
                    return (
                      <tr key={match.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => openCandidateDetails(match)}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {candidate?.photo_url ? (
                              <img src={candidate.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-white font-bold">
                                {user?.full_name?.charAt(0) || '?'}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{user?.full_name || 'Unknown'}</p>
                              <p className="text-sm text-gray-500">{candidate?.headline}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-gray-600">{job?.title}</td>
                        <td className="p-4">
                          <Badge className={stage?.color}>{stage?.label}</Badge>
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-pink-600">{match.match_score || '-'}%</span>
                        </td>
                        <td className="p-4 text-gray-500">{format(new Date(match.created_date), 'MMM d, yyyy')}</td>
                        <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openCandidateDetails(match); }}>
                                <Eye className="w-4 h-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateMatchStatus(match.id, 'screening'); }}>
                                <ArrowUpCircle className="w-4 h-4 mr-2" /> Move to Screening
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateMatchStatus(match.id, 'rejected'); }} className="text-red-600">
                                <XCircle className="w-4 h-4 mr-2" /> Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {filteredMatches.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No candidates found</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Candidate Details Modal */}
      <Dialog open={showCandidateModal} onOpenChange={setShowCandidateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedCandidate && (() => {
            const candidate = candidates[selectedCandidate.candidate_id];
            const user = candidate ? users[candidate.user_id] : null;
            const job = jobs.find(j => j.id === selectedCandidate.job_id);
            const stage = PIPELINE_STAGES.find(s => 
              (s.id === 'applied' && selectedCandidate.status === 'matched') || s.id === selectedCandidate.status
            );
            
            return (
              <>
                <DialogHeader>
                  <DialogTitle>Candidate Details</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Profile Header */}
                  <div className="flex items-start gap-4">
                    {candidate?.photo_url ? (
                      <img src={candidate.photo_url} alt="" className="w-20 h-20 rounded-xl object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-white text-2xl font-bold">
                        {user?.full_name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900">{user?.full_name}</h2>
                      <p className="text-gray-600">{candidate?.headline}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        {candidate?.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" /> {candidate.location}
                          </span>
                        )}
                        {user?.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" /> {user.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge className={stage?.color}>{stage?.label}</Badge>
                  </div>

                  {/* Job Applied For */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500 mb-1">Applied for</p>
                    <p className="font-semibold text-gray-900">{job?.title}</p>
                    {selectedCandidate.match_score && (
                      <div className="flex items-center gap-2 mt-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium">{selectedCandidate.match_score}% Match</span>
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  {candidate?.skills?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills.map((skill, i) => (
                          <Badge key={i} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {candidate?.experience?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Experience</h3>
                      <div className="space-y-3">
                        {candidate.experience.slice(0, 2).map((exp, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Briefcase className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{exp.title}</p>
                              <p className="text-sm text-gray-500">{exp.company}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                    {selectedCandidate.notes && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3 whitespace-pre-wrap text-sm text-gray-600">
                        {selectedCandidate.notes}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Add a note..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        rows={2}
                      />
                      <Button onClick={addNote} className="swipe-gradient text-white">Add</Button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Select 
                      value={selectedCandidate.status === 'matched' ? 'applied' : selectedCandidate.status} 
                      onValueChange={(v) => updateMatchStatus(selectedCandidate.id, v === 'applied' ? 'matched' : v)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Move to..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PIPELINE_STAGES.map(stage => (
                          <SelectItem key={stage.id} value={stage.id}>{stage.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Link to={createPageUrl('EmployerChat') + `?matchId=${selectedCandidate.id}`}>
                      <Button variant="outline">
                        <MessageCircle className="w-4 h-4 mr-2" /> Message
                      </Button>
                    </Link>
                    
                    <Link to={createPageUrl('ViewCandidateProfile') + `?id=${candidate?.id}`}>
                      <Button variant="outline">
                        <Eye className="w-4 h-4 mr-2" /> Full Profile
                      </Button>
                    </Link>
                    
                    <Button 
                      variant="outline" 
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => updateMatchStatus(selectedCandidate.id, 'rejected')}
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
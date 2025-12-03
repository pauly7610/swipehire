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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  Users, Briefcase, Search, Filter, ChevronRight, Calendar,
  MessageCircle, Video, FileText, Star, Clock, CheckCircle2,
  XCircle, ArrowUpCircle, Loader2, Mail, Phone, MapPin,
  MoreVertical, Eye, UserPlus, Trash2, GripVertical, AlertTriangle,
  Download, ExternalLink
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import SendInterviewSlots from '@/components/interview/SendInterviewSlots';

const PIPELINE_STAGES = [
  { id: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-700', status: 'matched' },
  { id: 'screening', label: 'Screening', color: 'bg-purple-100 text-purple-700', status: 'screening' },
  { id: 'interviewing', label: 'Interviewing', color: 'bg-yellow-100 text-yellow-700', status: 'interviewing' },
  { id: 'offered', label: 'Offered', color: 'bg-green-100 text-green-700', status: 'offered' },
  { id: 'hired', label: 'Hired', color: 'bg-emerald-100 text-emerald-700', status: 'hired' },
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
  const [showConfirmMove, setShowConfirmMove] = useState(false);
  const [pendingMove, setPendingMove] = useState(null);
  const [selectedMatches, setSelectedMatches] = useState(new Set());
  const [showBulkMoveDialog, setShowBulkMoveDialog] = useState(false);
  const [bulkMoveTarget, setBulkMoveTarget] = useState('');
  const [showInterviewScheduler, setShowInterviewScheduler] = useState(false);
  const [schedulingMatch, setSchedulingMatch] = useState(null);

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

  const getStageFromStatus = (status) => {
    if (status === 'matched') return 'applied';
    return status;
  };

  const getStatusFromStage = (stageId) => {
    if (stageId === 'applied') return 'matched';
    return stageId;
  };

  const confirmMoveCandidate = (matchId, fromStage, toStage, candidateName) => {
    setPendingMove({ matchId, fromStage, toStage, candidateName });
    setShowConfirmMove(true);
  };

  const executeMoveCandidate = async () => {
    if (!pendingMove) return;
    
    const { matchId, toStage } = pendingMove;
    const newStatus = getStatusFromStage(toStage);
    
    // If moving to interviewing stage, open the scheduler instead
    if (toStage === 'interviewing') {
      const match = matches.find(m => m.id === matchId);
      setSchedulingMatch(match);
      setShowConfirmMove(false);
      setPendingMove(null);
      setShowInterviewScheduler(true);
      return;
    }
    
    await base44.entities.Match.update(matchId, { status: newStatus });
    
    // Send notification to candidate
    const match = matches.find(m => m.id === matchId);
    const candidate = candidates[match?.candidate_id];
    const job = jobs.find(j => j.id === match?.job_id);
    
    if (candidate && job) {
      const stageLabel = PIPELINE_STAGES.find(s => s.id === toStage)?.label || toStage;
      await base44.entities.Notification.create({
        user_id: candidate.user_id,
        type: 'status_change',
        title: '📋 Application Update',
        message: `Your application for ${job.title} has moved to ${stageLabel}`,
        job_id: job.id,
        match_id: matchId,
        navigate_to: 'ApplicationTracker'
      });
    }
    
    setMatches(matches.map(m => m.id === matchId ? { ...m, status: newStatus } : m));
    setShowConfirmMove(false);
    setPendingMove(null);
  };

  const handleInterviewSlotsSent = async () => {
    if (!schedulingMatch) return;
    
    // Update match status to interviewing
    await base44.entities.Match.update(schedulingMatch.id, { status: 'interviewing' });
    
    setMatches(matches.map(m => m.id === schedulingMatch.id ? { ...m, status: 'interviewing' } : m));
    setShowInterviewScheduler(false);
    setSchedulingMatch(null);
  };

  const handleBulkMove = async () => {
    if (!bulkMoveTarget || selectedMatches.size === 0) return;
    
    const newStatus = getStatusFromStage(bulkMoveTarget);
    const matchIds = Array.from(selectedMatches);
    
    for (const matchId of matchIds) {
      await base44.entities.Match.update(matchId, { status: newStatus });
      
      const match = matches.find(m => m.id === matchId);
      const candidate = candidates[match?.candidate_id];
      const job = jobs.find(j => j.id === match?.job_id);
      
      if (candidate && job) {
        const stageLabel = PIPELINE_STAGES.find(s => s.id === bulkMoveTarget)?.label || bulkMoveTarget;
        await base44.entities.Notification.create({
          user_id: candidate.user_id,
          type: 'status_change',
          title: '📋 Application Update',
          message: `Your application for ${job.title} has moved to ${stageLabel}`,
          job_id: job.id,
          match_id: matchId,
          navigate_to: 'ApplicationTracker'
        });
      }
    }
    
    setMatches(matches.map(m => 
      selectedMatches.has(m.id) ? { ...m, status: newStatus } : m
    ));
    setSelectedMatches(new Set());
    setShowBulkMoveDialog(false);
    setBulkMoveTarget('');
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    const { draggableId, source, destination } = result;
    
    if (source.droppableId === destination.droppableId) return;
    
    const match = matches.find(m => m.id === draggableId);
    const candidate = candidates[match?.candidate_id];
    const user = candidate ? users[candidate.user_id] : null;
    
    confirmMoveCandidate(
      draggableId, 
      source.droppableId, 
      destination.droppableId,
      user?.full_name || 'Candidate'
    );
  };

  const toggleSelectMatch = (matchId) => {
    const newSet = new Set(selectedMatches);
    if (newSet.has(matchId)) {
      newSet.delete(matchId);
    } else {
      newSet.add(matchId);
    }
    setSelectedMatches(newSet);
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

  // Boolean search parser
  const parseSearchQuery = (query) => {
    const terms = { and: [], or: [], not: [] };
    const parts = query.split(/\s+/);
    let currentOperator = 'and';
    
    parts.forEach(part => {
      const upperPart = part.toUpperCase();
      if (upperPart === 'AND') {
        currentOperator = 'and';
      } else if (upperPart === 'OR') {
        currentOperator = 'or';
      } else if (upperPart === 'NOT' || part.startsWith('-')) {
        currentOperator = 'not';
        if (part.startsWith('-') && part.length > 1) {
          terms.not.push(part.substring(1).toLowerCase());
        }
      } else if (part.trim()) {
        terms[currentOperator].push(part.toLowerCase());
        if (currentOperator !== 'and') currentOperator = 'and';
      }
    });
    
    return terms;
  };

  const matchesSearchTerms = (match, terms) => {
    const candidate = candidates[match.candidate_id];
    const user = candidate ? users[candidate.user_id] : null;
    const job = jobs.find(j => j.id === match.job_id);
    
    const searchableText = [
      user?.full_name || '',
      user?.email || '',
      candidate?.headline || '',
      candidate?.location || '',
      ...(candidate?.skills || []),
      job?.title || ''
    ].join(' ').toLowerCase();
    
    // Check NOT terms first (must not contain)
    for (const term of terms.not) {
      if (searchableText.includes(term)) return false;
    }
    
    // Check AND terms (must contain all)
    for (const term of terms.and) {
      if (!searchableText.includes(term)) return false;
    }
    
    // Check OR terms (must contain at least one, if any OR terms exist)
    if (terms.or.length > 0) {
      const hasAnyOr = terms.or.some(term => searchableText.includes(term));
      if (!hasAnyOr) return false;
    }
    
    return true;
  };

  const getFilteredMatches = () => {
    let filtered = matches;
    
    if (selectedJob !== 'all') {
      filtered = filtered.filter(m => m.job_id === selectedJob);
    }
    
    if (searchQuery.trim()) {
      const terms = parseSearchQuery(searchQuery);
      filtered = filtered.filter(m => matchesSearchTerms(m, terms));
    }
    
    return filtered;
  };

  const getMatchesByStage = (stageId) => {
    const stage = PIPELINE_STAGES.find(s => s.id === stageId);
    return getFilteredMatches().filter(m => {
      const currentStage = getStageFromStatus(m.status);
      return currentStage === stageId;
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
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Boolean search: React AND Senior NOT Junior"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-80"
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

            {selectedMatches.size > 0 && (
              <Button onClick={() => setShowBulkMoveDialog(true)} className="swipe-gradient text-white">
                Move {selectedMatches.size} Selected
              </Button>
            )}
          </div>
        </div>

        {/* Search Help */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <strong>Boolean Search:</strong> Use AND, OR, NOT operators. Example: "React AND TypeScript NOT Junior" or "-intern" to exclude
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
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

        {/* Pipeline View with Drag & Drop */}
        {viewMode === 'pipeline' && (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {PIPELINE_STAGES.map(stage => (
                <div key={stage.id} className="flex-shrink-0 w-72">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                    <Badge className={stage.color}>{getMatchesByStage(stage.id).length}</Badge>
                  </div>
                  
                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-3 min-h-[200px] rounded-xl p-3 transition-colors ${
                          snapshot.isDraggingOver ? 'bg-pink-50 border-2 border-pink-200' : 'bg-gray-100'
                        }`}
                      >
                        {getMatchesByStage(stage.id).map((match, index) => {
                          const candidate = candidates[match.candidate_id];
                          const user = candidate ? users[candidate.user_id] : null;
                          const job = jobs.find(j => j.id === match.job_id);
                          
                          return (
                            <Draggable key={match.id} draggableId={match.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`${snapshot.isDragging ? 'shadow-xl rotate-2' : ''}`}
                                >
                                  <Card 
                                    className={`cursor-pointer hover:shadow-md transition-all border-0 ${
                                      selectedMatches.has(match.id) ? 'ring-2 ring-pink-500' : ''
                                    }`}
                                  >
                                    <CardContent className="p-3">
                                      <div className="flex items-start gap-2">
                                        <div {...provided.dragHandleProps} className="pt-1 cursor-grab">
                                          <GripVertical className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <input
                                          type="checkbox"
                                          checked={selectedMatches.has(match.id)}
                                          onChange={() => toggleSelectMatch(match.id)}
                                          className="mt-1 rounded border-gray-300"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <div className="flex-1" onClick={() => openCandidateDetails(match)}>
                                          <div className="flex items-center gap-2">
                                            {candidate?.photo_url ? (
                                              <img src={candidate.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-white font-bold text-xs">
                                                {user?.full_name?.charAt(0) || '?'}
                                              </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <p className="font-medium text-gray-900 text-sm truncate">{user?.full_name || 'Unknown'}</p>
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
                                            {candidate?.resume_url && (
                                              <Badge variant="outline" className="text-xs ml-auto">
                                                <FileText className="w-3 h-3 mr-1" /> Resume
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                        
                        {getMatchesByStage(stage.id).length === 0 && (
                          <div className="text-center py-8 text-gray-400 text-sm">
                            Drop candidates here
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="w-10 p-4">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMatches(new Set(filteredMatches.map(m => m.id)));
                          } else {
                            setSelectedMatches(new Set());
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="text-left p-4 font-medium text-gray-600">Candidate</th>
                    <th className="text-left p-4 font-medium text-gray-600">Job</th>
                    <th className="text-left p-4 font-medium text-gray-600">Stage</th>
                    <th className="text-left p-4 font-medium text-gray-600">Match</th>
                    <th className="text-left p-4 font-medium text-gray-600">Resume</th>
                    <th className="text-left p-4 font-medium text-gray-600">Applied</th>
                    <th className="text-left p-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatches.map((match) => {
                    const candidate = candidates[match.candidate_id];
                    const user = candidate ? users[candidate.user_id] : null;
                    const job = jobs.find(j => j.id === match.job_id);
                    const currentStage = getStageFromStatus(match.status);
                    const stage = PIPELINE_STAGES.find(s => s.id === currentStage);
                    
                    return (
                      <tr key={match.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedMatches.has(match.id)}
                            onChange={() => toggleSelectMatch(match.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="p-4 cursor-pointer" onClick={() => openCandidateDetails(match)}>
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
                        <td className="p-4">
                          {candidate?.resume_url ? (
                            <a 
                              href={candidate.resume_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-pink-600 hover:text-pink-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FileText className="w-4 h-4" />
                              <span className="text-sm">View</span>
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
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
                              {candidate?.resume_url && (
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(candidate.resume_url, '_blank'); }}>
                                  <FileText className="w-4 h-4 mr-2" /> View Resume
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={(e) => { 
                                e.stopPropagation(); 
                                confirmMoveCandidate(match.id, currentStage, 'screening', user?.full_name); 
                              }}>
                                <ArrowUpCircle className="w-4 h-4 mr-2" /> Move to Screening
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { 
                                e.stopPropagation(); 
                                confirmMoveCandidate(match.id, currentStage, 'rejected', user?.full_name); 
                              }} className="text-red-600">
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

      {/* Confirm Move Dialog */}
      <AlertDialog open={showConfirmMove} onOpenChange={setShowConfirmMove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirm Status Change
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move <strong>{pendingMove?.candidateName}</strong> from{' '}
              <Badge className="mx-1">{PIPELINE_STAGES.find(s => s.id === pendingMove?.fromStage)?.label}</Badge>
              to{' '}
              <Badge className="mx-1">{PIPELINE_STAGES.find(s => s.id === pendingMove?.toStage)?.label}</Badge>?
              <br /><br />
              The candidate will receive an instant notification about this change.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingMove(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeMoveCandidate} className="swipe-gradient text-white">
              Confirm Move
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Move Dialog */}
      <Dialog open={showBulkMoveDialog} onOpenChange={setShowBulkMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move {selectedMatches.size} Candidates</DialogTitle>
            <DialogDescription>
              Select a stage to move all selected candidates. They will all receive notifications.
            </DialogDescription>
          </DialogHeader>
          <Select value={bulkMoveTarget} onValueChange={setBulkMoveTarget}>
            <SelectTrigger>
              <SelectValue placeholder="Select destination stage" />
            </SelectTrigger>
            <SelectContent>
              {PIPELINE_STAGES.map(stage => (
                <SelectItem key={stage.id} value={stage.id}>{stage.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkMoveDialog(false)}>Cancel</Button>
            <Button onClick={handleBulkMove} disabled={!bulkMoveTarget} className="swipe-gradient text-white">
              Move All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Interview Scheduler */}
      {schedulingMatch && (
        <SendInterviewSlots
          open={showInterviewScheduler}
          onOpenChange={(open) => {
            setShowInterviewScheduler(open);
            if (!open) setSchedulingMatch(null);
          }}
          match={schedulingMatch}
          candidate={candidates[schedulingMatch.candidate_id]}
          job={jobs.find(j => j.id === schedulingMatch.job_id)}
          company={company}
          onSent={handleInterviewSlotsSent}
        />
      )}

      {/* Candidate Details Modal */}
      <Dialog open={showCandidateModal} onOpenChange={setShowCandidateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedCandidate && (() => {
            const candidate = candidates[selectedCandidate.candidate_id];
            const user = candidate ? users[candidate.user_id] : null;
            const job = jobs.find(j => j.id === selectedCandidate.job_id);
            const currentStage = getStageFromStatus(selectedCandidate.status);
            const stage = PIPELINE_STAGES.find(s => s.id === currentStage);
            
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

                  {/* Resume Section */}
                  {candidate?.resume_url && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-blue-900">Resume Available</span>
                        </div>
                        <div className="flex gap-2">
                          <a 
                            href={candidate.resume_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                          >
                            <Eye className="w-4 h-4" /> View
                          </a>
                          <a 
                            href={candidate.resume_url} 
                            download
                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-blue-300 text-blue-600 rounded-lg text-sm hover:bg-blue-50"
                          >
                            <Download className="w-4 h-4" /> Download
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

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
                        {candidate.experience.slice(0, 3).map((exp, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Briefcase className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{exp.title}</p>
                              <p className="text-sm text-gray-500">{exp.company}</p>
                              <p className="text-xs text-gray-400">{exp.start_date} - {exp.end_date || 'Present'}</p>
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
                      <div className="bg-gray-50 rounded-lg p-3 mb-3 whitespace-pre-wrap text-sm text-gray-600 max-h-40 overflow-y-auto">
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
                      value={currentStage} 
                      onValueChange={(v) => confirmMoveCandidate(selectedCandidate.id, currentStage, v, user?.full_name)}
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
                      onClick={() => confirmMoveCandidate(selectedCandidate.id, currentStage, 'rejected', user?.full_name)}
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
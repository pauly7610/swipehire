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
  Download, ExternalLink, Trophy, Tag, Send, History, Activity,
  Plus, X, Edit2, Copy
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import SendInterviewSlots from '@/components/interview/SendInterviewSlots';
import ResumeAnalysis from '@/components/ats/ResumeAnalysis';
import ResumeCompare from '@/components/ats/ResumeCompare';
import DetailedMatchInsights from '@/components/matching/DetailedMatchInsights';
import MatchFeedbackForm from '@/components/matching/MatchFeedbackForm';

const PIPELINE_STAGES = [
  { id: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-700', status: 'matched' },
  { id: 'screening', label: 'Screening', color: 'bg-purple-100 text-purple-700', status: 'screening' },
  { id: 'interviewing', label: 'Interviewing', color: 'bg-yellow-100 text-yellow-700', status: 'interviewing' },
  { id: 'offered', label: 'Offered', color: 'bg-green-100 text-green-700', status: 'offered' },
  { id: 'hired', label: 'Hired', color: 'bg-emerald-100 text-emerald-700', status: 'hired' },
];

const CANDIDATE_TAGS = [
  { id: 'hot', label: 'Hot Lead', color: 'bg-red-100 text-red-700' },
  { id: 'qualified', label: 'Qualified', color: 'bg-green-100 text-green-700' },
  { id: 'follow-up', label: 'Follow Up', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'referred', label: 'Referred', color: 'bg-blue-100 text-blue-700' },
  { id: 'passive', label: 'Passive', color: 'bg-gray-100 text-gray-700' },
];

const EMAIL_TEMPLATES = [
  { id: 'intro', name: 'Introduction', subject: 'Exciting Opportunity at {company}', body: 'Hi {name},\n\nI came across your profile and was impressed by your experience in {skills}. We have an exciting opportunity at {company} that I think would be a great fit.\n\nWould you be open to a quick call this week?\n\nBest,\n{recruiter}' },
  { id: 'follow-up', name: 'Follow Up', subject: 'Following up - {job} at {company}', body: 'Hi {name},\n\nI wanted to follow up on our conversation about the {job} role at {company}.\n\nDo you have any questions I can help answer?\n\nBest,\n{recruiter}' },
  { id: 'interview', name: 'Interview Invite', subject: 'Interview Invitation - {job} at {company}', body: 'Hi {name},\n\nGreat news! We would like to invite you for an interview for the {job} position.\n\nPlease let me know your availability this week.\n\nBest,\n{recruiter}' },
  { id: 'rejection', name: 'Rejection', subject: 'Update on your application - {company}', body: 'Hi {name},\n\nThank you for your interest in the {job} role at {company}. After careful consideration, we have decided to move forward with other candidates.\n\nWe appreciate your time and wish you the best in your job search.\n\nBest,\n{recruiter}' },
];

export default function ATS() {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [matches, setMatches] = useState([]);
  const [candidates, setCandidates] = useState({});
  const [users, setUsers] = useState({});
  const [allCandidatesList, setAllCandidatesList] = useState([]);
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
  const [searchMode, setSearchMode] = useState('pipeline'); // 'pipeline' or 'all'
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackMatch, setFeedbackMatch] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailCandidate, setEmailCandidate] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [candidateTags, setCandidateTags] = useState({});
  const [activities, setActivities] = useState({});
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [applications, setApplications] = useState([]);
  const [showMassMessageDialog, setShowMassMessageDialog] = useState(false);
  const [massEmailSubject, setMassEmailSubject] = useState('');
  const [massEmailBody, setMassEmailBody] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      const [companyData] = await base44.entities.Company.filter({ user_id: user.id });
      setCompany(companyData);

      if (companyData) {
        const [companyJobs, allMatches, allCandidates, allUsers, applications] = await Promise.all([
          base44.entities.Job.filter({ company_id: companyData.id }),
          base44.entities.Match.filter({ company_id: companyData.id }),
          base44.entities.Candidate.list(),
          base44.entities.User.list(),
          base44.entities.Application.filter({ company_id: companyData.id })
        ]);

        setJobs(companyJobs);
        setMatches(allMatches);
        setApplications(applications);

        const candidateMap = {};
        allCandidates.forEach(c => { candidateMap[c.id] = c; });
        setCandidates(candidateMap);
        setAllCandidatesList(allCandidates);

        const userMap = {};
        allUsers.forEach(u => { userMap[u.id] = u; });
        setUsers(userMap);

        // Load tags and activities from match notes (stored as JSON)
        const tagsMap = {};
        const activitiesMap = {};
        allMatches.forEach(m => {
          if (m.notes) {
            try {
              const data = JSON.parse(m.notes);
              if (data.tags) tagsMap[m.id] = data.tags;
              if (data.activities) activitiesMap[m.id] = data.activities;
            } catch {
              // Notes is plain text, ignore
            }
          }
        });
        setCandidateTags(tagsMap);
        setActivities(activitiesMap);
      }
    } catch (error) {
      console.error('Failed to load ATS data:', error);
    }
    setLoading(false);
  };

  const addTag = async (matchId, tagId) => {
    const currentTags = candidateTags[matchId] || [];
    if (currentTags.includes(tagId)) return;
    
    const newTags = [...currentTags, tagId];
    setCandidateTags({ ...candidateTags, [matchId]: newTags });
    
    await saveMatchData(matchId, { tags: newTags });
    await logActivity(matchId, 'tag_added', `Added tag: ${CANDIDATE_TAGS.find(t => t.id === tagId)?.label}`);
  };

  const removeTag = async (matchId, tagId) => {
    const currentTags = candidateTags[matchId] || [];
    const newTags = currentTags.filter(t => t !== tagId);
    setCandidateTags({ ...candidateTags, [matchId]: newTags });
    
    await saveMatchData(matchId, { tags: newTags });
  };

  const logActivity = async (matchId, type, description) => {
    const currentActivities = activities[matchId] || [];
    const newActivity = {
      type,
      description,
      timestamp: new Date().toISOString(),
      user: currentUser?.full_name || 'System'
    };
    const newActivities = [newActivity, ...currentActivities].slice(0, 50);
    setActivities({ ...activities, [matchId]: newActivities });
    
    await saveMatchData(matchId, { activities: newActivities });
  };

  const saveMatchData = async (matchId, newData) => {
    const match = matches.find(m => m.id === matchId);
    let existingData = {};
    
    try {
      if (match?.notes) {
        existingData = JSON.parse(match.notes);
      }
    } catch {
      existingData = { plainNotes: match?.notes || '' };
    }
    
    const updatedData = { ...existingData, ...newData };
    await base44.entities.Match.update(matchId, { notes: JSON.stringify(updatedData) });
  };

  const openEmailDialog = (match) => {
    const candidate = candidates[match.candidate_id];
    const user = candidate ? users[candidate.user_id] : null;
    setEmailCandidate({ match, candidate, user });
    setSelectedTemplate(null);
    setEmailSubject('');
    setEmailBody('');
    setShowEmailDialog(true);
  };

  const applyEmailTemplate = (template) => {
    if (!emailCandidate) return;
    
    const { candidate, user, match } = emailCandidate;
    const job = jobs.find(j => j.id === match.job_id);
    
    const replacements = {
      '{name}': user?.full_name?.split(' ')[0] || 'there',
      '{company}': company?.name || 'Our Company',
      '{job}': job?.title || 'the position',
      '{skills}': candidate?.skills?.slice(0, 3).join(', ') || 'your field',
      '{recruiter}': currentUser?.recruiter_name || currentUser?.full_name || 'The Team'
    };
    
    let subject = template.subject;
    let body = template.body;
    
    Object.entries(replacements).forEach(([key, value]) => {
      subject = subject.replace(new RegExp(key, 'g'), value);
      body = body.replace(new RegExp(key, 'g'), value);
    });
    
    setSelectedTemplate(template);
    setEmailSubject(subject);
    setEmailBody(body);
  };

  const sendEmail = async () => {
    if (!emailCandidate || !emailSubject || !emailBody) return;
    
    const { user, match } = emailCandidate;
    
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: emailSubject,
      body: emailBody
    });
    
    await logActivity(match.id, 'email_sent', `Sent email: ${emailSubject}`);
    
    setShowEmailDialog(false);
    setEmailCandidate(null);
  };

  const sendMassEmail = async () => {
    if (!massEmailSubject || !massEmailBody || selectedMatches.size === 0) return;
    
    const matchIds = Array.from(selectedMatches);
    
    for (const matchId of matchIds) {
      const match = matches.find(m => m.id === matchId);
      const candidate = candidates[match?.candidate_id];
      const user = candidate ? users[candidate.user_id] : null;
      const job = jobs.find(j => j.id === match?.job_id);
      
      if (user) {
        const replacements = {
          '{name}': user.full_name?.split(' ')[0] || 'there',
          '{company}': company?.name || 'Our Company',
          '{job}': job?.title || 'the position',
          '{skills}': candidate?.skills?.slice(0, 3).join(', ') || 'your field',
          '{recruiter}': currentUser?.recruiter_name || currentUser?.full_name || 'The Team'
        };
        
        let subject = massEmailSubject;
        let body = massEmailBody;
        
        Object.entries(replacements).forEach(([key, value]) => {
          subject = subject.replace(new RegExp(key, 'g'), value);
          body = body.replace(new RegExp(key, 'g'), value);
        });
        
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: subject,
          body: body
        });
        
        await logActivity(matchId, 'email_sent', `Sent mass email: ${subject}`);
      }
    }
    
    setShowMassMessageDialog(false);
    setMassEmailSubject('');
    setMassEmailBody('');
    setSelectedMatches(new Set());
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

  const handleQuickReject = async (match) => {
    const candidate = candidates[match.candidate_id];
    const user = candidate ? users[candidate.user_id] : null;
    const job = jobs.find(j => j.id === match.job_id);
    
    if (!user || !job) return;
    
    // Update match status
    await base44.entities.Match.update(match.id, { status: 'rejected' });
    
    // Send rejection email
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: `Update on your application - ${company.name}`,
      body: `Hi ${user.full_name},\n\nThank you for your interest in the ${job.title} position at ${company.name}. After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.\n\nWe appreciate the time you took to apply and interview with us. We were impressed by your background and wish you the best in your job search.\n\nBest regards,\n${company.name} Team`
    });
    
    // Send notification
    await base44.entities.Notification.create({
      user_id: user.id,
      type: 'status_change',
      title: '📋 Application Update',
      message: `Your application for ${job.title} at ${company.name} has been reviewed`,
      job_id: job.id,
      match_id: match.id,
      navigate_to: 'ApplicationTracker'
    });
    
    setMatches(matches.map(m => m.id === match.id ? { ...m, status: 'rejected' } : m));
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
    const user = candidate ? users[candidate.user_id] : null;
    
    if (candidate && job && user) {
      const stageLabel = PIPELINE_STAGES.find(s => s.id === toStage)?.label || toStage;
      
      // If rejected, send rejection email
      if (newStatus === 'rejected') {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: `Update on your application - ${company.name}`,
          body: `Hi ${user.full_name},\n\nThank you for your interest in the ${job.title} position at ${company.name}. After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.\n\nWe appreciate the time you took to apply and interview with us. We were impressed by your background and wish you the best in your job search.\n\nBest regards,\n${company.name} Team`
        });
      }
      
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
      candidate?.bio || '',
      ...(candidate?.skills || []),
      ...(candidate?.experience?.map(e => `${e.title} ${e.company} ${e.description || ''}`) || []),
      candidate?.resume_url ? 'resume' : '',
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
    
    if (searchQuery.trim() && searchMode === 'pipeline') {
      const terms = parseSearchQuery(searchQuery);
      filtered = filtered.filter(m => matchesSearchTerms(m, terms));
    }
    
    return filtered;
  };

  // Search all candidates in SwipeHire (not just matched ones)
  const searchAllCandidates = () => {
    if (!searchQuery.trim()) {
      setGlobalSearchResults([]);
      return;
    }
    
    const terms = parseSearchQuery(searchQuery);
    const results = allCandidatesList.filter(candidate => {
      const user = users[candidate.user_id];
      const searchableText = [
        user?.full_name || '',
        user?.email || '',
        candidate?.headline || '',
        candidate?.location || '',
        candidate?.bio || '',
        ...(candidate?.skills || []),
        ...(candidate?.experience?.map(e => `${e.title} ${e.company} ${e.description || ''}`) || []),
        candidate?.resume_url ? 'resume has_resume' : ''
      ].join(' ').toLowerCase();
      
      // Check NOT terms first
      for (const term of terms.not) {
        if (searchableText.includes(term)) return false;
      }
      
      // Check AND terms
      for (const term of terms.and) {
        if (!searchableText.includes(term)) return false;
      }
      
      // Check OR terms
      if (terms.or.length > 0) {
        const hasAnyOr = terms.or.some(term => searchableText.includes(term));
        if (!hasAnyOr) return false;
      }
      
      return true;
    });
    
    setGlobalSearchResults(results);
  };

  useEffect(() => {
    if (searchMode === 'all') {
      searchAllCandidates();
    }
  }, [searchQuery, searchMode, allCandidatesList]);

  const getCandidateMatchStatus = (candidateId) => {
    const match = matches.find(m => m.candidate_id === candidateId);
    return match ? getStageFromStatus(match.status) : null;
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
              <>
                <Badge className="bg-pink-500 text-white">{selectedMatches.size} selected</Badge>
                <Button onClick={() => setShowMassMessageDialog(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Mail className="w-4 h-4 mr-2" /> Message {selectedMatches.size}
                </Button>
                <Button onClick={() => setShowBulkMoveDialog(true)} className="swipe-gradient text-white">
                  Move {selectedMatches.size}
                </Button>
              </>
            )}

            <Button onClick={() => setShowCompare(true)} variant="outline" className="border-pink-200 text-pink-600 hover:bg-pink-50">
              <Trophy className="w-4 h-4 mr-2" /> Compare Candidates
            </Button>
          </div>
        </div>

        {/* Search Mode Toggle */}
        <div className="mb-4 flex items-center gap-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex-1">
            <strong>Boolean Search:</strong> Use AND, OR, NOT operators. Example: "React AND TypeScript NOT Junior" or "-intern" to exclude. 
            <span className="text-blue-600 ml-1">• Search includes skills, experience, bio, and candidates with resumes</span>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border">
            <Button
              size="sm"
              variant={searchMode === 'pipeline' ? 'default' : 'ghost'}
              onClick={() => setSearchMode('pipeline')}
              className={searchMode === 'pipeline' ? 'swipe-gradient text-white' : ''}
            >
              My Pipeline
            </Button>
            <Button
              size="sm"
              variant={searchMode === 'all' ? 'default' : 'ghost'}
              onClick={() => setSearchMode('all')}
              className={searchMode === 'all' ? 'swipe-gradient text-white' : ''}
            >
              <Users className="w-4 h-4 mr-1" /> All SwipeHire
            </Button>
          </div>
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

        {/* Helper Text */}
        {searchMode === 'pipeline' && selectedMatches.size === 0 && filteredMatches.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            💡 <strong>Tip:</strong> Check the boxes next to candidates to select them for mass actions (messaging, moving stages, etc.)
          </div>
        )}

        {/* Pipeline View with Drag & Drop */}
        {viewMode === 'pipeline' && searchMode === 'pipeline' && (
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
                                      <div className="flex items-start gap-2 mb-3">
                                        <input
                                          type="checkbox"
                                          checked={selectedMatches.has(match.id)}
                                          onChange={() => toggleSelectMatch(match.id)}
                                          className="mt-1 w-5 h-5 rounded border-2 border-gray-400 accent-pink-500 cursor-pointer hover:border-pink-500 transition-colors flex-shrink-0"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <div {...provided.dragHandleProps} className="pt-1 cursor-grab flex-shrink-0">
                                          <GripVertical className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div className="flex-1 min-w-0" onClick={() => openCandidateDetails(match)}>
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
                                          
                                          {/* Tags */}
                                          {candidateTags[match.id]?.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                              {candidateTags[match.id].map(tagId => {
                                                const tag = CANDIDATE_TAGS.find(t => t.id === tagId);
                                                return tag ? (
                                                  <span key={tagId} className={`text-xs px-1.5 py-0.5 rounded ${tag.color}`}>
                                                    {tag.label}
                                                  </span>
                                                ) : null;
                                              })}
                                            </div>
                                          )}
                                          
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

                                      {/* Quick Actions */}
                                      <div className="flex gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            confirmMoveCandidate(match.id, stage.id, 'screening', user?.full_name);
                                          }}
                                          className="flex-1 text-xs py-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors font-medium"
                                        >
                                          ✓ Pass
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleQuickReject(match);
                                          }}
                                          className="flex-1 text-xs py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors font-medium"
                                        >
                                          ✕ Reject
                                        </button>
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

        {/* Global Search Results */}
        {searchMode === 'all' && searchQuery.trim() && (
          <Card className="border-0 shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-500" />
                All SwipeHire Candidates ({globalSearchResults.length} found)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {globalSearchResults.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No candidates found matching your search</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="w-10 p-4">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              const newSet = new Set(selectedMatches);
                              globalSearchResults.forEach(c => {
                                const match = matches.find(m => m.candidate_id === c.id);
                                if (match) newSet.add(match.id);
                              });
                              setSelectedMatches(newSet);
                            } else {
                              const candidateIds = globalSearchResults.map(c => c.id);
                              const newSet = new Set(Array.from(selectedMatches).filter(matchId => {
                                const match = matches.find(m => m.id === matchId);
                                return !candidateIds.includes(match?.candidate_id);
                              }));
                              setSelectedMatches(newSet);
                            }
                          }}
                          className="w-5 h-5 rounded border-2 border-gray-400 accent-pink-500 cursor-pointer hover:border-pink-500 transition-colors"
                        />
                      </th>
                      <th className="text-left p-4 font-medium text-gray-600">Candidate</th>
                      <th className="text-left p-4 font-medium text-gray-600">Skills</th>
                      <th className="text-left p-4 font-medium text-gray-600">Location</th>
                      <th className="text-left p-4 font-medium text-gray-600">Experience</th>
                      <th className="text-left p-4 font-medium text-gray-600">Resume</th>
                      <th className="text-left p-4 font-medium text-gray-600">Status</th>
                      <th className="text-left p-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalSearchResults.map((candidate) => {
                      const user = users[candidate.user_id];
                      const pipelineStatus = getCandidateMatchStatus(candidate.id);
                      const stage = pipelineStatus ? PIPELINE_STAGES.find(s => s.id === pipelineStatus) : null;
                      const match = matches.find(m => m.candidate_id === candidate.id);
                      
                      return (
                        <tr key={candidate.id} className="border-b hover:bg-gray-50">
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={match ? selectedMatches.has(match.id) : false}
                                onChange={() => {
                                  if (match) {
                                    toggleSelectMatch(match.id);
                                  }
                                }}
                                className="w-6 h-6 rounded border-2 border-orange-500 cursor-pointer hover:border-orange-600 transition-colors"
                                style={{
                                  accentColor: '#f97316',
                                  backgroundColor: match && selectedMatches.has(match.id) ? '#f97316' : 'white'
                                }}
                              />
                            </div>
                          </td>
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
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {candidate?.skills?.slice(0, 3).map((skill, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                              ))}
                              {candidate?.skills?.length > 3 && (
                                <Badge variant="outline" className="text-xs">+{candidate.skills.length - 3}</Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-gray-600">{candidate?.location || '-'}</td>
                          <td className="p-4 text-gray-600">
                            {candidate?.experience_years ? `${candidate.experience_years} years` : candidate?.experience_level || '-'}
                          </td>
                          <td className="p-4">
                            {candidate?.resume_url ? (
                              <a 
                                href={candidate.resume_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100"
                              >
                                <FileText className="w-4 h-4" />
                                View
                              </a>
                            ) : (
                              <span className="text-gray-400 text-sm">None</span>
                            )}
                          </td>
                          <td className="p-4">
                            {stage ? (
                              <Badge className={stage.color}>{stage.label}</Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">Not in pipeline</Badge>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Link to={createPageUrl('ViewCandidateProfile') + `?candidateId=${candidate.id}`}>
                                <Button size="sm" variant="outline">
                                  <Eye className="w-4 h-4 mr-1" /> View
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        )}

        {/* List View */}
        {viewMode === 'list' && searchMode === 'pipeline' && (
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
                        checked={selectedMatches.size > 0 && selectedMatches.size === filteredMatches.length}
                        className="w-5 h-5 rounded border-2 border-gray-400 accent-pink-500 cursor-pointer hover:border-pink-500 transition-colors"
                      />
                    </th>
                    <th className="text-left p-4 font-medium text-gray-600">Candidate</th>
                    <th className="text-left p-4 font-medium text-gray-600">Job</th>
                    <th className="text-left p-4 font-medium text-gray-600">Stage</th>
                    <th className="text-left p-4 font-medium text-gray-600">Match</th>
                    <th className="text-left p-4 font-medium text-gray-600">Tags</th>
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
                            className="w-5 h-5 rounded border-2 border-gray-400 accent-pink-500 cursor-pointer hover:border-pink-500 transition-colors"
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
                          <div className="flex flex-wrap gap-1">
                            {candidateTags[match.id]?.map(tagId => {
                              const tag = CANDIDATE_TAGS.find(t => t.id === tagId);
                              return tag ? (
                                <span key={tagId} className={`text-xs px-1.5 py-0.5 rounded ${tag.color}`}>
                                  {tag.label}
                                </span>
                              ) : null;
                            })}
                          </div>
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
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmMoveCandidate(match.id, currentStage, 'screening', user?.full_name);
                              }}
                              className="bg-green-100 text-green-700 hover:bg-green-200 border-0"
                            >
                              ✓ Pass
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickReject(match);
                              }}
                              className="bg-red-100 text-red-700 hover:bg-red-200 border-0"
                            >
                              ✕ Reject
                            </Button>
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
                                  openEmailDialog(match);
                                }}>
                                  <Mail className="w-4 h-4 mr-2" /> Send Email
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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

                  {/* Application Materials */}
                  {(() => {
                    const app = applications.find(a => 
                      a.candidate_id === candidate?.id && a.job_id === selectedCandidate.job_id
                    );
                    
                    return (
                      <div className="space-y-3">
                        {/* Resume */}
                        {(app?.resume_url || candidate?.resume_url) && (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                <span className="font-medium text-blue-900">Resume</span>
                              </div>
                              <div className="flex gap-2">
                                <a 
                                  href={app?.resume_url || candidate.resume_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                                >
                                  <Eye className="w-4 h-4" /> View
                                </a>
                                <a 
                                  href={app?.resume_url || candidate.resume_url} 
                                  download
                                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-blue-300 text-blue-600 rounded-lg text-sm hover:bg-blue-50"
                                >
                                  <Download className="w-4 h-4" /> Download
                                </a>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Video Pitch */}
                        {app?.video_pitch_url && (
                          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Video className="w-5 h-5 text-purple-600" />
                              <span className="font-medium text-purple-900">Video Elevator Pitch</span>
                            </div>
                            <video
                              src={app.video_pitch_url}
                              controls
                              className="w-full rounded-lg"
                            />
                          </div>
                        )}

                        {/* Cover Letter */}
                        {app?.cover_letter && (
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <h4 className="font-medium text-gray-900 mb-2">Cover Letter</h4>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.cover_letter}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* AI Resume Analysis */}
                  <ResumeAnalysis 
                    candidate={candidate} 
                    user={user} 
                    searchQuery={searchQuery}
                  />

                  {/* Tags Section */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-purple-500" /> Tags
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {CANDIDATE_TAGS.map(tag => {
                        const isActive = candidateTags[selectedCandidate.id]?.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            onClick={() => isActive ? removeTag(selectedCandidate.id, tag.id) : addTag(selectedCandidate.id, tag.id)}
                            className={`text-sm px-3 py-1 rounded-full transition-all ${
                              isActive ? tag.color + ' ring-2 ring-offset-1 ring-gray-300' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {tag.label}
                            {isActive && <X className="w-3 h-3 ml-1 inline" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Job Applied For */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500 mb-1">Applied for</p>
                    <p className="font-semibold text-gray-900">{job?.title}</p>
                    {selectedCandidate.match_score && (
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium">{selectedCandidate.match_score}% Match</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setFeedbackMatch(selectedCandidate);
                            setShowFeedbackForm(true);
                          }}
                        >
                          Rate Match
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Activity Log */}
                  <div className="border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-500" /> Activity Log
                      </h3>
                      <Button variant="ghost" size="sm" onClick={() => setShowActivityLog(!showActivityLog)}>
                        {showActivityLog ? 'Hide' : 'Show All'}
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {(activities[selectedCandidate.id] || []).slice(0, showActivityLog ? undefined : 3).map((activity, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5" />
                          <div className="flex-1">
                            <p className="text-gray-700">{activity.description}</p>
                            <p className="text-xs text-gray-400">
                              {format(new Date(activity.timestamp), 'MMM d, h:mm a')} • {activity.user}
                            </p>
                          </div>
                        </div>
                      ))}
                      {(!activities[selectedCandidate.id] || activities[selectedCandidate.id].length === 0) && (
                        <p className="text-sm text-gray-400">No activity yet</p>
                      )}
                    </div>
                  </div>

                  {/* Detailed Match Insights */}
                  <DetailedMatchInsights
                    candidate={candidate}
                    job={job}
                    company={company}
                    score={selectedCandidate.match_score}
                    insights={[]}
                    showDetailed={false}
                  />

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
                    
                    <Button variant="outline" onClick={() => openEmailDialog(selectedCandidate)}>
                      <Mail className="w-4 h-4 mr-2" /> Email
                    </Button>
                    
                    <Link to={createPageUrl('ViewCandidateProfile') + `?candidateId=${candidate?.id}`}>
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

      {/* Resume Compare Tool */}
      <ResumeCompare
        open={showCompare}
        onOpenChange={setShowCompare}
        candidates={candidates}
        users={users}
        jobs={jobs}
        selectedCandidateIds={Array.from(selectedMatches).map(matchId => {
          const match = matches.find(m => m.id === matchId);
          return match?.candidate_id;
        }).filter(Boolean)}
      />

      {/* Match Feedback Form */}
      <MatchFeedbackForm
        open={showFeedbackForm}
        onOpenChange={setShowFeedbackForm}
        matchId={feedbackMatch?.id}
        candidateId={feedbackMatch?.candidate_id}
        jobId={feedbackMatch?.job_id}
        aiScore={feedbackMatch?.match_score}
        recruiterId={currentUser?.id}
        onSubmit={() => {
          setShowFeedbackForm(false);
          setFeedbackMatch(null);
        }}
      />

      {/* Mass Message Dialog */}
      <Dialog open={showMassMessageDialog} onOpenChange={setShowMassMessageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-500" />
              Send Mass Message to {selectedMatches.size} Candidates
            </DialogTitle>
            <DialogDescription>
              Personalize your message with: {'{name}'}, {'{company}'}, {'{job}'}, {'{skills}'}, {'{recruiter}'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Template Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Quick Templates</label>
              <div className="flex flex-wrap gap-2">
                {EMAIL_TEMPLATES.map(template => (
                  <Button
                    key={template.id}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMassEmailSubject(template.subject);
                      setMassEmailBody(template.body);
                    }}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Subject</label>
              <Input 
                value={massEmailSubject} 
                onChange={(e) => setMassEmailSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Message</label>
              <Textarea 
                value={massEmailBody} 
                onChange={(e) => setMassEmailBody(e.target.value)}
                placeholder="Write your message... Use {name}, {company}, {job}, {skills}, {recruiter} for personalization"
                rows={10}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              <strong>Note:</strong> Each candidate will receive a personalized version of this email. 
              The placeholders will be automatically replaced with their specific information.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMassMessageDialog(false)}>Cancel</Button>
            <Button onClick={sendMassEmail} disabled={!massEmailSubject || !massEmailBody} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Send className="w-4 h-4 mr-2" /> Send to {selectedMatches.size} Candidates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-pink-500" />
              Send Email to {emailCandidate?.user?.full_name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Template Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Quick Templates</label>
              <div className="flex flex-wrap gap-2">
                {EMAIL_TEMPLATES.map(template => (
                  <Button
                    key={template.id}
                    variant={selectedTemplate?.id === template.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => applyEmailTemplate(template)}
                    className={selectedTemplate?.id === template.id ? 'swipe-gradient text-white' : ''}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">To</label>
              <Input value={emailCandidate?.user?.email || ''} disabled className="bg-gray-50" />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Subject</label>
              <Input 
                value={emailSubject} 
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Message</label>
              <Textarea 
                value={emailBody} 
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Write your message..."
                rows={8}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>Cancel</Button>
            <Button onClick={sendEmail} disabled={!emailSubject || !emailBody} className="swipe-gradient text-white">
              <Send className="w-4 h-4 mr-2" /> Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
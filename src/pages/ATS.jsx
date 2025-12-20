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
  Plus, X, Edit2, Copy, TrendingUp
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
import OnboardingTooltip from '@/components/onboarding/OnboardingTooltip';
import analytics from '@/components/analytics/Analytics';
import AdvancedSearchFilters from '@/components/ats/AdvancedSearchFilters';
import BooleanSearchParser from '@/components/ats/BooleanSearchParser';
import RankedCandidateList from '@/components/evaluation/RankedCandidateList';

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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    skills: [],
    location: '',
    experienceLevel: '',
    experienceYearsMin: 0,
    experienceYearsMax: 20,
    hasResume: false,
    hasVideo: false,
    salaryMin: 0,
    salaryMax: 500000,
    educationLevel: ''
  });
  const [searchValidation, setSearchValidation] = useState({ valid: true, error: null });
  const booleanParser = React.useRef(new BooleanSearchParser()).current;

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

  // Validate search query on change
  React.useEffect(() => {
    if (searchQuery.trim()) {
      const validation = booleanParser.validate(searchQuery);
      setSearchValidation(validation);
    } else {
      setSearchValidation({ valid: true, error: null });
    }
  }, [searchQuery]);

  const getFilteredMatches = () => {
    let filtered = matches;
    
    if (selectedJob !== 'all') {
      filtered = filtered.filter(m => m.job_id === selectedJob);
    }
    
    if (searchQuery.trim() && searchMode === 'pipeline') {
      filtered = filtered.filter(m => {
        const candidate = candidates[m.candidate_id];
        const user = candidate ? users[candidate.user_id] : null;
        return booleanParser.search(searchQuery, candidate, user);
      });
    }
    
    return filtered;
  };

  // Apply advanced filters
  const applyAdvancedFilters = (candidates) => {
    return candidates.filter(candidate => {
      const user = users[candidate.user_id];
      
      // Skills filter
      if (advancedFilters.skills?.length > 0) {
        const candidateSkills = (candidate?.skills || []).map(s => s.toLowerCase());
        const hasAllSkills = advancedFilters.skills.every(skill => 
          candidateSkills.some(cs => cs.includes(skill.toLowerCase()))
        );
        if (!hasAllSkills) return false;
      }
      
      // Location filter
      if (advancedFilters.location) {
        const loc = (candidate?.location || '').toLowerCase();
        if (!loc.includes(advancedFilters.location.toLowerCase())) return false;
      }
      
      // Experience level filter
      if (advancedFilters.experienceLevel) {
        if (candidate?.experience_level !== advancedFilters.experienceLevel) return false;
      }
      
      // Years of experience filter
      if (candidate?.experience_years) {
        if (candidate.experience_years < advancedFilters.experienceYearsMin || 
            candidate.experience_years > advancedFilters.experienceYearsMax) {
          return false;
        }
      }
      
      // Salary filter
      if (candidate?.salary_expectation_min) {
        if (candidate.salary_expectation_min < advancedFilters.salaryMin || 
            candidate.salary_expectation_min > advancedFilters.salaryMax) {
          return false;
        }
      }
      
      // Has resume filter
      if (advancedFilters.hasResume && !candidate?.resume_url) return false;
      
      // Has video filter
      if (advancedFilters.hasVideo && !candidate?.video_intro_url) return false;
      
      // Education filter
      if (advancedFilters.educationLevel && candidate?.education?.length > 0) {
        const hasEducation = candidate.education.some(edu => {
          const degree = (edu.degree || '').toLowerCase();
          switch (advancedFilters.educationLevel) {
            case 'high_school': return degree.includes('high school');
            case 'associate': return degree.includes('associate');
            case 'bachelor': return degree.includes('bachelor');
            case 'master': return degree.includes('master');
            case 'phd': return degree.includes('phd') || degree.includes('doctorate');
            default: return true;
          }
        });
        if (!hasEducation) return false;
      }
      
      return true;
    });
  };

  // Search all candidates in SwipeHire (not just matched ones)
  const searchAllCandidates = async () => {
    setLoading(true);
    try {
      // Always fetch FRESH data to ensure we get ALL candidates in the system
      const freshCandidates = await base44.entities.Candidate.list();
      
      let results = [...freshCandidates];
      
      // Apply boolean search if query exists
      if (searchQuery.trim()) {
        results = results.filter(candidate => {
          const user = users[candidate.user_id];
          return booleanParser.search(searchQuery, candidate, user);
        });
      }
      
      // Apply advanced filters
      results = applyAdvancedFilters(results);
      
      // Track search analytics
      analytics.track('ATS Search Executed', {
        query: searchQuery,
        mode: searchMode,
        resultsCount: results.length,
        totalCandidatesInSystem: freshCandidates.length,
        hasAdvancedFilters: Object.values(advancedFilters).some(v => v && (Array.isArray(v) ? v.length > 0 : v !== '' && v !== 0 && v !== false))
      });
      
      setGlobalSearchResults(results);
      setAllCandidatesList(freshCandidates); // Update local cache
    } catch (error) {
      console.error('Search failed:', error);
      setGlobalSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Removed auto-search on mode change - now only triggered by button click or Enter key

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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-24 relative">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
        
        /* Ensure all interactive elements are clickable */
        input, button, select, textarea, [role="button"], [role="checkbox"] {
          cursor: pointer;
          pointer-events: auto;
        }
        
        input:focus, textarea:focus, select:focus {
          outline: none;
        }
        
        /* Prevent any overlay issues */
        .relative {
          position: relative;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 pt-4">
        {/* Header - Mobile Optimized */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ATS</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{filteredMatches.length} candidates</p>
        </div>
        
        {/* Search - Mobile First */}
        <div className="mb-4 space-y-3">
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none z-10" />
                <Input
                  placeholder="Search candidates... Use AND, OR, NOT for boolean search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading) {
                      if (searchMode === 'all') {
                        searchAllCandidates();
                      }
                    }
                  }}
                  className="pl-10 h-11"
                />
              </div>
              <Button 
                onClick={() => {
                  if (searchMode === 'all') {
                    searchAllCandidates();
                  }
                  // Pipeline mode search is handled automatically by getFilteredMatches
                }}
                className="swipe-gradient text-white h-11 px-6"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Search
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400 px-1">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Boolean examples:</span>
              <code className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded font-mono">Python AND React</code>
              <code className="px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded font-mono">Designer OR Engineer</code>
              <code className="px-1.5 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded font-mono">NOT Remote</code>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger>
                <Briefcase className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Jobs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {jobs.map(job => (
                  <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`${showAdvancedFilters ? 'bg-pink-50 border-pink-300 text-pink-700' : ''}`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {selectedMatches.size > 0 && (
            <div className="col-span-2 flex gap-2">
              <Button 
                onClick={() => setShowMassMessageDialog(true)} 
                className="flex-1 swipe-gradient text-white h-11"
                size="sm"
              >
                Message {selectedMatches.size}
              </Button>
              <Button 
                onClick={() => setShowBulkMoveDialog(true)} 
                variant="outline"
                size="sm"
                className="h-11"
              >
                Move
              </Button>
            </div>
          )}
        </div>

        {/* Advanced Filters Sidebar */}
        {showAdvancedFilters && (
          <div className="mb-6">
            <AdvancedSearchFilters
              filters={advancedFilters}
              onFiltersChange={setAdvancedFilters}
              onSaveSearch={() => {}}
            />
          </div>
        )}

        {/* Search Mode Toggle + Boolean Help */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-2xl p-1.5 border-2 border-gray-100 dark:border-slate-700 shadow-sm">
            <Button
              size="sm"
              variant={searchMode === 'pipeline' ? 'default' : 'ghost'}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSearchMode('pipeline');
              }}
              className={`rounded-xl ${searchMode === 'pipeline' ? 'swipe-gradient text-white shadow-md' : 'hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-gray-300'}`}
              type="button"
            >
              My Pipeline
            </Button>
            <Button
              size="sm"
              variant={searchMode === 'all' ? 'default' : 'ghost'}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSearchMode('all');
              }}
              className={`rounded-xl ${searchMode === 'all' ? 'swipe-gradient text-white shadow-md' : 'hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-gray-300'}`}
              type="button"
            >
              <Users className="w-4 h-4 mr-2" /> All SwipeHire
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6">
          {PIPELINE_STAGES.map((stage, idx) => (
            <Card key={stage.id} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-800">
              <CardContent className="p-4 md:p-5">
                <div className={`w-10 h-10 rounded-xl ${stage.color.replace('text-', 'bg-').replace('100', '100')} flex items-center justify-center mb-3`}>
                  <span className="text-xl font-bold">{getMatchesByStage(stage.id).length}</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{stage.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {((getMatchesByStage(stage.id).length / filteredMatches.length) * 100 || 0).toFixed(0)}% of pipeline
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View Toggle */}
        <Tabs value={viewMode} onValueChange={(value) => {
          setViewMode(value);
        }} className="mb-6">
          <TabsList className="bg-white dark:bg-slate-900 rounded-2xl p-1.5 shadow-sm border-2 border-gray-100 dark:border-slate-700">
            <TabsTrigger 
              value="pipeline" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-6"
              onClick={(e) => e.stopPropagation()}
            >
              Pipeline View
            </TabsTrigger>
            <TabsTrigger 
              value="ranked" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-6"
              onClick={(e) => e.stopPropagation()}
            >
              AI Rankings
            </TabsTrigger>
            <TabsTrigger 
              value="list" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-6"
              onClick={(e) => e.stopPropagation()}
            >
              List View
            </TabsTrigger>
          </TabsList>
        </Tabs>



        {/* Pipeline View with Drag & Drop */}
        {viewMode === 'pipeline' && searchMode === 'pipeline' && (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {PIPELINE_STAGES.map(stage => (
                <div key={stage.id} className="flex-shrink-0 w-72">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <div className={`w-2 h-2 rounded-full ${stage.color.replace('100', '500').replace('text-', 'bg-')}`} />
                    <h3 className="font-semibold text-gray-900 dark:text-white flex-1">{stage.label}</h3>
                    <Badge className={`${stage.color} rounded-full px-2.5 shadow-sm`}>{getMatchesByStage(stage.id).length}</Badge>
                  </div>
                  
                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-3 min-h-[200px] rounded-xl p-3 transition-colors ${
                          snapshot.isDraggingOver ? 'bg-pink-50 dark:bg-pink-900/20 border-2 border-pink-200 dark:border-pink-700' : 'bg-gray-100 dark:bg-slate-800'
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
                                    className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-0 bg-white dark:bg-slate-900 dark:border-slate-800 ${
                                      selectedMatches.has(match.id) ? 'ring-2 ring-pink-500 shadow-md' : 'hover:scale-[1.02]'
                                    }`}
                                  >
                                    <CardContent className="p-4">
                                    <div className="flex items-start gap-2 mb-3">
                                      <label 
                                        className="mt-1 flex-shrink-0 cursor-pointer flex items-center justify-center w-6 h-6 rounded-md hover:bg-gray-100 transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={selectedMatches.has(match.id)}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            toggleSelectMatch(match.id);
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-5 h-5 rounded border-2 border-gray-400 accent-pink-500 cursor-pointer hover:border-pink-500 transition-colors"
                                        />
                                      </label>
                                      <div {...provided.dragHandleProps} className="pt-1 cursor-grab flex-shrink-0">
                                        <GripVertical className="w-4 h-4 text-gray-400" />
                                      </div>
                                       <div 
                                         className="flex-1 min-w-0 cursor-pointer" 
                                         onClick={(e) => {
                                           e.stopPropagation();
                                           openCandidateDetails(match);
                                         }}
                                       >
                                         <div className="flex items-center gap-2">
                                            {candidate?.photo_url ? (
                                              <img src={candidate.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-white font-bold text-xs">
                                                {user?.full_name?.charAt(0) || '?'}
                                              </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{user?.full_name || 'Unknown'}</p>
                                                 <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{job?.title}</p>
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
                                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{match.match_score}%</span>
                                            </div>
                                          )}
                                          
                                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 dark:text-gray-500">
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
                                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            confirmMoveCandidate(match.id, stage.id, 'screening', user?.full_name);
                                          }}
                                          className="flex-1 text-xs py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-md transition-all font-medium cursor-pointer"
                                          type="button"
                                        >
                                          ✓ Advance
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleQuickReject(match);
                                          }}
                                          className="flex-1 text-xs py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg hover:shadow-md transition-all font-medium cursor-pointer"
                                          type="button"
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
                          <div className="text-center py-12">
                            <div className={`w-16 h-16 rounded-2xl ${stage.color.replace('text-', 'bg-').replace('700', '100')} dark:opacity-30 mx-auto mb-3 flex items-center justify-center`}>
                              <Users className={`w-8 h-8 ${stage.color.replace('bg-', 'text-').replace('100', '400')}`} />
                            </div>
                            <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">No candidates</p>
                            <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">Drag & drop here</p>
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
        {searchMode === 'all' && (
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden mb-6 dark:bg-slate-900 dark:border-slate-800">
            <CardHeader className="bg-gradient-to-r from-pink-500 to-orange-500 text-white">
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching all candidates...
                  </>
                ) : (
                  `Search Results (${globalSearchResults.length} candidates found)`
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 mx-auto mb-3 text-pink-500 animate-spin" />
                  <p className="text-gray-500 dark:text-gray-400">Searching across all SwipeHire candidates...</p>
                </div>
              ) : globalSearchResults.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="font-semibold mb-1">No candidates found</p>
                  <p className="text-sm">Try different search terms or adjust your filters</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-800 border-b dark:border-slate-700">
                  <tr>
                    <th className="w-10 p-4" onClick={(e) => e.stopPropagation()}>
                      <label className="cursor-pointer flex items-center justify-center">
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
                      </label>
                    </th>
                      <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-400">Candidate</th>
                      <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-400">Skills</th>
                      <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-400">Location</th>
                      <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-400">Experience</th>
                      <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-400">Resume</th>
                      <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-400">Status</th>
                      <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalSearchResults.map((candidate) => {
                      const user = users[candidate.user_id];
                      const pipelineStatus = getCandidateMatchStatus(candidate.id);
                      const stage = pipelineStatus ? PIPELINE_STAGES.find(s => s.id === pipelineStatus) : null;
                      const match = matches.find(m => m.candidate_id === candidate.id);
                      
                      return (
                        <tr key={candidate.id} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">
                         <td className="p-4" onClick={(e) => e.stopPropagation()}>
                           <label className="flex items-center justify-center cursor-pointer">
                             <input
                               type="checkbox"
                               checked={match ? selectedMatches.has(match.id) : false}
                               disabled={!match}
                               onChange={(e) => {
                                 e.stopPropagation();
                                 if (match) {
                                   toggleSelectMatch(match.id);
                                 }
                               }}
                               onClick={(e) => e.stopPropagation()}
                               className="w-6 h-6 rounded border-2 border-orange-500 cursor-pointer hover:border-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                               style={{
                                 accentColor: '#f97316',
                                 backgroundColor: match && selectedMatches.has(match.id) ? '#f97316' : 'white'
                               }}
                             />
                           </label>
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
                                <p className="font-medium text-gray-900 dark:text-white">{user?.full_name || 'Unknown'}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{candidate?.headline}</p>
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
                          <td className="p-4 text-gray-600 dark:text-gray-400">{candidate?.location || '-'}</td>
                          <td className="p-4 text-gray-600 dark:text-gray-400">
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
                              <span className="text-gray-400 dark:text-gray-500 text-sm">None</span>
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

        {/* AI Ranked View */}
        {viewMode === 'ranked' && (
          <div className="space-y-4">
            <Card className="border-pink-200 bg-gradient-to-r from-pink-50 to-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">AI-Powered Candidate Rankings</h3>
                    <p className="text-sm text-gray-600">
                      Strict, evidence-based evaluations to prioritize review • No candidates blocked
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedJob === 'all' ? (
              <Card className="dark:bg-slate-900 dark:border-slate-800">
                <CardContent className="py-12 text-center">
                  <Briefcase className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">Select a job to view AI-ranked candidates</p>
                </CardContent>
              </Card>
            ) : (
              <RankedCandidateList 
                job={jobs.find(j => j.id === selectedJob)} 
                onUpdate={loadData}
              />
            )}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && searchMode === 'pipeline' && (
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 border-b-2 border-gray-200 dark:border-slate-600">
                <tr>
                  <th className="w-10 p-4">
                    <label className="cursor-pointer flex items-center justify-center">
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
                    </label>
                  </th>
                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Candidate</th>
                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Job</th>
                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Stage</th>
                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Match</th>
                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Tags</th>
                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Resume</th>
                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Applied</th>
                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
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
                    <tr key={match.id} className="border-b dark:border-slate-700 hover:bg-gradient-to-r hover:from-pink-50/30 hover:to-orange-50/30 dark:hover:from-pink-900/10 dark:hover:to-orange-900/10 transition-colors">
                     <td className="p-4" onClick={(e) => e.stopPropagation()}>
                       <label className="cursor-pointer flex items-center justify-center">
                         <input
                           type="checkbox"
                           checked={selectedMatches.has(match.id)}
                           onChange={(e) => {
                             e.stopPropagation();
                             toggleSelectMatch(match.id);
                           }}
                           onClick={(e) => e.stopPropagation()}
                           className="w-5 h-5 rounded-md border-2 border-gray-400 accent-pink-500 cursor-pointer hover:border-pink-500 transition-colors"
                         />
                       </label>
                     </td>
                       <td className="p-4 cursor-pointer" onClick={(e) => {
                         e.stopPropagation();
                         openCandidateDetails(match);
                       }}>
                          <div className="flex items-center gap-3">
                            {candidate?.photo_url ? (
                              <img src={candidate.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-white font-bold">
                                {user?.full_name?.charAt(0) || '?'}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{user?.full_name || 'Unknown'}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{candidate?.headline}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-gray-600 dark:text-gray-400">{job?.title}</td>
                        <td className="p-4">
                          <Badge className={`${stage?.color} rounded-full shadow-sm`}>{stage?.label}</Badge>
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-pink-600 dark:text-pink-400">{match.match_score || '-'}%</span>
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
                              className="flex items-center gap-1 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FileText className="w-4 h-4" />
                              <span className="text-sm">View</span>
                            </a>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
                          )}
                        </td>
                        <td className="p-4 text-gray-500 dark:text-gray-400">{format(new Date(match.created_date), 'MMM d, yyyy')}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                confirmMoveCandidate(match.id, currentStage, 'screening', user?.full_name);
                              }}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-md border-0 rounded-lg"
                              type="button"
                            >
                              ✓ Advance
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleQuickReject(match);
                              }}
                              className="bg-gradient-to-r from-red-500 to-rose-500 text-white hover:shadow-md border-0 rounded-lg"
                              type="button"
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
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
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

      {/* Onboarding Tooltip */}
      <OnboardingTooltip pageName="ATS" />
    </div>
  );
}
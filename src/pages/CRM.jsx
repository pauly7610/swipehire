import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search, Filter, BarChart3, ListTodo } from 'lucide-react';
import CRMPipeline from '@/components/crm/CRMPipeline';
import CRMCandidateDetail from '@/components/crm/CRMCandidateDetail';
import CRMTaskList from '@/components/crm/CRMTaskList';
import CRMAnalytics from '@/components/crm/CRMAnalytics';
import AddCandidateModal from '@/components/crm/AddCandidateModal';

export default function CRM() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [filterJob, setFilterJob] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [companyData] = await base44.entities.Company.filter({ user_id: currentUser.id });
      if (!companyData) {
        navigate(createPageUrl('Onboarding'), { replace: true });
        return;
      }
      setCompany(companyData);

      const [crmCandidates, companyJobs, crmActivities, crmTasks] = await Promise.all([
        base44.entities.CRMCandidate.filter({ company_id: companyData.id, status: 'active' }),
        base44.entities.Job.filter({ company_id: companyData.id }),
        base44.entities.CRMActivity.list('-created_date', 100),
        base44.entities.CRMTask.filter({ recruiter_id: currentUser.id })
      ]);

      setCandidates(crmCandidates);
      setJobs(companyJobs);
      setActivities(crmActivities);
      setTasks(crmTasks);
    } catch (error) {
      console.error('Failed to load CRM data:', error);
    }
    setLoading(false);
  };

  const handleAddCandidate = async (candidateData) => {
    const newCandidate = await base44.entities.CRMCandidate.create({
      ...candidateData,
      company_id: company.id,
      recruiter_id: user.id
    });

    await base44.entities.CRMActivity.create({
      crm_candidate_id: newCandidate.id,
      recruiter_id: user.id,
      activity_type: 'note',
      title: 'Candidate added to CRM',
      description: `Source: ${candidateData.source || 'Direct'}`
    });

    setCandidates([...candidates, newCandidate]);
    setShowAddModal(false);
  };

  const handleStageChange = async (candidateId, newStage) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return;

    await base44.entities.CRMCandidate.update(candidateId, { stage: newStage });
    
    await base44.entities.CRMActivity.create({
      crm_candidate_id: candidateId,
      recruiter_id: user.id,
      activity_type: 'stage_change',
      title: 'Stage changed',
      from_stage: candidate.stage,
      to_stage: newStage,
      description: `Moved from ${candidate.stage} to ${newStage}`
    });

    setCandidates(candidates.map(c => c.id === candidateId ? { ...c, stage: newStage } : c));
    loadData(); // Refresh activities
  };

  const handleAddActivity = async (candidateId, activity) => {
    await base44.entities.CRMActivity.create({
      crm_candidate_id: candidateId,
      recruiter_id: user.id,
      ...activity
    });
    loadData();
  };

  const handleAddTask = async (task) => {
    await base44.entities.CRMTask.create({
      recruiter_id: user.id,
      ...task
    });
    loadData();
  };

  const handleUpdateTask = async (taskId, updates) => {
    await base44.entities.CRMTask.update(taskId, updates);
    setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = !searchQuery || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = filterStage === 'all' || c.stage === filterStage;
    const matchesJob = filterJob === 'all' || c.job_id === filterJob;
    return matchesSearch && matchesStage && matchesJob;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recruitment CRM</h1>
            <p className="text-gray-600 mt-1">Manage your candidate pipeline</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="swipe-gradient text-white">
            <Plus className="w-5 h-5 mr-2" />
            Add Candidate
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mt-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg"
          >
            <option value="all">All Stages</option>
            <option value="sourced">Sourced</option>
            <option value="screening">Screening</option>
            <option value="interviewing">Interviewing</option>
            <option value="offer">Offer</option>
            <option value="hired">Hired</option>
          </select>
          <select
            value={filterJob}
            onChange={(e) => setFilterJob(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg"
          >
            <option value="all">All Jobs</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="pipeline" className="space-y-6">
          <TabsList className="bg-white rounded-xl p-1 shadow-sm">
            <TabsTrigger value="pipeline" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white">
              <Filter className="w-4 h-4 mr-2" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white">
              <ListTodo className="w-4 h-4 mr-2" />
              Tasks ({tasks.filter(t => t.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline">
            <CRMPipeline
              candidates={filteredCandidates}
              onStageChange={handleStageChange}
              onSelectCandidate={setSelectedCandidate}
            />
          </TabsContent>

          <TabsContent value="tasks">
            <CRMTaskList
              tasks={tasks}
              candidates={candidates}
              onUpdateTask={handleUpdateTask}
              onAddTask={handleAddTask}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <CRMAnalytics
              candidates={candidates}
              activities={activities}
              jobs={jobs}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Candidate Detail Sidebar */}
      {selectedCandidate && (
        <CRMCandidateDetail
          candidate={selectedCandidate}
          activities={activities.filter(a => a.crm_candidate_id === selectedCandidate.id)}
          tasks={tasks.filter(t => t.crm_candidate_id === selectedCandidate.id)}
          jobs={jobs}
          onClose={() => setSelectedCandidate(null)}
          onAddActivity={handleAddActivity}
          onAddTask={handleAddTask}
          onUpdate={(updates) => {
            base44.entities.CRMCandidate.update(selectedCandidate.id, updates);
            setCandidates(candidates.map(c => c.id === selectedCandidate.id ? { ...c, ...updates } : c));
            setSelectedCandidate({ ...selectedCandidate, ...updates });
          }}
        />
      )}

      {/* Add Candidate Modal */}
      <AddCandidateModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        jobs={jobs}
        onAdd={handleAddCandidate}
      />
    </div>
  );
}
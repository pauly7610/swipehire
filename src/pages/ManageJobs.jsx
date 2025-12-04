import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, Briefcase, MapPin, DollarSign, Users, Eye, 
  Edit2, Trash2, MoreVertical, Loader2, Sparkles, ChevronDown, ChevronUp, Share2, Check, Copy
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import CandidateSuggestions from '@/components/matching/CandidateSuggestions';

export default function ManageJobs() {
  const [jobs, setJobs] = useState([]);
  const [matches, setMatches] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const user = await base44.auth.me();
      const [companyData] = await base44.entities.Company.filter({ user_id: user.id });
      setCompany(companyData);

      if (companyData) {
        const companyJobs = await base44.entities.Job.filter({ company_id: companyData.id });
        setJobs(companyJobs);

        const companyMatches = await base44.entities.Match.filter({ company_id: companyData.id });
        setMatches(companyMatches);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
    setLoading(false);
  };

  const toggleJobStatus = async (job) => {
    await base44.entities.Job.update(job.id, { is_active: !job.is_active });
    setJobs(jobs.map(j => j.id === job.id ? { ...j, is_active: !j.is_active } : j));
  };

  const deleteJob = async (jobId) => {
    await base44.entities.Job.delete(jobId);
    setJobs(jobs.filter(j => j.id !== jobId));
  };

  const getMatchCount = (jobId) => matches.filter(m => m.job_id === jobId).length;

  const [copiedJobId, setCopiedJobId] = useState(null);

  const shareJob = (jobId) => {
    const shareUrl = `${window.location.origin}/PublicJobView?id=${jobId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedJobId(jobId);
    toast.success('Job link copied to clipboard!');
    setTimeout(() => setCopiedJobId(null), 2000);
  };

  const formatSalary = (min, max, type) => {
    if (!min && !max) return 'Not specified';
    const format = (n) => n >= 1000 ? `${(n/1000).toFixed(0)}k` : n;
    return `$${format(min || 0)} - $${format(max || 0)}/${type === 'yearly' ? 'yr' : type === 'monthly' ? 'mo' : 'hr'}`;
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

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Jobs</h1>
            <p className="text-gray-500">{jobs.length} job{jobs.length !== 1 ? 's' : ''} posted</p>
          </div>
          <Link to={createPageUrl('PostJob')}>
            <Button className="swipe-gradient text-white shadow-lg shadow-pink-500/25">
              <Plus className="w-5 h-5 mr-2" /> Post Job
            </Button>
          </Link>
        </div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <Card className="p-12 text-center border-0 shadow-lg">
            <Briefcase className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs posted yet</h3>
            <p className="text-gray-500 mb-6">Create your first job posting to start finding candidates</p>
            <Link to={createPageUrl('PostJob')}>
              <Button className="swipe-gradient text-white">
                <Plus className="w-5 h-5 mr-2" /> Post Your First Job
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        job.is_active 
                          ? 'bg-gradient-to-br from-pink-100 to-orange-100' 
                          : 'bg-gray-100'
                      }`}>
                        <Briefcase className={`w-7 h-7 ${job.is_active ? 'text-pink-500' : 'text-gray-400'}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {job.location || 'Remote'}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                {formatSalary(job.salary_min, job.salary_max, job.salary_type)}
                              </span>
                              <Badge variant="secondary" className="capitalize">
                                {job.job_type?.replace('-', ' ')}
                              </Badge>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">
                                {job.is_active ? 'Active' : 'Paused'}
                              </span>
                              <Switch
                                checked={job.is_active}
                                onCheckedChange={() => toggleJobStatus(job)}
                              />
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-5 h-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => shareJob(job.id)}>
                                  {copiedJobId === job.id ? (
                                    <Check className="w-4 h-4 mr-2 text-green-500" />
                                  ) : (
                                    <Share2 className="w-4 h-4 mr-2" />
                                  )}
                                  {copiedJobId === job.id ? 'Copied!' : 'Share Job'}
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to={createPageUrl('PublicJobView') + `?id=${job.id}`}>
                                    <Eye className="w-4 h-4 mr-2" /> View
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to={createPageUrl('EditJob') + `?id=${job.id}`}>
                                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => deleteJob(job.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Skills */}
                        {job.skills_required?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {job.skills_required.slice(0, 4).map((skill) => (
                              <Badge 
                                key={skill} 
                                variant="secondary"
                                className="bg-gray-100 text-gray-600"
                              >
                                {skill}
                              </Badge>
                            ))}
                            {job.skills_required.length > 4 && (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                +{job.skills_required.length - 4}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
                          <Link 
                            to={createPageUrl('EmployerMatches') + `?jobId=${job.id}`}
                            className="flex items-center gap-2 hover:bg-pink-50 px-2 py-1 rounded-lg transition-colors"
                          >
                            <Users className="w-5 h-5 text-pink-500" />
                            <span className="font-semibold text-gray-900">{getMatchCount(job.id)}</span>
                            <span className="text-gray-500 text-sm">matches</span>
                          </Link>
                          <Link 
                            to={createPageUrl('SwipeCandidates') + `?jobId=${job.id}`}
                            className="text-pink-500 hover:text-pink-600 text-sm font-medium"
                          >
                            Find Candidates →
                          </Link>
                          <button
                            onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                            className="ml-auto flex items-center gap-1 text-sm text-gray-500 hover:text-pink-500 transition-colors"
                          >
                            <Sparkles className="w-4 h-4" />
                            AI Suggestions
                            {expandedJob === job.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Candidate Suggestions */}
                    <AnimatePresence>
                      {expandedJob === job.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t"
                        >
                          <div className="p-4 bg-gray-50">
                            <CandidateSuggestions job={job} company={company} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
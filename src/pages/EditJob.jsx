import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, MapPin, DollarSign, Plus, X, ArrowLeft, 
  CheckCircle, Building2, Loader2, Save
} from 'lucide-react';
import { motion } from 'framer-motion';
import JobTitleSelect from '@/components/shared/JobTitleSelect';
import LocationSelect from '@/components/shared/LocationSelect';
import IndustrySelect from '@/components/shared/IndustrySelect';

export default function EditJob() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  const [newResponsibility, setNewResponsibility] = useState('');

  const [jobData, setJobData] = useState({
    title: '',
    description: '',
    location: '',
    job_type: 'full-time',
    salary_min: '',
    salary_max: '',
    salary_type: 'yearly',
    skills_required: [],
    benefits: [],
    responsibilities: [],
    requirements: [],
    industry: ''
  });

  useEffect(() => {
    loadJob();
  }, []);

  const loadJob = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('id');
    
    if (!jobId) {
      navigate(createPageUrl('ManageJobs'));
      return;
    }

    try {
      const [job] = await base44.entities.Job.filter({ id: jobId });
      if (job) {
        setJobData({
          ...job,
          salary_min: job.salary_min?.toString() || '',
          salary_max: job.salary_max?.toString() || '',
          skills_required: job.skills_required || [],
          benefits: job.benefits || [],
          responsibilities: job.responsibilities || [],
          requirements: job.requirements || [],
          industry: job.industry || ''
        });
      } else {
        navigate(createPageUrl('ManageJobs'));
      }
    } catch (error) {
      console.error('Failed to load job:', error);
      navigate(createPageUrl('ManageJobs'));
    }
    setLoading(false);
  };

  const addToArray = (field, value, setValue) => {
    if (value.trim() && !jobData[field].includes(value.trim())) {
      setJobData({
        ...jobData,
        [field]: [...jobData[field], value.trim()]
      });
      setValue('');
    }
  };

  const removeFromArray = (field, item) => {
    setJobData({
      ...jobData,
      [field]: jobData[field].filter(i => i !== item)
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const jobId = urlParams.get('id');
      
      await base44.entities.Job.update(jobId, {
        title: jobData.title,
        description: jobData.description,
        location: jobData.location,
        job_type: jobData.job_type,
        salary_min: parseFloat(jobData.salary_min) || 0,
        salary_max: parseFloat(jobData.salary_max) || 0,
        salary_type: jobData.salary_type,
        skills_required: jobData.skills_required,
        benefits: jobData.benefits,
        responsibilities: jobData.responsibilities,
        requirements: jobData.requirements,
        industry: jobData.industry
      });
      navigate(createPageUrl('ManageJobs'));
    } catch (error) {
      console.error('Failed to update job:', error);
    }
    setSaving(false);
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

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate(createPageUrl('ManageJobs'))}>
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Job</h1>
            <p className="text-gray-500">Update job details</p>
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 space-y-6">
            {/* Industry */}
            <div>
              <Label className="text-gray-700 text-base">Industry</Label>
              <div className="mt-2">
                <IndustrySelect
                  value={jobData.industry}
                  onChange={(v) => setJobData({ ...jobData, industry: v })}
                  placeholder="Select industry"
                />
              </div>
            </div>

            {/* Job Title */}
            <div>
              <Label className="text-gray-700 text-base">Job Title *</Label>
              <div className="mt-2">
                <JobTitleSelect
                  value={jobData.title}
                  onChange={(v) => setJobData({ ...jobData, title: v })}
                  placeholder="Select job title"
                  industry={jobData.industry}
                />
              </div>
            </div>

            {/* Location & Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 text-base">Location</Label>
                <div className="mt-2">
                  <LocationSelect
                    value={jobData.location}
                    onChange={(v) => setJobData({ ...jobData, location: v })}
                    placeholder="Select location"
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-700 text-base">Job Type</Label>
                <Select
                  value={jobData.job_type}
                  onValueChange={(v) => setJobData({ ...jobData, job_type: v })}
                >
                  <SelectTrigger className="mt-2 h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Salary */}
            <div>
              <Label className="text-gray-700 text-base">Salary Range</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <Input
                  type="number"
                  value={jobData.salary_min}
                  onChange={(e) => setJobData({ ...jobData, salary_min: e.target.value })}
                  placeholder="Min"
                  className="h-12"
                />
                <Input
                  type="number"
                  value={jobData.salary_max}
                  onChange={(e) => setJobData({ ...jobData, salary_max: e.target.value })}
                  placeholder="Max"
                  className="h-12"
                />
                <Select
                  value={jobData.salary_type}
                  onValueChange={(v) => setJobData({ ...jobData, salary_type: v })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yearly">per year</SelectItem>
                    <SelectItem value="monthly">per month</SelectItem>
                    <SelectItem value="hourly">per hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label className="text-gray-700 text-base">Job Description *</Label>
              <Textarea
                value={jobData.description}
                onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
                placeholder="Describe the role..."
                className="mt-2 min-h-[150px]"
              />
            </div>

            {/* Responsibilities */}
            <div>
              <Label className="text-gray-700 text-base">Responsibilities</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newResponsibility}
                  onChange={(e) => setNewResponsibility(e.target.value)}
                  placeholder="Add a responsibility"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('responsibilities', newResponsibility, setNewResponsibility))}
                />
                <Button onClick={() => addToArray('responsibilities', newResponsibility, setNewResponsibility)} className="swipe-gradient">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
              <ul className="mt-3 space-y-2">
                {jobData.responsibilities.map((r, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                    {r}
                    <button onClick={() => removeFromArray('responsibilities', r)} className="ml-auto text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Skills */}
            <div>
              <Label className="text-gray-700 text-base">Required Skills</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('skills_required', newSkill, setNewSkill))}
                />
                <Button onClick={() => addToArray('skills_required', newSkill, setNewSkill)} className="swipe-gradient">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {jobData.skills_required.map((skill) => (
                  <Badge key={skill} className="bg-gradient-to-r from-pink-50 to-orange-50 text-pink-600 px-3 py-1.5">
                    {skill}
                    <button onClick={() => removeFromArray('skills_required', skill)} className="ml-2">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div>
              <Label className="text-gray-700 text-base">Benefits</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  placeholder="Add a benefit"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('benefits', newBenefit, setNewBenefit))}
                />
                <Button onClick={() => addToArray('benefits', newBenefit, setNewBenefit)} className="swipe-gradient">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {jobData.benefits.map((benefit) => (
                  <Badge key={benefit} variant="outline" className="border-green-200 text-green-600 bg-green-50 px-3 py-1.5">
                    {benefit}
                    <button onClick={() => removeFromArray('benefits', benefit)} className="ml-2">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <Button
            onClick={handleSave}
            disabled={saving || !jobData.title || !jobData.description}
            className="swipe-gradient text-white shadow-lg shadow-pink-500/25"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
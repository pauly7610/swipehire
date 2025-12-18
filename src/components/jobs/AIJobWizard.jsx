import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Sparkles, ChevronRight, ChevronLeft, Briefcase, FileText, 
  ListChecks, DollarSign, Lightbulb, Loader2, Check, Plus, X,
  Wand2, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const STEPS = [
  { id: 'basics', title: 'Job Basics', icon: Briefcase },
  { id: 'description', title: 'Description', icon: FileText },
  { id: 'requirements', title: 'Requirements', icon: ListChecks },
  { id: 'compensation', title: 'Compensation', icon: DollarSign },
  { id: 'interview', title: 'Interview Questions', icon: MessageSquare },
];

export default function AIJobWizard({ onComplete, onClose, company }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [jobData, setJobData] = useState({
    title: '',
    job_type: 'full-time',
    location: '',
    experience_level_required: 'mid',
    experience_years_min: 2,
    description: '',
    responsibilities: [],
    requirements: [],
    skills_required: [],
    benefits: [],
    salary_min: 50000,
    salary_max: 80000,
    salary_type: 'yearly',
    interview_questions_live: [],
    interview_questions_recorded: []
  });
  const [suggestions, setSuggestions] = useState({});
  const [newItem, setNewItem] = useState('');

  const updateJob = (field, value) => {
    setJobData(prev => ({ ...prev, [field]: value }));
  };

  const generateAISuggestions = async (type) => {
    setLoading(true);
    try {
      let prompt = '';
      let schema = {};

      switch (type) {
        case 'description':
          prompt = `Generate a compelling job description for a ${jobData.title} position at ${company?.name || 'our company'}, a ${company?.industry || 'technology'} company${company?.size ? ` with ${company.size} employees` : ''}.

Context:
- Role: ${jobData.job_type}, ${jobData.experience_level_required} level
- Location: ${jobData.location || 'flexible location'}
- Company culture: ${company?.culture_traits?.join(', ') || 'innovative and collaborative'}
${company?.mission ? `- Mission: ${company.mission}` : ''}

Write a professional, engaging description that:
1. Opens with an exciting hook about the role or company
2. Describes day-to-day responsibilities and impact
3. Highlights growth opportunities and company culture
4. Ends with a call-to-action

Make it 3-4 paragraphs, conversational yet professional.`;
          schema = { type: 'object', properties: { description: { type: 'string' } } };
          break;

        case 'responsibilities':
          prompt = `List 7-9 key day-to-day responsibilities for a ${jobData.title} position at a ${company?.industry || 'technology'} company.

Context:
- Experience level: ${jobData.experience_level_required}
- Team size: ${company?.size || 'growing team'}
- Job type: ${jobData.job_type}

Make each responsibility:
- Action-oriented (start with strong verbs)
- Specific and measurable
- Relevant to ${jobData.experience_level_required} level expectations
- Focused on impact and outcomes`;
          schema = { type: 'object', properties: { responsibilities: { type: 'array', items: { type: 'string' } } } };
          break;

        case 'requirements':
          prompt = `List 5-7 requirements for a ${jobData.title} position.
Experience level: ${jobData.experience_level_required}, minimum ${jobData.experience_years_min} years experience.
Include both technical skills and soft skills.`;
          schema = { type: 'object', properties: { requirements: { type: 'array', items: { type: 'string' } } } };
          break;

        case 'skills':
          prompt = `List 10-15 relevant skills for a ${jobData.title} position in ${company?.industry || 'technology'}.

Organize by priority:
- Experience level: ${jobData.experience_level_required}
- Must-have technical skills (core technologies)
- Important soft skills
- Nice-to-have skills

Include modern, in-demand technologies relevant to this role. Be specific (e.g., "React.js" not just "JavaScript").`;
          schema = { type: 'object', properties: { 
            must_have: { type: 'array', items: { type: 'string' } },
            nice_to_have: { type: 'array', items: { type: 'string' } }
          } };
          break;

        case 'benefits':
          prompt = `Suggest 6-8 attractive benefits and perks for a ${jobData.job_type} ${jobData.title} position at a ${company?.size || 'growing'} company.
Include both standard and creative benefits.`;
          schema = { type: 'object', properties: { benefits: { type: 'array', items: { type: 'string' } } } };
          break;

        case 'salary':
          prompt = `Suggest a competitive salary range for a ${jobData.title} position.
Experience level: ${jobData.experience_level_required}, ${jobData.experience_years_min}+ years experience.
Location: ${jobData.location || 'US average'}. Industry: ${company?.industry || 'technology'}.
Provide min and max yearly salary in USD.`;
          schema = { type: 'object', properties: { salary_min: { type: 'number' }, salary_max: { type: 'number' } } };
          break;

        case 'interview_live':
          prompt = `Generate 5 thoughtful interview questions for a live video interview with a ${jobData.title} candidate.
Experience level: ${jobData.experience_level_required}.
Include behavioral, technical, and culture-fit questions. Make them conversational.`;
          schema = { type: 'object', properties: { questions: { type: 'array', items: { type: 'string' } } } };
          break;

        case 'interview_recorded':
          prompt = `Generate 4 concise interview questions for a recorded/async video interview with a ${jobData.title} candidate.
These should be answerable in 1-2 minutes each. Focus on introduction, motivation, problem-solving, and goals.`;
          schema = { type: 'object', properties: { questions: { type: 'array', items: { type: 'string' } } } };
          break;
      }

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 30000)
      );

      const llmPromise = base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: schema
      });

      const result = await Promise.race([llmPromise, timeoutPromise]);

      setSuggestions(prev => ({ ...prev, [type]: result }));

      // Auto-apply some suggestions
      if (type === 'description' && result.description) {
        updateJob('description', result.description);
      }
      if (type === 'salary' && result.salary_min) {
        updateJob('salary_min', result.salary_min);
        updateJob('salary_max', result.salary_max);
      }

    } catch (error) {
      console.error('AI suggestion error:', error);
      alert(error.message === 'Request timeout' 
        ? 'Request took too long. Please try again.' 
        : 'Failed to generate suggestions. Please try again.');
    }
    setLoading(false);
  };

  const addItem = (field) => {
    if (!newItem.trim()) return;
    updateJob(field, [...(jobData[field] || []), newItem.trim()]);
    setNewItem('');
  };

  const removeItem = (field, index) => {
    updateJob(field, jobData[field].filter((_, i) => i !== index));
  };

  const applySuggestion = (field, items) => {
    updateJob(field, [...(jobData[field] || []), ...items]);
    setSuggestions(prev => ({ ...prev, [field]: null }));
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await onComplete(jobData);
    } catch (error) {
      console.error('Failed to complete job creation:', error);
      alert('Failed to create job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return jobData.title && jobData.job_type;
      case 1: return jobData.description;
      case 2: return jobData.skills_required.length > 0;
      case 3: return jobData.salary_min && jobData.salary_max;
      case 4: return true;
      default: return true;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <Label>Job Title *</Label>
              <Input
                value={jobData.title}
                onChange={(e) => updateJob('title', e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                className="mt-2 h-12"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Job Type *</Label>
                <Select value={jobData.job_type} onValueChange={(v) => updateJob('job_type', v)}>
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
              <div>
                <Label>Location</Label>
                <Input
                  value={jobData.location}
                  onChange={(e) => updateJob('location', e.target.value)}
                  placeholder="e.g., San Francisco, CA"
                  className="mt-2 h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Experience Level *</Label>
                <Select value={jobData.experience_level_required} onValueChange={(v) => updateJob('experience_level_required', v)}>
                  <SelectTrigger className="mt-2 h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Min. Years Experience</Label>
                <Input
                  type="number"
                  value={jobData.experience_years_min}
                  onChange={(e) => updateJob('experience_years_min', parseInt(e.target.value) || 0)}
                  className="mt-2 h-12"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Job Description *</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateAISuggestions('description')}
                disabled={loading || !jobData.title}
                className="text-pink-600"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                Generate with AI
              </Button>
            </div>
            <Textarea
              value={jobData.description}
              onChange={(e) => updateJob('description', e.target.value)}
              placeholder="Describe the role, team, and what makes this opportunity exciting..."
              rows={8}
              className="resize-none"
            />

            <div className="flex items-center justify-between mt-6">
              <Label>Responsibilities</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateAISuggestions('responsibilities')}
                disabled={loading || !jobData.title}
                className="text-pink-600"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Suggest
              </Button>
            </div>

            {suggestions.responsibilities && (
              <Card className="p-3 bg-pink-50 border-pink-200">
                <p className="text-sm font-medium text-pink-700 mb-2">AI Suggestions:</p>
                <div className="space-y-1">
                  {suggestions.responsibilities.responsibilities?.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-pink-500" />
                      <span className="flex-1">{item}</span>
                    </div>
                  ))}
                </div>
                <Button
                  size="sm"
                  className="mt-3 swipe-gradient text-white"
                  onClick={() => applySuggestion('responsibilities', suggestions.responsibilities.responsibilities)}
                >
                  Apply All
                </Button>
              </Card>
            )}

            <div className="flex gap-2">
              <Input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add a responsibility..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('responsibilities'))}
              />
              <Button onClick={() => addItem('responsibilities')} className="swipe-gradient">
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-2">
              {jobData.responsibilities.map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="flex-1 text-sm">{item}</span>
                  <button onClick={() => removeItem('responsibilities', i)} className="text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Required Skills *</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateAISuggestions('skills')}
                  disabled={loading || !jobData.title}
                  className="text-pink-600"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Suggest Skills
                </Button>
              </div>

              {suggestions.skills && (
                <Card className="p-3 bg-pink-50 border-pink-200 mb-4">
                  {suggestions.skills.must_have?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-pink-700 mb-2">Must-Have Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.skills.must_have.map((skill, i) => (
                          <Badge
                            key={i}
                            className="cursor-pointer bg-pink-600 hover:bg-pink-700 text-white"
                            onClick={() => {
                              if (!jobData.skills_required.includes(skill)) {
                                updateJob('skills_required', [...jobData.skills_required, skill]);
                              }
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" /> {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {suggestions.skills.nice_to_have?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-pink-700 mb-2">Nice-to-Have:</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.skills.nice_to_have.map((skill, i) => (
                          <Badge
                            key={i}
                            className="cursor-pointer bg-white hover:bg-pink-100 text-pink-600 border border-pink-200"
                            onClick={() => {
                              if (!jobData.skills_required.includes(skill)) {
                                updateJob('skills_required', [...jobData.skills_required, skill]);
                              }
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" /> {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}

              <div className="flex gap-2 mb-3">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add a skill..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('skills_required'))}
                />
                <Button onClick={() => addItem('skills_required')} className="swipe-gradient">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {jobData.skills_required.map((skill, i) => (
                  <Badge key={i} className="bg-gradient-to-r from-pink-100 to-orange-100 text-pink-600 pr-1">
                    {skill}
                    <button onClick={() => removeItem('skills_required', i)} className="ml-2 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Requirements</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateAISuggestions('requirements')}
                  disabled={loading || !jobData.title}
                  className="text-pink-600"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Suggest
                </Button>
              </div>

              {suggestions.requirements && (
                <Card className="p-3 bg-pink-50 border-pink-200 mb-4">
                  <div className="space-y-1">
                    {suggestions.requirements.requirements?.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-pink-500" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    className="mt-3 swipe-gradient text-white"
                    onClick={() => applySuggestion('requirements', suggestions.requirements.requirements)}
                  >
                    Apply All
                  </Button>
                </Card>
              )}

              <div className="space-y-2">
                {jobData.requirements.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <span className="flex-1 text-sm">{item}</span>
                    <button onClick={() => removeItem('requirements', i)} className="text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Salary Range</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateAISuggestions('salary')}
                  disabled={loading || !jobData.title}
                  className="text-pink-600"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lightbulb className="w-4 h-4 mr-2" />}
                  Suggest Range
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Minimum</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="number"
                      value={jobData.salary_min}
                      onChange={(e) => updateJob('salary_min', parseInt(e.target.value) || 0)}
                      className="pl-8 h-12"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Maximum</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="number"
                      value={jobData.salary_max}
                      onChange={(e) => updateJob('salary_max', parseInt(e.target.value) || 0)}
                      className="pl-8 h-12"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Type</Label>
                  <Select value={jobData.salary_type} onValueChange={(v) => updateJob('salary_type', v)}>
                    <SelectTrigger className="mt-1 h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Benefits & Perks</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateAISuggestions('benefits')}
                  disabled={loading}
                  className="text-pink-600"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Suggest
                </Button>
              </div>

              {suggestions.benefits && (
                <Card className="p-3 bg-pink-50 border-pink-200 mb-4">
                  <div className="flex flex-wrap gap-2">
                    {suggestions.benefits.benefits?.map((item, i) => (
                      <Badge
                        key={i}
                        className="cursor-pointer bg-white hover:bg-pink-100 text-pink-600 border border-pink-200"
                        onClick={() => {
                          if (!jobData.benefits.includes(item)) {
                            updateJob('benefits', [...jobData.benefits, item]);
                          }
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" /> {item}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              <div className="flex flex-wrap gap-2">
                {jobData.benefits.map((item, i) => (
                  <Badge key={i} className="bg-green-100 text-green-700 pr-1">
                    {item}
                    <button onClick={() => removeItem('benefits', i)} className="ml-2 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Label>Live Interview Questions</Label>
                  <p className="text-sm text-gray-500">For real-time video interviews</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateAISuggestions('interview_live')}
                  disabled={loading || !jobData.title}
                  className="text-pink-600"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                  Generate
                </Button>
              </div>

              {suggestions.interview_live && (
                <Card className="p-3 bg-purple-50 border-purple-200 mb-4">
                  <p className="text-sm font-medium text-purple-700 mb-2">Suggested Questions:</p>
                  <div className="space-y-2">
                    {suggestions.interview_live.questions?.map((q, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center text-xs flex-shrink-0">
                          {i + 1}
                        </span>
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    className="mt-3 bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => applySuggestion('interview_questions_live', suggestions.interview_live.questions)}
                  >
                    Apply All
                  </Button>
                </Card>
              )}

              <div className="flex gap-2 mb-3">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add a live interview question..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('interview_questions_live'))}
                />
                <Button onClick={() => addItem('interview_questions_live')} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-2">
                {jobData.interview_questions_live.map((q, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm">{q}</span>
                    <button onClick={() => removeItem('interview_questions_live', i)} className="text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Label>Recorded Interview Questions</Label>
                  <p className="text-sm text-gray-500">For async video responses</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateAISuggestions('interview_recorded')}
                  disabled={loading || !jobData.title}
                  className="text-pink-600"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                  Generate
                </Button>
              </div>

              {suggestions.interview_recorded && (
                <Card className="p-3 bg-pink-50 border-pink-200 mb-4">
                  <p className="text-sm font-medium text-pink-700 mb-2">Suggested Questions:</p>
                  <div className="space-y-2">
                    {suggestions.interview_recorded.questions?.map((q, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="w-5 h-5 rounded-full bg-pink-200 text-pink-700 flex items-center justify-center text-xs flex-shrink-0">
                          {i + 1}
                        </span>
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    className="mt-3 swipe-gradient text-white"
                    onClick={() => applySuggestion('interview_questions_recorded', suggestions.interview_recorded.questions)}
                  >
                    Apply All
                  </Button>
                </Card>
              )}

              <div className="flex gap-2 mb-3">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add a recorded interview question..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('interview_questions_recorded'))}
                />
                <Button onClick={() => addItem('interview_questions_recorded')} className="swipe-gradient">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-2">
                {jobData.interview_questions_recorded.map((q, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                    <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-sm flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm">{q}</span>
                    <button onClick={() => removeItem('interview_questions_recorded', i)} className="text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl swipe-gradient flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">AI Job Wizard</h2>
                <p className="text-sm text-gray-500">Step {currentStep + 1} of {STEPS.length}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex gap-2">
            {STEPS.map((step, i) => (
              <div
                key={step.id}
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  i <= currentStep ? 'swipe-gradient' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <div className="flex justify-between mt-3">
            {STEPS.map((step, i) => (
              <div
                key={step.id}
                className={`flex items-center gap-1 text-xs ${
                  i === currentStep ? 'text-pink-600 font-medium' : 'text-gray-400'
                }`}
              >
                <step.icon className="w-3 h-3" />
                <span className="hidden sm:inline">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-5 h-5 mr-1" /> Back
          </Button>

          {currentStep === STEPS.length - 1 ? (
            <Button
              onClick={handleComplete}
              disabled={loading}
              className="swipe-gradient text-white px-8"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Create Job
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceed()}
              className="swipe-gradient text-white"
            >
              Continue <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
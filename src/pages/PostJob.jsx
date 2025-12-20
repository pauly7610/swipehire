import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, MapPin, DollarSign, Plus, X, Eye, ArrowRight, 
  CheckCircle, Building2, Wand2, HelpCircle, Trash2, Save
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import AIJobWizard from '@/components/jobs/AIJobWizard';
import AIJobDescriptionAssistant from '@/components/jobs/AIJobDescriptionAssistant';
import JobTitleSelect from '@/components/shared/JobTitleSelect';
import LocationSelect from '@/components/shared/LocationSelect';
import IndustrySelect from '@/components/shared/IndustrySelect';

export default function PostJob() {
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAIWizard, setShowAIWizard] = useState(false);
  const [step, setStep] = useState(1);
  const [newSkill, setNewSkill] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  const [newResponsibility, setNewResponsibility] = useState('');
  const [newQuestion, setNewQuestion] = useState({ question: '', type: 'text', options: [], required: false });
  const [newOption, setNewOption] = useState('');

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
    screening_questions: [],
    industry: ''
  });

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('job_posting_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setJobData(draft.jobData || jobData);
        setStep(draft.step || 1);
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (jobData.title || jobData.description) {
      const draft = { jobData, step };
      localStorage.setItem('job_posting_draft', JSON.stringify(draft));
    }
  }, [jobData, step]);

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    const user = await base44.auth.me();
    const [companyData] = await base44.entities.Company.filter({ user_id: user.id });
    setCompany(companyData);
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

  const addQuestion = () => {
    if (newQuestion.question.trim()) {
      setJobData({
        ...jobData,
        screening_questions: [...jobData.screening_questions, { ...newQuestion, id: Date.now() }]
      });
      setNewQuestion({ question: '', type: 'text', options: [], required: false });
    }
  };

  const removeQuestion = (index) => {
    setJobData({
      ...jobData,
      screening_questions: jobData.screening_questions.filter((_, i) => i !== index)
    });
  };

  const addOptionToQuestion = () => {
    if (newOption.trim()) {
      setNewQuestion({ ...newQuestion, options: [...newQuestion.options, newOption.trim()] });
      setNewOption('');
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      await base44.entities.Job.create({
        ...jobData,
        company_id: company.id,
        salary_min: parseFloat(jobData.salary_min) || 0,
        salary_max: parseFloat(jobData.salary_max) || 0,
        is_active: true
      });
      localStorage.removeItem('job_posting_draft'); // Clear draft
      navigate(createPageUrl('ManageJobs'));
    } catch (error) {
      console.error('Failed to post job:', error);
    }
    setLoading(false);
  };

  const handleAIWizardComplete = async (wizardJobData) => {
    try {
      await base44.entities.Job.create({
        ...wizardJobData,
        company_id: company.id,
        is_active: true
      });
      localStorage.removeItem('job_posting_draft'); // Clear draft
      setShowAIWizard(false);
      navigate(createPageUrl('ManageJobs'));
    } catch (error) {
      console.error('Failed to create job:', error);
      alert('Failed to create job. Please try again.');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <Label className="text-gray-700 dark:text-gray-300 text-base">Industry *</Label>
              <div className="mt-2">
                <IndustrySelect
                  value={jobData.industry}
                  onChange={(v) => setJobData({ ...jobData, industry: v, title: '' })}
                  placeholder="Select industry first"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-700 dark:text-gray-300 text-base">Job Title *</Label>
              <div className="mt-2">
                <Input
                  value={jobData.title}
                  onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
                  placeholder="e.g. Senior Software Engineer"
                  className="h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 dark:text-gray-300 text-base">Location</Label>
                <div className="mt-2">
                  <LocationSelect
                    value={jobData.location}
                    onChange={(v) => setJobData({ ...jobData, location: v })}
                    placeholder="Select location"
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-700 dark:text-gray-300 text-base">Job Type</Label>
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

            <div>
              <Label className="text-gray-700 dark:text-gray-300 text-base">Salary Range</Label>
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
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* AI Assistant */}
            <AIJobDescriptionAssistant
              jobData={jobData}
              onApply={(generated) => {
                setJobData({
                  ...jobData,
                  description: generated.description || jobData.description,
                  responsibilities: generated.responsibilities || jobData.responsibilities,
                  requirements: generated.requirements || jobData.requirements,
                  benefits: generated.benefits || jobData.benefits,
                  skills_required: [...new Set([...jobData.skills_required, ...(generated.suggested_keywords || [])])]
                });
              }}
            />

            <div>
              <Label className="text-gray-700 dark:text-gray-300 text-base">Job Description *</Label>
              <Textarea
                value={jobData.description}
                onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
                placeholder="Describe the role, what the candidate will do, and what makes this opportunity exciting..."
                className="mt-2 min-h-[150px]"
              />
            </div>

            <div>
              <Label className="text-gray-700 dark:text-gray-300 text-base">Responsibilities</Label>
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
                  <li key={i} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                    {r}
                    <button onClick={() => removeFromArray('responsibilities', r)} className="ml-auto text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <Label className="text-gray-700 dark:text-gray-300 text-base">Required Skills</Label>
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

            <div>
              <Label className="text-gray-700 dark:text-gray-300 text-base">Benefits</Label>
              
              {/* Quick benefit options */}
              <div className="flex flex-wrap gap-2 mt-2 mb-3">
                {['Health Insurance', 'Dental Insurance', 'Vision Insurance', '401(k)', 'Paid Time Off', 'Remote Work', 'Flexible Hours', 'Stock Options', 'Gym Membership', 'Professional Development', 'Parental Leave', 'Free Lunch'].map((benefit) => (
                  <Badge
                    key={benefit}
                    className={`cursor-pointer transition-all ${
                      jobData.benefits.includes(benefit)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => {
                      if (jobData.benefits.includes(benefit)) {
                        removeFromArray('benefits', benefit);
                      } else {
                        addToArray('benefits', benefit, () => {});
                      }
                    }}
                  >
                    {jobData.benefits.includes(benefit) && <CheckCircle className="w-3 h-3 mr-1" />}
                    {benefit}
                  </Badge>
                ))}
              </div>

              {/* Custom benefit input */}
              <div className="flex gap-2">
                <Input
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  placeholder="Add a custom benefit"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('benefits', newBenefit, setNewBenefit))}
                />
                <Button onClick={() => addToArray('benefits', newBenefit, setNewBenefit)} className="swipe-gradient">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Selected benefits */}
              {jobData.benefits.length > 0 && (
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
              )}
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <Label className="text-gray-700 dark:text-gray-300 text-base flex items-center gap-2">
                <HelpCircle className="w-4 h-4" /> Screening Questions
              </Label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Add custom questions for candidates to answer</p>
              
              <div className="space-y-4 bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                <Input
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                  placeholder="Enter your question"
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={newQuestion.type}
                    onValueChange={(v) => setNewQuestion({ ...newQuestion, type: v, options: [] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Question type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text Answer</SelectItem>
                      <SelectItem value="yes_no">Yes/No</SelectItem>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newQuestion.required}
                      onCheckedChange={(v) => setNewQuestion({ ...newQuestion, required: v })}
                    />
                    <Label className="text-sm">Required</Label>
                  </div>
                </div>

                {newQuestion.type === 'multiple_choice' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        placeholder="Add an option"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOptionToQuestion())}
                      />
                      <Button onClick={addOptionToQuestion} size="sm" variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newQuestion.options.map((opt, i) => (
                        <Badge key={i} variant="secondary">
                          {opt}
                          <button onClick={() => setNewQuestion({ 
                            ...newQuestion, 
                            options: newQuestion.options.filter((_, idx) => idx !== i) 
                          })} className="ml-1">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button onClick={addQuestion} className="w-full swipe-gradient" disabled={!newQuestion.question.trim()}>
                  <Plus className="w-4 h-4 mr-2" /> Add Question
                </Button>
              </div>

              {/* Question List */}
              {jobData.screening_questions.length > 0 && (
                <div className="mt-6 space-y-3">
                  <Label className="text-gray-700 dark:text-gray-300">Added Questions ({jobData.screening_questions.length})</Label>
                  {jobData.screening_questions.map((q, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-lg p-3">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{q.question}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {q.type === 'text' ? 'Text' : q.type === 'yes_no' ? 'Yes/No' : 'Multiple Choice'}
                          </Badge>
                          {q.required && <Badge className="text-xs bg-red-100 text-red-600">Required</Badge>}
                        </div>
                        {q.options?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {q.options.map((opt, oi) => (
                              <span key={oi} className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded">{opt}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={() => removeQuestion(i)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4 md:p-8">
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

      {showAIWizard && (
        <AIJobWizard
          company={company}
          onComplete={handleAIWizardComplete}
          onClose={() => setShowAIWizard(false)}
        />
      )}

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Post a New Job</h1>
              <p className="text-gray-500 dark:text-gray-400">Find the perfect candidate for your team</p>
            </div>
            {(jobData.title || jobData.description) && (
              <Badge className="bg-blue-100 text-blue-700">
                <Save className="w-3 h-3 mr-1" /> Draft Auto-Saved
              </Badge>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex-1">
              <div className={`h-2 rounded-full ${step >= s ? 'swipe-gradient' : 'bg-gray-200 dark:bg-slate-700'}`} />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {s === 1 ? 'Basic Info' : s === 2 ? 'Description' : s === 3 ? 'Skills & Benefits' : 'Questions'}
              </p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Form */}
          <Card className="md:col-span-3 border-0 shadow-lg dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="pt-6">
              {renderStep()}
            </CardContent>
          </Card>

          {/* Preview */}
          <div className="md:col-span-2 space-y-4">
            <Card className="border-0 shadow-lg sticky top-8 dark:bg-slate-900 dark:border-slate-800">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    {company?.logo_url ? (
                      <img src={company.logo_url} alt="" className="w-12 h-12 rounded-xl" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl swipe-gradient flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{jobData.title || 'Job Title'}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{company?.name}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-sm">
                    {jobData.location && (
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" /> {jobData.location}
                      </span>
                    )}
                    {jobData.salary_max && (
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <DollarSign className="w-4 h-4" />
                        ${jobData.salary_min || 0}k - ${jobData.salary_max}k
                      </span>
                    )}
                  </div>

                  {jobData.skills_required.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {jobData.skills_required.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={() => setShowAIWizard(true)}
              className="w-full swipe-gradient text-white shadow-lg shadow-pink-500/25"
            >
              <Wand2 className="w-5 h-5 mr-2" />
              Use AI Wizard
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
          >
            Back
          </Button>

          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              className="swipe-gradient text-white"
              disabled={step === 1 && !jobData.title}
            >
              Continue <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handlePublish}
              disabled={loading || !jobData.title || !jobData.description}
              className="swipe-gradient text-white shadow-lg shadow-pink-500/25"
            >
              {loading ? 'Publishing...' : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" /> Publish Job
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
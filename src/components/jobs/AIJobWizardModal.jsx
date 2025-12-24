import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, Edit2, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SECTION_OPTIONS = [
  { id: 'overview', label: 'Role Overview', default: true },
  { id: 'responsibilities', label: 'Key Responsibilities', default: true },
  { id: 'requirements', label: 'Requirements', default: true },
  { id: 'qualifications', label: 'Preferred Qualifications', default: true },
  { id: 'benefits', label: 'Benefits & Perks', default: true },
  { id: 'culture', label: 'Company Culture', default: false },
  { id: 'growth', label: 'Growth Opportunities', default: false },
];

export default function AIJobWizardModal({ open, onOpenChange, jobData, onComplete }) {
  const [step, setStep] = useState(1); // 1: opt-in, 2: customize, 3: preview
  const [generating, setGenerating] = useState(false);
  const [selectedSections, setSelectedSections] = useState(
    SECTION_OPTIONS.filter(s => s.default).map(s => s.id)
  );
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [editableDescription, setEditableDescription] = useState('');

  const handleGenerate = async () => {
    setGenerating(true);
    setStep(3);

    try {
      const prompt = `You are an expert job description writer. Create a compelling job description for the following role:

Title: ${jobData.title}
Company: ${jobData.companyName || 'A growing company'}
Industry: ${jobData.industry || 'Technology'}
Location: ${jobData.location || 'Remote'}
Experience Level: ${jobData.experienceLevel || 'Mid-level'}
Employment Type: ${jobData.jobType || 'Full-time'}
Salary Range: ${jobData.salaryMin && jobData.salaryMax ? `$${jobData.salaryMin}k - $${jobData.salaryMax}k` : 'Competitive'}

Selected Skills: ${jobData.skills?.join(', ') || 'Not specified'}

Include the following sections in this order:
${selectedSections.map(s => SECTION_OPTIONS.find(opt => opt.id === s)?.label).join('\n')}

Requirements:
- Professional, engaging tone
- Use bullet points for readability
- Be specific and avoid generic language
- Highlight what makes this role unique
- Keep it concise (300-500 words total)
- Use clear section headers (##)
- Do NOT include salary, location, or employment type in the description (they're displayed separately)

Format as markdown with clear section headers.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      setGeneratedDescription(response);
      setEditableDescription(response);
    } catch (error) {
      console.error('Failed to generate description:', error);
      setGeneratedDescription('Failed to generate description. Please try again.');
      setEditableDescription('');
    }

    setGenerating(false);
  };

  const toggleSection = (sectionId) => {
    if (selectedSections.includes(sectionId)) {
      setSelectedSections(selectedSections.filter(s => s !== sectionId));
    } else {
      setSelectedSections([...selectedSections, sectionId]);
    }
  };

  const handleUseDescription = () => {
    onComplete(editableDescription);
    onOpenChange(false);
    resetWizard();
  };

  const resetWizard = () => {
    setStep(1);
    setGeneratedDescription('');
    setEditableDescription('');
    setSelectedSections(SECTION_OPTIONS.filter(s => s.default).map(s => s.id));
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetWizard();
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl dark:text-white">AI Job Description Wizard</DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                {step === 1 && 'Generate a professional job description instantly'}
                {step === 2 && 'Customize what to include'}
                {step === 3 && 'Review and edit your description'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <AnimatePresence mode="wait">
            {/* Step 1: Opt-in */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center py-8">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-pink-100 to-orange-100 dark:from-pink-900/30 dark:to-orange-900/30 flex items-center justify-center mb-4">
                    <Sparkles className="w-10 h-10 text-pink-500 dark:text-pink-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    Let AI write your job description
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    Our AI will create a professional, compelling job description based on your role details in seconds.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">What we'll generate:</h4>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Engaging role overview tailored to your title and industry</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Clear responsibilities and requirements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Benefits and growth opportunities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Fully editable before posting</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}

            {/* Step 2: Customize Sections */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Select sections to include
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Choose what you want in your job description
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SECTION_OPTIONS.map(section => (
                    <label
                      key={section.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedSections.includes(section.id)
                          ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 dark:border-pink-600'
                          : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Checkbox
                        checked={selectedSections.includes(section.id)}
                        onCheckedChange={() => toggleSection(section.id)}
                        className="border-2"
                      />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {section.label}
                      </span>
                      {section.default && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          Recommended
                        </Badge>
                      )}
                    </label>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Preview & Edit */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {generating ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 text-pink-500 animate-spin" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Generating your job description...
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This will take just a few seconds
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Review & Edit
                      </h3>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <Edit2 className="w-3 h-3 mr-1" />
                        Editable
                      </Badge>
                    </div>

                    <Textarea
                      value={editableDescription}
                      onChange={(e) => setEditableDescription(e.target.value)}
                      className="min-h-[400px] font-mono text-sm leading-relaxed resize-none dark:bg-slate-800 dark:border-slate-700"
                      placeholder="Your generated description will appear here..."
                    />

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                      <p className="text-sm text-blue-900 dark:text-blue-300">
                        <strong>Tip:</strong> Edit the description above to perfectly match your needs before using it.
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t dark:border-slate-700 flex gap-3 flex-shrink-0 bg-gray-50 dark:bg-slate-800/50">
          {step === 1 && (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-11 dark:border-slate-600 dark:text-gray-300"
              >
                Skip, I'll write it myself
              </Button>
              <Button
                onClick={() => setStep(2)}
                className="flex-1 h-11 swipe-gradient text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Use AI Wizard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 h-11 dark:border-slate-600 dark:text-gray-300"
              >
                Back
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={selectedSections.length === 0}
                className="flex-1 h-11 swipe-gradient text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Description
              </Button>
            </>
          )}

          {step === 3 && !generating && (
            <>
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1 h-11 dark:border-slate-600 dark:text-gray-300"
              >
                Regenerate
              </Button>
              <Button
                onClick={handleUseDescription}
                disabled={!editableDescription.trim()}
                className="flex-1 h-11 swipe-gradient text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Use This Description
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
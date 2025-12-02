import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, FileText, Sparkles, Loader2, CheckCircle, 
  AlertCircle, Briefcase, GraduationCap, Code, Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResumeParser({ candidate, onDataExtracted }) {
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState(null);
  const [resumeUrl, setResumeUrl] = useState(candidate?.resume_url || null);
  const [error, setError] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    setProgress(10);

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setResumeUrl(file_url);
      setProgress(30);
      setUploading(false);

      // Parse resume with AI
      setParsing(true);
      setProgress(50);

      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: {
            full_name: { type: 'string' },
            headline: { type: 'string', description: 'Professional title/headline' },
            bio: { type: 'string', description: 'Brief professional summary (max 250 chars)' },
            skills: { type: 'array', items: { type: 'string' } },
            experience: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  company: { type: 'string' },
                  start_date: { type: 'string' },
                  end_date: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            },
            education: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  degree: { type: 'string' },
                  institution: { type: 'string' },
                  year: { type: 'string' }
                }
              }
            },
            experience_years: { type: 'number' },
            location: { type: 'string' }
          }
        }
      });

      setProgress(80);

      if (result.status === 'error') {
        throw new Error(result.details);
      }

      // Get AI insights about the resume
      const insights = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this extracted resume data and provide:
1. A list of 3 key strengths based on the resume
2. A list of 2-3 areas where the candidate should elaborate more in their profile

Resume data: ${JSON.stringify(result.output)}`,
        response_json_schema: {
          type: 'object',
          properties: {
            strengths: { type: 'array', items: { type: 'string' } },
            suggestions: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      setProgress(100);
      
      const finalData = {
        ...result.output,
        resume_url: file_url,
        insights
      };
      
      setExtractedData(finalData);
      setParsing(false);

    } catch (err) {
      console.error('Resume parsing failed:', err);
      setError('Failed to parse resume. Please try again or upload a different file.');
      setUploading(false);
      setParsing(false);
    }
  };

  const applyExtractedData = () => {
    if (!extractedData) return;
    
    const profileData = {
      headline: extractedData.headline,
      bio: extractedData.bio?.slice(0, 250),
      skills: extractedData.skills || [],
      experience: extractedData.experience || [],
      experience_years: extractedData.experience_years,
      location: extractedData.location,
      resume_url: extractedData.resume_url
    };

    onDataExtracted(profileData);
    setExtractedData(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-pink-500" />
          Resume
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Current Resume */}
        {resumeUrl && !extractedData && (
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-green-700">Resume uploaded</span>
            <a 
              href={resumeUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-auto text-sm text-pink-600 hover:underline"
            >
              View Resume
            </a>
          </div>
        )}

        {/* Upload Area */}
        {!uploading && !parsing && !extractedData && (
          <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {resumeUrl ? 'Update Your Resume' : 'Upload Your Resume'}
            </h3>
            <p className="text-gray-500 mb-4 text-sm">
              AI will extract your skills, experience, and more
            </p>
            <label>
              <input 
                type="file" 
                accept=".pdf,.doc,.docx" 
                className="hidden" 
                onChange={handleFileUpload}
              />
              <Button className="swipe-gradient text-white cursor-pointer" asChild>
                <span>
                  <Upload className="w-5 h-5 mr-2" /> 
                  {resumeUrl ? 'Upload New Resume' : 'Upload Resume'}
                </span>
              </Button>
            </label>
            <p className="text-xs text-gray-400 mt-3">PDF format recommended</p>
          </div>
        )}

        {/* Progress */}
        {(uploading || parsing) && (
          <div className="py-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
              <span className="text-gray-600">
                {uploading ? 'Uploading resume...' : 'AI is analyzing your resume...'}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-700 mb-4">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Extracted Data Preview */}
        <AnimatePresence>
          {extractedData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-green-600 mb-4">
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">Resume parsed successfully!</span>
              </div>

              {/* Extracted Skills */}
              {extractedData.skills?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                    <Code className="w-4 h-4 text-pink-500" />
                    Skills Found ({extractedData.skills.length})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {extractedData.skills.slice(0, 10).map((skill, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                    {extractedData.skills.length > 10 && (
                      <Badge variant="secondary" className="text-xs">+{extractedData.skills.length - 10} more</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Extracted Experience */}
              {extractedData.experience?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                    <Briefcase className="w-4 h-4 text-pink-500" />
                    Experience Found ({extractedData.experience.length} positions)
                  </h4>
                  <div className="space-y-2">
                    {extractedData.experience.slice(0, 3).map((exp, i) => (
                      <div key={i} className="text-sm p-2 bg-gray-50 rounded-lg">
                        <span className="font-medium">{exp.title}</span>
                        <span className="text-gray-500"> at {exp.company}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Insights */}
              {extractedData.insights && (
                <div className="p-4 bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    AI Insights
                  </h4>
                  
                  {extractedData.insights.strengths?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-green-600 mb-1">Key Strengths:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {extractedData.insights.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {extractedData.insights.suggestions?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-amber-600 mb-1">Consider Adding:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {extractedData.insights.suggestions.map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <AlertCircle className="w-3 h-3 text-amber-500 mt-1 flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={applyExtractedData}
                  className="flex-1 swipe-gradient text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Apply to Profile
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setExtractedData(null)}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>
    </Card>
  );
}
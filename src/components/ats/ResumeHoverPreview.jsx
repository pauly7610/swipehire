import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, AlertCircle, Briefcase, GraduationCap, Award } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ResumeHoverPreview({ candidate, resumeUrl, position = 'right' }) {
  const [resumeText, setResumeText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadResumePreview = async () => {
      if (!resumeUrl) {
        setError('No resume uploaded');
        setLoading(false);
        return;
      }

      // Check if we have cached parsed text
      if (candidate?.resume_parsed_text) {
        setResumeText(candidate.resume_parsed_text);
        setLoading(false);
        return;
      }

      // Try to parse the resume
      try {
        const response = await fetch(resumeUrl);
        const blob = await response.blob();
        const file = new File([blob], 'resume.pdf', { type: blob.type });

        // Use AI to extract text
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        
        const extracted = await base44.integrations.Core.InvokeLLM({
          prompt: `Extract all text content from this resume. Return the full text as-is, preserving structure. Include all sections: summary, experience, education, skills, certifications, etc.`,
          file_urls: [file_url],
          response_json_schema: {
            type: 'object',
            properties: {
              full_text: { type: 'string' },
              summary: { type: 'string' },
              skills: { type: 'array', items: { type: 'string' } },
              experience_highlights: { type: 'array', items: { type: 'string' } },
              education_highlights: { type: 'array', items: { type: 'string' } }
            }
          }
        });

        if (mounted && extracted?.full_text) {
          setResumeText(extracted);
          
          // Cache the parsed text on candidate record
          await base44.entities.Candidate.update(candidate.id, {
            resume_parsed_text: extracted.full_text,
            resume_parsed_metadata: JSON.stringify({
              skills: extracted.skills,
              summary: extracted.summary,
              experience_highlights: extracted.experience_highlights,
              education_highlights: extracted.education_highlights,
              parsed_at: new Date().toISOString()
            })
          });
        }
      } catch (err) {
        console.error('Resume parsing error:', err);
        if (mounted) {
          setError('Failed to load resume preview');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadResumePreview();

    return () => {
      mounted = false;
    };
  }, [resumeUrl, candidate]);

  if (loading) {
    return (
      <Card className={`absolute ${position === 'right' ? 'left-full ml-2' : 'right-full mr-2'} top-0 w-96 shadow-2xl border-2 border-pink-200 dark:border-pink-900/50 z-50 pointer-events-none dark:bg-slate-900`}>
        <CardContent className="p-6 text-center">
          <Loader2 className="w-8 h-8 mx-auto text-pink-500 animate-spin mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading resume preview...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !resumeText) {
    return (
      <Card className={`absolute ${position === 'right' ? 'left-full ml-2' : 'right-full mr-2'} top-0 w-96 shadow-2xl border-2 border-gray-200 dark:border-slate-700 z-50 pointer-events-none dark:bg-slate-900`}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{error || 'No resume available'}</p>
        </CardContent>
      </Card>
    );
  }

  const parsed = typeof resumeText === 'string' ? { full_text: resumeText } : resumeText;

  return (
    <Card className={`absolute ${position === 'right' ? 'left-full ml-2' : 'right-full mr-2'} top-0 w-[32rem] max-h-[600px] overflow-y-auto shadow-2xl border-2 border-pink-200 dark:border-pink-900/50 z-50 pointer-events-none dark:bg-slate-900 dark:text-white`}>
      <CardHeader className="border-b dark:border-slate-700 bg-gradient-to-r from-pink-50 to-orange-50 dark:from-pink-950/20 dark:to-orange-950/20 sticky top-0 z-10">
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <FileText className="w-5 h-5 text-pink-500" />
          Resume Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Summary */}
        {parsed.summary && (
          <div className="pb-3 border-b dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">Summary</h4>
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-4">{parsed.summary}</p>
          </div>
        )}

        {/* Skills */}
        {parsed.skills?.length > 0 && (
          <div className="pb-3 border-b dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Award className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">Skills</h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {parsed.skills.slice(0, 15).map((skill, i) => (
                <Badge key={i} variant="secondary" className="text-xs dark:bg-slate-800 dark:text-gray-300">
                  {skill}
                </Badge>
              ))}
              {parsed.skills.length > 15 && (
                <Badge variant="outline" className="text-xs dark:border-slate-700 dark:text-gray-400">
                  +{parsed.skills.length - 15} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Experience Highlights */}
        {parsed.experience_highlights?.length > 0 && (
          <div className="pb-3 border-b dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Briefcase className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">Experience</h4>
            </div>
            <div className="space-y-2">
              {parsed.experience_highlights.slice(0, 3).map((exp, i) => (
                <p key={i} className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">• {exp}</p>
              ))}
            </div>
          </div>
        )}

        {/* Education Highlights */}
        {parsed.education_highlights?.length > 0 && (
          <div className="pb-3 border-b dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <GraduationCap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">Education</h4>
            </div>
            <div className="space-y-1">
              {parsed.education_highlights.slice(0, 2).map((edu, i) => (
                <p key={i} className="text-xs text-gray-700 dark:text-gray-300">• {edu}</p>
              ))}
            </div>
          </div>
        )}

        {/* Full Text Preview */}
        <div>
          <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Full Text Preview</h4>
          <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3 max-h-48 overflow-y-auto">
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">
              {parsed.full_text?.slice(0, 1200)}
              {parsed.full_text?.length > 1200 && '...'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 text-center">
          <a 
            href={resumeUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-pink-500 dark:text-pink-400 hover:text-pink-600 dark:hover:text-pink-300 font-medium pointer-events-auto cursor-pointer"
          >
            Open full resume →
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
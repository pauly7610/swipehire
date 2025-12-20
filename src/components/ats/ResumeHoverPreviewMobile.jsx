import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, AlertCircle, Briefcase, GraduationCap, Award, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ResumeHoverPreviewMobile({ open, onOpenChange, candidate, resumeUrl, parsedText }) {
  if (!resumeUrl) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[60vh]">
          <SheetHeader>
            <SheetTitle>Resume Preview</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center h-full text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No resume uploaded</p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const parsed = typeof parsedText === 'string' ? { full_text: parsedText } : parsedText;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto dark:bg-slate-900">
        <SheetHeader className="border-b pb-4 dark:border-slate-700">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-pink-500" />
            Resume Preview
          </SheetTitle>
        </SheetHeader>

        <div className="py-4 space-y-4">
          {!parsed ? (
            <div className="text-center py-8">
              <Loader2 className="w-10 h-10 mx-auto text-pink-500 animate-spin mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading resume...</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              {parsed.summary && (
                <div className="pb-4 border-b dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Summary</h4>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{parsed.summary}</p>
                </div>
              )}

              {/* Skills */}
              {parsed.skills?.length > 0 && (
                <div className="pb-4 border-b dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Skills</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {parsed.skills.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="dark:bg-slate-800 dark:text-gray-300">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {parsed.experience_highlights?.length > 0 && (
                <div className="pb-4 border-b dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Experience</h4>
                  </div>
                  <div className="space-y-2">
                    {parsed.experience_highlights.map((exp, i) => (
                      <p key={i} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">• {exp}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {parsed.education_highlights?.length > 0 && (
                <div className="pb-4 border-b dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Education</h4>
                  </div>
                  <div className="space-y-1">
                    {parsed.education_highlights.map((edu, i) => (
                      <p key={i} className="text-sm text-gray-700 dark:text-gray-300">• {edu}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Text */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Full Text</h4>
                <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">
                    {parsed.full_text?.slice(0, 2000)}
                    {parsed.full_text?.length > 2000 && '\n\n... (see full resume for more)'}
                  </p>
                </div>
              </div>

              {/* Open Full Resume */}
              <div className="pt-4">
                <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full swipe-gradient text-white">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Full Resume
                  </Button>
                </a>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
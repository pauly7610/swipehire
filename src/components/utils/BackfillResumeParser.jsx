import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Backfill Resume Parser - Parses all historical resumes
 * Admin/System tool to index existing resumes for Boolean search
 */
export default function BackfillResumeParser({ onComplete }) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState({ success: 0, failed: 0, skipped: 0 });
  const [currentCandidate, setCurrentCandidate] = useState(null);
  const [completed, setCompleted] = useState(false);

  const startBackfill = async () => {
    setRunning(true);
    setCompleted(false);
    setResults({ success: 0, failed: 0, skipped: 0 });

    try {
      // Get all candidates with resumes
      const allCandidates = await base44.entities.Candidate.list();
      const candidatesWithResumes = allCandidates.filter(c => c.resume_url);
      const unparsedCandidates = candidatesWithResumes.filter(c => !c.resume_parsed_text);

      console.log(`[BackfillResumeParser] Found ${unparsedCandidates.length} resumes to parse (${candidatesWithResumes.length - unparsedCandidates.length} already parsed)`);

      setProgress({ current: 0, total: unparsedCandidates.length });

      for (let i = 0; i < unparsedCandidates.length; i++) {
        const candidate = unparsedCandidates[i];
        setCurrentCandidate(candidate);
        setProgress({ current: i + 1, total: unparsedCandidates.length });

        try {
          // Fetch resume
          const response = await fetch(candidate.resume_url);
          const blob = await response.blob();
          const file = new File([blob], 'resume.pdf', { type: blob.type });

          // Upload for AI processing
          const { file_url } = await base44.integrations.Core.UploadFile({ file });

          // Extract text using AI
          const extracted = await base44.integrations.Core.InvokeLLM({
            prompt: `Extract all text and structured data from this resume. Return comprehensive content for search indexing.`,
            file_urls: [file_url],
            response_json_schema: {
              type: 'object',
              properties: {
                full_text: { type: 'string' },
                summary: { type: 'string' },
                skills: { type: 'array', items: { type: 'string' } },
                experience_highlights: { type: 'array', items: { type: 'string' } },
                education_highlights: { type: 'array', items: { type: 'string' } }
              },
              required: ['full_text']
            }
          });

          if (extracted?.full_text) {
            // Save to database
            await base44.entities.Candidate.update(candidate.id, {
              resume_parsed_text: extracted.full_text,
              resume_parsed_metadata: JSON.stringify({
                skills: extracted.skills || [],
                summary: extracted.summary || '',
                experience_highlights: extracted.experience_highlights || [],
                education_highlights: extracted.education_highlights || [],
                parsed_at: new Date().toISOString()
              })
            });

            setResults(prev => ({ ...prev, success: prev.success + 1 }));
            console.log(`✅ Parsed resume ${i + 1}/${unparsedCandidates.length}`);
          } else {
            setResults(prev => ({ ...prev, failed: prev.failed + 1 }));
          }
        } catch (error) {
          console.error(`Failed to parse resume for candidate ${candidate.id}:`, error);
          setResults(prev => ({ ...prev, failed: prev.failed + 1 }));
        }

        // Rate limit: wait 2 seconds between requests
        if (i < unparsedCandidates.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      setCompleted(true);
      if (onComplete) onComplete(results);
    } catch (error) {
      console.error('Backfill failed:', error);
    }

    setRunning(false);
    setCurrentCandidate(null);
  };

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">Resume Indexing Tool</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Parse all historical resumes to enable Boolean search inside resume content
            </p>

            {running && (
              <div className="mb-4 p-4 bg-white dark:bg-slate-900 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Progress: {progress.current}/{progress.total}</span>
                  <span className="text-gray-500 dark:text-gray-400">{Math.round((progress.current / progress.total) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
                {currentCandidate && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Parsing: {currentCandidate.headline || 'Candidate'}
                  </p>
                )}
              </div>
            )}

            {completed && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Backfill Complete!
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <p>✅ Successfully parsed: {results.success}</p>
                  <p>❌ Failed: {results.failed}</p>
                  <p>⏭️ Already indexed: {results.skipped}</p>
                </div>
              </div>
            )}

            <Button 
              onClick={startBackfill}
              disabled={running}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {running ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Parsing Resumes...
                </>
              ) : completed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Run Again
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Start Resume Backfill
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              Note: This will parse all resumes that haven't been indexed yet. Process runs at 2-second intervals to avoid rate limits.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
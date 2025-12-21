import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Background Resume Parser - Auto-parses resumes on upload
 * Runs in background without blocking UI
 */
export default function ResumeAutoParser({ candidate, resumeUrl, onParsed }) {
  useEffect(() => {
    let mounted = true;

    const parseResume = async () => {
      // Skip if already parsed or no resume
      if (!resumeUrl || candidate?.resume_parsed_text) {
        return;
      }

      try {
        console.log('[ResumeAutoParser] Starting parse for candidate:', candidate.id);
        
        // Fetch the resume file
        const response = await fetch(resumeUrl);
        const blob = await response.blob();
        const file = new File([blob], 'resume.pdf', { type: blob.type });

        // Upload to get a stable URL for AI processing
        const { file_url } = await base44.integrations.Core.UploadFile({ file });

        // Extract structured data using AI
        const extracted = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a resume parsing specialist. Extract ALL text and structured data from this resume. Be thorough and complete.
          
          Return:
          1. full_text: Complete text content preserving structure
          2. summary: Professional summary or objective (if present)
          3. skills: Array of all technical and soft skills mentioned
          4. experience_highlights: Array of key achievements and roles (max 10 most impressive)
          5. education_highlights: Array of degrees and certifications (format: "Degree in Major, University, Year")
          
          Be comprehensive - this data will be used for Boolean search and matching.`,
          file_urls: [file_url],
          response_json_schema: {
            type: 'object',
            properties: {
              full_text: { type: 'string' },
              summary: { type: 'string' },
              skills: { 
                type: 'array', 
                items: { type: 'string' }
              },
              experience_highlights: { 
                type: 'array', 
                items: { type: 'string' }
              },
              education_highlights: { 
                type: 'array', 
                items: { type: 'string' }
              }
            },
            required: ['full_text']
          }
        });

        if (!mounted || !extracted?.full_text) {
          console.warn('[ResumeAutoParser] No text extracted or component unmounted');
          return;
        }

        console.log('[ResumeAutoParser] Successfully parsed resume');

        // Save parsed data to candidate record
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

        if (mounted && onParsed) {
          onParsed(extracted);
        }
      } catch (error) {
        console.error('[ResumeAutoParser] Parse failed:', error);
        // Silent failure - don't block user experience
      }
    };

    parseResume();

    return () => {
      mounted = false;
    };
  }, [resumeUrl, candidate]);

  // This component doesn't render anything
  return null;
}
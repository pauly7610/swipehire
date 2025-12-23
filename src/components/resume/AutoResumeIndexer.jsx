import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Automatically triggers resume indexing when resume is uploaded
 * Place this component in pages where resumes can be uploaded
 */
export default function AutoResumeIndexer({ candidate, onIndexComplete, onIndexError }) {
  useEffect(() => {
    const indexResume = async () => {
      // Only index if:
      // 1. Candidate has a resume
      // 2. Resume hasn't been indexed yet OR index failed
      if (!candidate?.id || !candidate?.resume_url) {
        return;
      }

      const needsIndexing = 
        !candidate.index_status || 
        candidate.index_status === 'failed' ||
        (candidate.resume_url && !candidate.resume_normalized_text);

      if (!needsIndexing) {
        return;
      }

      console.log('[AutoResumeIndexer] Triggering index for candidate:', candidate.id);

      try {
        const response = await base44.functions.invoke('indexResume', {
          candidate_id: candidate.id,
          resume_url: candidate.resume_url
        });

        if (response.data.success) {
          console.log('[AutoResumeIndexer] Index successful');
          onIndexComplete && onIndexComplete(response.data);
        } else {
          console.error('[AutoResumeIndexer] Index failed:', response.data.error);
          onIndexError && onIndexError(response.data.error);
        }
      } catch (error) {
        console.error('[AutoResumeIndexer] Index error:', error);
        onIndexError && onIndexError(error.message);
      }
    };

    indexResume();
  }, [candidate?.id, candidate?.resume_url]);

  return null; // This is a utility component with no UI
}
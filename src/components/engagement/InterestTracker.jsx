import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Utility to track interest signals
export async function trackInterestSignal(userId, candidateId, jobId, signalType, metadata = {}) {
  try {
    // Calculate decay date (signals become less relevant over time)
    const decayDate = new Date();
    decayDate.setDate(decayDate.getDate() + 30); // 30 day relevance window

    // Set weight based on signal type
    const weights = {
      view: 1,
      click: 2,
      save: 5,
      dwell: 3,
      swipe_right: 10,
      category_interest: 2
    };

    await base44.entities.InterestSignal.create({
      user_id: userId,
      candidate_id: candidateId,
      job_id: jobId,
      signal_type: signalType,
      weight: weights[signalType] || 1,
      decay_date: decayDate.toISOString(),
      metadata
    });
  } catch (error) {
    console.error('Failed to track interest signal:', error);
  }
}

// Hook to track job view time (dwell)
export function useJobDwellTracking(userId, candidateId, jobId) {
  useEffect(() => {
    if (!userId || !candidateId || !jobId) return;

    const startTime = Date.now();

    return () => {
      const dwellTime = Date.now() - startTime;
      
      // Track if viewed for more than 5 seconds
      if (dwellTime > 5000) {
        trackInterestSignal(userId, candidateId, jobId, 'dwell', {
          dwell_time_ms: dwellTime
        });
      }
    };
  }, [userId, candidateId, jobId]);
}

export default { trackInterestSignal, useJobDwellTracking };
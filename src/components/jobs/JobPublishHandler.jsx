import React, { useEffect } from 'react';
import { sendJobPostingAlert } from '@/components/email/EmailAutomation';

/**
 * Component to handle job publishing events
 * Triggers automated email alerts when jobs are published
 * Place this in job creation/edit flows
 */
export default function JobPublishHandler({ jobId, isActive, prevActive }) {
  useEffect(() => {
    // Trigger email alerts when job becomes active
    if (isActive && !prevActive && jobId) {
      sendJobPostingAlert(jobId).catch(err => {
        console.error('Failed to send job alerts:', err);
      });
    }
  }, [jobId, isActive, prevActive]);

  return null;
}

/**
 * Utility function to manually trigger job alerts
 * Use this after creating/publishing a job
 */
export async function triggerJobAlerts(jobId) {
  try {
    const count = await sendJobPostingAlert(jobId);
    return { success: true, count };
  } catch (error) {
    console.error('Failed to trigger job alerts:', error);
    return { success: false, error: error.message };
  }
}
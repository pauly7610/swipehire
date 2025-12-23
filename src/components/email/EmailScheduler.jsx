import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { scheduleDigestEmails, checkInactiveUsers, sendEngagementNudges, sendReferralActivation } from './EmailAutomation';

/**
 * Email Scheduler Component
 * Runs in background to check for digest emails and inactive users
 * Place this in Layout or a top-level component
 */
export default function EmailScheduler() {
  useEffect(() => {
    // Run checks every hour
    const checkEmails = async () => {
      try {
        // Schedule digest emails for candidates based on their preferences
        await scheduleDigestEmails();
        
        // Check for inactive users and send re-engagement emails
        await checkInactiveUsers();
        
        // Send engagement nudges for opened job alerts with no action
        await sendEngagementNudges();
        
        // Send referral activation emails to passive candidates
        await sendReferralActivation();
      } catch (error) {
        console.error('Email scheduler error:', error);
      }
    };

    // Run on mount after 5 minutes (prevent startup spam)
    const initialTimeout = setTimeout(checkEmails, 5 * 60 * 1000);

    // Then run every 6 hours (reduced frequency)
    const interval = setInterval(checkEmails, 6 * 60 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  return null; // This component doesn't render anything
}

// Utility function to manually trigger email checks (for testing or admin panels)
export async function triggerEmailChecks() {
  await scheduleDigestEmails();
  await checkInactiveUsers();
  await sendEngagementNudges();
  await sendReferralActivation();
}
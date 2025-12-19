import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { scheduleDigestEmails, checkInactiveUsers } from './EmailAutomation';

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
      } catch (error) {
        console.error('Email scheduler error:', error);
      }
    };

    // Run immediately on mount
    checkEmails();

    // Then run every hour
    const interval = setInterval(checkEmails, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything
}

// Utility function to manually trigger email checks (for testing or admin panels)
export async function triggerEmailChecks() {
  await scheduleDigestEmails();
  await checkInactiveUsers();
}
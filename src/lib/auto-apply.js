/**
 * Auto-Application System
 * Handles the magic of one-swipe applications
 */

import {
  analyzeJobDescription,
  customizeResumeForJob,
  generateCoverLetter,
  answerApplicationQuestion,
  saveApplicationRecord
} from './resume-intelligence';
import { base44 } from '@/api/base44Client';

/**
 * Main auto-apply function
 * Orchestrates the entire application process
 */
export async function autoApplyToJob(candidate, job, options = {}) {
  const {
    reviewBeforeSubmit = false,
    onProgress = () => {},
    onComplete = () => {},
    onError = () => {}
  } = options;

  try {
    // Step 1: Analyze job description
    onProgress({ step: 1, message: 'Analyzing job requirements...', progress: 10 });
    const jobAnalysis = await analyzeJobDescription(
      job.description,
      job.title,
      job.company?.name
    );

    // Step 2: Customize resume
    onProgress({ step: 2, message: 'Customizing your resume...', progress: 30 });
    const customizedResume = await customizeResumeForJob(
      candidate.resume,
      job,
      jobAnalysis
    );

    // Step 3: Generate cover letter
    onProgress({ step: 3, message: 'Writing personalized cover letter...', progress: 50 });
    const coverLetter = await generateCoverLetter(candidate, job, jobAnalysis);

    // Step 4: If review required, pause here
    if (reviewBeforeSubmit) {
      onProgress({
        step: 4,
        message: 'Ready for your review',
        progress: 70,
        reviewData: {
          job,
          customizedResume,
          coverLetter,
          jobAnalysis
        }
      });
      return {
        status: 'pending_review',
        data: { job, customizedResume, coverLetter, jobAnalysis }
      };
    }

    // Step 5: Fill and submit application
    onProgress({ step: 5, message: 'Submitting application...', progress: 80 });
    const submissionResult = await submitApplication(
      candidate,
      job,
      customizedResume,
      coverLetter,
      jobAnalysis
    );

    // Step 6: Save application record
    onProgress({ step: 6, message: 'Saving application record...', progress: 95 });
    await saveApplicationRecord(candidate, job, customizedResume, coverLetter);

    // Complete!
    onProgress({ step: 7, message: 'Application submitted!', progress: 100 });
    onComplete({
      status: 'success',
      job,
      submissionResult
    });

    return {
      status: 'submitted',
      job,
      customizedResume,
      coverLetter,
      submissionResult
    };

  } catch (error) {
    console.error('Auto-apply error:', error);
    onError(error);
    return {
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Submit application to job
 * In production, this would navigate to the application page and fill forms
 */
async function submitApplication(candidate, job, resume, coverLetter, jobAnalysis) {
  try {
    // In a real implementation, this would:
    // 1. Navigate to the application URL
    // 2. Parse the form fields
    // 3. Fill in all fields intelligently
    // 4. Upload customized resume
    // 5. Submit the form

    // For now, we'll simulate the process and save to our database
    const application = {
      candidateId: candidate.id,
      jobId: job.id,
      status: 'submitted',
      appliedAt: new Date().toISOString(),
      resumeCustomized: true,
      hasCoverLetter: true,
      source: 'swipe_apply'
    };

    // Check if already applied
    const existing = await base44.entities.Match.findOne({
      where: {
        candidateId: candidate.id,
        jobId: job.id
      }
    });

    if (existing) {
      // Update existing match
      await base44.entities.Match.update(existing.id, {
        status: 'applied',
        appliedAt: new Date().toISOString(),
        customResume: JSON.stringify(resume),
        coverLetter: coverLetter
      });
    } else {
      // Create new match/application
      await base44.entities.Match.create({
        candidateId: candidate.id,
        jobId: job.id,
        status: 'applied',
        matchScore: jobAnalysis?.matchScore || 85,
        appliedAt: new Date().toISOString(),
        customResume: JSON.stringify(resume),
        coverLetter: coverLetter
      });
    }

    // Send notification to candidate
    await base44.entities.Notification.create({
      userId: candidate.userId,
      type: 'application_submitted',
      title: `Applied to ${job.title}`,
      message: `Your customized application was submitted to ${job.company?.name}`,
      data: JSON.stringify({ jobId: job.id }),
      read: false
    });

    return {
      success: true,
      applicationId: existing?.id || 'new',
      submittedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error submitting application:', error);
    throw new Error('Failed to submit application');
  }
}

/**
 * Batch auto-apply to multiple jobs
 */
export async function batchAutoApply(candidate, jobs, options = {}) {
  const results = [];
  const { onProgress, onComplete } = options;

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];

    try {
      onProgress?.({
        current: i + 1,
        total: jobs.length,
        job: job.title,
        progress: ((i + 1) / jobs.length) * 100
      });

      const result = await autoApplyToJob(candidate, job, {
        reviewBeforeSubmit: false,
        onProgress: () => {} // Suppress individual progress
      });

      results.push({
        job,
        status: result.status,
        success: result.status === 'submitted'
      });

      // Small delay between applications to avoid rate limiting
      await sleep(1000);

    } catch (error) {
      results.push({
        job,
        status: 'error',
        success: false,
        error: error.message
      });
    }
  }

  onComplete?.(results);
  return results;
}

/**
 * Get application status
 */
export async function getApplicationStatus(candidateId, jobId) {
  try {
    const match = await base44.entities.Match.findOne({
      where: {
        candidateId,
        jobId
      }
    });

    if (!match) {
      return { status: 'not_applied' };
    }

    return {
      status: match.status,
      appliedAt: match.appliedAt,
      viewed: match.viewedByEmployer || false,
      viewedAt: match.viewedAt,
      hasResponse: !!match.employerResponse
    };
  } catch (error) {
    console.error('Error getting application status:', error);
    return { status: 'unknown' };
  }
}

/**
 * Get all applications for candidate
 */
export async function getCandidateApplications(candidateId) {
  try {
    const matches = await base44.entities.Match.find({
      where: {
        candidateId,
        status: 'applied'
      },
      include: ['job', 'job.company'],
      orderBy: { appliedAt: 'desc' }
    });

    return matches.map(match => ({
      id: match.id,
      job: match.job,
      status: match.status,
      appliedAt: match.appliedAt,
      viewed: match.viewedByEmployer || false,
      viewedAt: match.viewedAt,
      hasResponse: !!match.employerResponse,
      customizedResume: match.customResume,
      coverLetter: match.coverLetter
    }));
  } catch (error) {
    console.error('Error fetching applications:', error);
    return [];
  }
}

/**
 * Withdraw application
 */
export async function withdrawApplication(matchId) {
  try {
    await base44.entities.Match.update(matchId, {
      status: 'withdrawn',
      withdrawnAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('Error withdrawing application:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Preview what will be submitted (for review mode)
 */
export async function previewApplication(candidate, job) {
  try {
    // Analyze and customize
    const jobAnalysis = await analyzeJobDescription(
      job.description,
      job.title,
      job.company?.name
    );

    const customizedResume = await customizeResumeForJob(
      candidate.resume,
      job,
      jobAnalysis
    );

    const coverLetter = await generateCoverLetter(candidate, job, jobAnalysis);

    return {
      job,
      jobAnalysis,
      customizedResume,
      coverLetter,
      originalResume: candidate.resume
    };
  } catch (error) {
    console.error('Error previewing application:', error);
    throw error;
  }
}

// Helper function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
  autoApplyToJob,
  batchAutoApply,
  getApplicationStatus,
  getCandidateApplications,
  withdrawApplication,
  previewApplication
};

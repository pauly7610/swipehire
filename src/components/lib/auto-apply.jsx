import { base44 } from '@/api/base44Client';

/**
 * Auto-Apply Engine
 * Handles automatic job applications with AI customization
 */

export async function autoApplyToJob(candidate, job, options = {}) {
  const {
    reviewBeforeSubmit = false,
    onProgress = () => {},
    onComplete = () => {},
    onError = () => {},
  } = options;

  try {
    // Step 1: Prepare application data
    onProgress({ step: 1, progress: 20, message: 'Preparing application...' });

    // Step 2: Customize resume (simulated - would call AI service)
    onProgress({ step: 2, progress: 40, message: 'Customizing resume...' });
    await new Promise(resolve => setTimeout(resolve, 800));

    // Step 3: Generate cover letter (simulated)
    onProgress({ step: 3, progress: 60, message: 'Generating cover letter...' });
    await new Promise(resolve => setTimeout(resolve, 800));

    // Step 4: Submit application
    onProgress({ step: 4, progress: 80, message: 'Submitting application...' });

    const application = await base44.entities.Application.create({
      candidate_id: candidate.id,
      job_id: job.id,
      company_id: job.company_id,
      status: 'applied',
      applied_via: 'swipe',
    });

    onProgress({ step: 5, progress: 100, message: 'Application submitted!' });
    onComplete({ application });

    return { success: true, application };
  } catch (error) {
    console.error('Auto-apply error:', error);
    onError(error);
    throw error;
  }
}

/**
 * Get all applications for a candidate
 */
export async function getCandidateApplications(candidateId) {
  try {
    const applications = await base44.entities.Application.filter(
      { candidate_id: candidateId },
      '-created_date'
    );

    // Enrich with job and company data
    const enrichedApps = await Promise.all(
      applications.map(async (app) => {
        const job = await base44.entities.Job.filter({ id: app.job_id }).then(r => r[0]);
        const company = job ? await base44.entities.Company.filter({ id: job.company_id }).then(r => r[0]) : null;

        return {
          ...app,
          job: { ...job, company },
          appliedAt: app.created_date,
          viewed: app.status !== 'applied',
          viewedAt: app.status !== 'applied' ? app.updated_date : null,
          hasResponse: ['interviewing', 'offered', 'hired'].includes(app.status),
        };
      })
    );

    return enrichedApps;
  } catch (error) {
    console.error('Error fetching applications:', error);
    return [];
  }
}
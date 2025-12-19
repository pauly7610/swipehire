import { base44 } from '@/api/base44Client';

/**
 * Email Automation Service
 * Handles automated emails for job matches, digests, and re-engagement
 */

// Send new match notification emails
export async function sendMatchNotificationEmails(match, job, company, candidate) {
  try {
    // Email to candidate
    if (candidate?.user_id) {
      const candidateUser = await base44.entities.User.filter({ id: candidate.user_id });
      if (candidateUser[0]?.email) {
        await base44.integrations.Core.SendEmail({
          from_name: 'SwipeHire Matches',
          to: candidateUser[0].email,
          subject: `🎉 New Match: ${job.title} at ${company.name}`,
          body: `
            <h2>Congratulations! You have a new match!</h2>
            <p>Great news! <strong>${company.name}</strong> is interested in you for the <strong>${job.title}</strong> position.</p>
            
            <h3>What's Next?</h3>
            <ul>
              <li>Start a conversation with the recruiter</li>
              <li>Schedule an interview</li>
              <li>Learn more about the role and company</li>
            </ul>
            
            <p><a href="${window.location.origin}/matches" style="background: linear-gradient(135deg, #FF005C, #FF7B00); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">View Match</a></p>
            
            <p style="color: #666; font-size: 12px; margin-top: 20px;">This is an automated notification from SwipeHire.</p>
          `
        });

        // Log email event
        await base44.entities.EmailEvent.create({
          recipient_id: candidate.user_id,
          email_type: 'match_notification',
          job_id: job.id,
          subject: `New Match: ${job.title} at ${company.name}`,
          sent_at: new Date().toISOString()
        });
      }
    }

    // Email to employer
    if (company?.user_id) {
      const employerUser = await base44.entities.User.filter({ id: company.user_id });
      if (employerUser[0]?.email) {
        await base44.integrations.Core.SendEmail({
          from_name: 'SwipeHire Matches',
          to: employerUser[0].email,
          subject: `🎉 New Match: Candidate for ${job.title}`,
          body: `
            <h2>You have a new match!</h2>
            <p>Great news! A talented candidate is interested in your <strong>${job.title}</strong> position.</p>
            
            <h3>Candidate Highlights:</h3>
            <ul>
              <li><strong>Title:</strong> ${candidate.headline || 'Professional'}</li>
              <li><strong>Location:</strong> ${candidate.location || 'Not specified'}</li>
              <li><strong>Experience:</strong> ${candidate.experience_level || 'Not specified'}</li>
            </ul>
            
            <h3>What's Next?</h3>
            <ul>
              <li>Review their full profile</li>
              <li>Start a conversation</li>
              <li>Schedule an interview</li>
            </ul>
            
            <p><a href="${window.location.origin}/matches" style="background: linear-gradient(135deg, #FF005C, #FF7B00); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">View Match</a></p>
            
            <p style="color: #666; font-size: 12px; margin-top: 20px;">This is an automated notification from SwipeHire.</p>
          `
        });

        // Log email event
        await base44.entities.EmailEvent.create({
          recipient_id: company.user_id,
          email_type: 'match_notification',
          job_id: job.id,
          subject: `New Match: Candidate for ${job.title}`,
          sent_at: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.error('Failed to send match notification emails:', error);
  }
}

// Send daily/weekly job digest based on interest signals
export async function sendJobDigestEmail(candidateId, userId, frequency = 'relevant_only') {
  try {
    const candidate = await base44.entities.Candidate.filter({ id: candidateId });
    if (!candidate[0]) return;

    const user = await base44.entities.User.filter({ id: userId });
    if (!user[0]?.email) return;

    // Check email frequency preference
    if (candidate[0].email_frequency === 'never') return;

    // Get interest signals from the last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const signals = await base44.entities.InterestSignal.filter({
      candidate_id: candidateId
    });

    // Filter recent signals
    const recentSignals = signals.filter(s => 
      new Date(s.created_date) > weekAgo
    );

    if (recentSignals.length === 0) return;

    // Group by job and calculate interest score
    const jobInterest = {};
    for (const signal of recentSignals) {
      if (!jobInterest[signal.job_id]) {
        jobInterest[signal.job_id] = { count: 0, totalWeight: 0 };
      }
      jobInterest[signal.job_id].count++;
      jobInterest[signal.job_id].totalWeight += signal.weight || 1;
    }

    // Get top interested jobs
    const topJobIds = Object.entries(jobInterest)
      .sort((a, b) => b[1].totalWeight - a[1].totalWeight)
      .slice(0, 5)
      .map(([jobId]) => jobId);

    if (topJobIds.length === 0) return;

    // Fetch job details
    const jobs = [];
    const companies = {};
    for (const jobId of topJobIds) {
      const job = await base44.entities.Job.filter({ id: jobId });
      if (job[0] && job[0].is_active) {
        jobs.push(job[0]);
        if (!companies[job[0].company_id]) {
          const company = await base44.entities.Company.filter({ id: job[0].company_id });
          if (company[0]) companies[job[0].company_id] = company[0];
        }
      }
    }

    if (jobs.length === 0) return;

    // Build email HTML
    const jobsHTML = jobs.map(job => {
      const company = companies[job.company_id];
      return `
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 8px 0; color: #111827;">${job.title}</h3>
          <p style="margin: 0 0 12px 0; color: #6b7280;">${company?.name || 'Company'}</p>
          <div style="display: flex; gap: 16px; margin-bottom: 12px; flex-wrap: wrap;">
            <span style="color: #059669;">💰 $${job.salary_min ? (job.salary_min/1000).toFixed(0) : '?'}k - $${job.salary_max ? (job.salary_max/1000).toFixed(0) : '?'}k</span>
            <span style="color: #3b82f6;">📍 ${job.location || 'Remote'}</span>
            <span style="color: #8b5cf6;">💼 ${job.job_type || 'Full-time'}</span>
          </div>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">${job.description?.substring(0, 150)}...</p>
          <a href="${window.location.origin}/swipe-jobs" style="background: linear-gradient(135deg, #FF005C, #FF7B00); color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 12px;">View Job</a>
        </div>
      `;
    }).join('');

    const subject = frequency === 'daily_digest' 
      ? '📬 Your Daily Job Matches' 
      : frequency === 'weekly_digest'
      ? '📬 Your Weekly Job Digest'
      : '🎯 Jobs You Might Love';

    await base44.integrations.Core.SendEmail({
      from_name: 'SwipeHire Jobs',
      to: user[0].email,
      subject,
      body: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="background: linear-gradient(135deg, #FF005C, #FF7B00); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SwipeHire</h1>
          
          <h2 style="color: #111827; margin: 24px 0 16px 0;">Based on your activity, we think you'll love these roles:</h2>
          
          ${jobsHTML}
          
          <p style="text-align: center; margin-top: 32px;">
            <a href="${window.location.origin}/swipe-jobs" style="background: linear-gradient(135deg, #FF005C, #FF7B00); color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600;">Explore More Jobs</a>
          </p>
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 32px;">
            Don't want these emails? <a href="${window.location.origin}/candidate-profile" style="color: #FF005C;">Update your preferences</a>
          </p>
        </div>
      `
    });

    // Log email event
    await base44.entities.EmailEvent.create({
      recipient_id: userId,
      email_type: 'job_alert',
      subject,
      sent_at: new Date().toISOString(),
      status: 'sent'
    });

  } catch (error) {
    console.error('Failed to send job digest email:', error);
  }
}

// Send re-engagement email for inactive users
export async function sendReEngagementEmail(candidateId, userId) {
  try {
    const candidate = await base44.entities.Candidate.filter({ id: candidateId });
    if (!candidate[0]) return;

    const user = await base44.entities.User.filter({ id: userId });
    if (!user[0]?.email) return;

    // Check if user has been inactive (no swipes in last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentSwipes = await base44.entities.Swipe.filter({
      swiper_id: userId,
      swiper_type: 'candidate'
    });

    const hasRecentActivity = recentSwipes.some(s => 
      new Date(s.created_date) > weekAgo
    );

    if (hasRecentActivity) return; // User is active, don't send

    // Get new jobs matching their profile
    const jobs = await base44.entities.Job.filter({ is_active: true });
    const matchingJobs = jobs.filter(job => {
      // Simple matching logic
      if (candidate[0].target_job_titles?.some(title => 
        job.title.toLowerCase().includes(title.toLowerCase())
      )) return true;
      
      if (candidate[0].preferred_locations?.some(loc => 
        job.location?.toLowerCase().includes(loc.toLowerCase())
      )) return true;

      return false;
    }).slice(0, 3);

    if (matchingJobs.length === 0) return;

    await base44.integrations.Core.SendEmail({
      from_name: 'SwipeHire Team',
      to: user[0].email,
      subject: '👋 We miss you! New opportunities await',
      body: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="background: linear-gradient(135deg, #FF005C, #FF7B00); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">We miss you!</h1>
          
          <p style="font-size: 18px; color: #374151;">Hey ${user[0].full_name || 'there'},</p>
          
          <p style="color: #4b5563; line-height: 1.6;">
            It's been a while since we last saw you! We've got <strong>${matchingJobs.length} new opportunities</strong> that match your profile perfectly.
          </p>
          
          <h3 style="color: #111827; margin: 24px 0 16px 0;">Check out these roles:</h3>
          
          ${matchingJobs.map(job => `
            <div style="background: #f9fafb; border-left: 4px solid #FF005C; padding: 16px; margin-bottom: 16px; border-radius: 8px;">
              <h4 style="margin: 0 0 8px 0; color: #111827;">${job.title}</h4>
              <p style="margin: 0; color: #6b7280;">📍 ${job.location || 'Remote'} • 💰 $${job.salary_min ? (job.salary_min/1000).toFixed(0) : '?'}k+</p>
            </div>
          `).join('')}
          
          <p style="text-align: center; margin-top: 32px;">
            <a href="${window.location.origin}/swipe-jobs" style="background: linear-gradient(135deg, #FF005C, #FF7B00); color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600;">Start Swiping</a>
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            Your next dream job is just a swipe away! 🚀
          </p>
        </div>
      `
    });

    // Log email event
    await base44.entities.EmailEvent.create({
      recipient_id: userId,
      email_type: 'engagement_nudge',
      subject: 'We miss you! New opportunities await',
      sent_at: new Date().toISOString(),
      status: 'sent'
    });

  } catch (error) {
    console.error('Failed to send re-engagement email:', error);
  }
}

// Schedule digest emails based on user preference
export async function scheduleDigestEmails() {
  try {
    const candidates = await base44.entities.Candidate.list();
    
    for (const candidate of candidates) {
      if (!candidate.email_frequency || candidate.email_frequency === 'never') continue;
      
      // Check if it's time to send based on preference
      const lastEmail = await base44.entities.EmailEvent.filter({
        recipient_id: candidate.user_id,
        email_type: 'job_alert'
      }, '-sent_at', 1);

      if (lastEmail[0]) {
        const lastSent = new Date(lastEmail[0].sent_at);
        const now = new Date();
        const hoursSince = (now - lastSent) / (1000 * 60 * 60);

        // Skip if recently sent
        if (candidate.email_frequency === 'daily_digest' && hoursSince < 24) continue;
        if (candidate.email_frequency === 'weekly_digest' && hoursSince < 168) continue;
      }

      await sendJobDigestEmail(candidate.id, candidate.user_id, candidate.email_frequency);
    }
  } catch (error) {
    console.error('Failed to schedule digest emails:', error);
  }
}

// Check for inactive users and send re-engagement
export async function checkInactiveUsers() {
  try {
    const candidates = await base44.entities.Candidate.list();
    
    for (const candidate of candidates) {
      if (candidate.job_search_status === 'not_looking') continue;
      
      await sendReEngagementEmail(candidate.id, candidate.user_id);
    }
  } catch (error) {
    console.error('Failed to check inactive users:', error);
  }
}

// ===== NEW JOB POSTING EMAIL AUTOMATION =====

/**
 * Send instant job alert to segmented candidates when a job is posted
 */
export async function sendJobPostingAlert(jobId) {
  try {
    const [job] = await base44.entities.Job.filter({ id: jobId });
    if (!job || !job.is_active) return;

    const [company] = await base44.entities.Company.filter({ id: job.company_id });
    
    // Get all active job-seeking candidates
    const candidates = await base44.entities.Candidate.list();
    
    // Segment candidates - only send to relevant ones
    const relevantCandidates = candidates.filter(candidate => {
      if (candidate.job_search_status === 'not_looking') return false;
      if (candidate.email_frequency === 'never') return false;
      
      // Match by target job titles
      if (candidate.target_job_titles?.some(title => 
        job.title.toLowerCase().includes(title.toLowerCase()) ||
        title.toLowerCase().includes(job.title.toLowerCase())
      )) return true;
      
      // Match by location
      if (candidate.preferred_locations?.some(loc => 
        job.location?.toLowerCase().includes(loc.toLowerCase()) ||
        loc.toLowerCase() === 'remote'
      )) return true;
      
      // Match by seniority
      if (candidate.target_seniority === job.seniority) return true;
      
      // Match by industry
      if (candidate.industry === company?.industry) return true;
      
      return false;
    });

    // Check email frequency limits
    for (const candidate of relevantCandidates.slice(0, 100)) { // Limit batch size
      try {
        // Check recent job alerts
        const recentAlerts = await base44.entities.EmailEvent.filter({
          recipient_id: candidate.user_id,
          email_type: 'job_alert'
        }, '-sent_at', 5);

        // Count emails in last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recentCount = recentAlerts.filter(e => new Date(e.sent_at) > weekAgo).length;

        // Hard cap: max 2 per week
        if (recentCount >= 2) continue;

        // Check if we already sent this job
        const alreadySent = recentAlerts.some(e => e.job_id === jobId);
        if (alreadySent) continue;

        // Get user email
        const [user] = await base44.entities.User.filter({ id: candidate.user_id });
        if (!user?.email) continue;

        const salaryRange = job.salary_min && job.salary_max 
          ? `$${(job.salary_min/1000).toFixed(0)}k - $${(job.salary_max/1000).toFixed(0)}k`
          : job.salary_min 
          ? `$${(job.salary_min/1000).toFixed(0)}k+`
          : 'Competitive';

        await base44.integrations.Core.SendEmail({
          from_name: 'Rell @ SwipeHire',
          to: user.email,
          subject: `New role: ${job.title}`,
          body: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
              <p style="color: #374151;">Hi ${user.full_name?.split(' ')[0] || 'there'},</p>
              
              <p style="color: #4b5563; line-height: 1.6;">
                We just posted a new role on SwipeHire that matches what you've been exploring.
              </p>
              
              <div style="background: linear-gradient(135deg, #FFF5F7, #FFF7F0); border-left: 4px solid #FF005C; padding: 20px; margin: 24px 0; border-radius: 8px;">
                <h2 style="margin: 0 0 8px 0; color: #111827; font-size: 20px;">${job.title}</h2>
                <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 16px;">${company?.name || 'Company'} — ${job.location || 'Remote'}</p>
                <p style="margin: 0; color: #059669; font-weight: 600;">${salaryRange}</p>
              </div>
              
              <p style="color: #4b5563; line-height: 1.6;">
                This role is live now and early applicants usually move fastest.
              </p>
              
              <p style="text-align: center; margin: 32px 0;">
                <a href="${window.location.origin}/swipe-jobs" style="background: linear-gradient(135deg, #FF005C, #FF7B00); color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600;">View role & start swiping</a>
              </p>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                Not looking right now?<br>
                Forward this to someone who is — they can apply here: <a href="${window.location.origin}/welcome" style="color: #FF005C;">SwipeHire Signup</a>
              </p>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                More roles coming soon. I'll keep you posted.
              </p>
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">
                — Rell<br>
                SwipeHire
              </p>
            </div>
          `
        });

        // Log email event
        await base44.entities.EmailEvent.create({
          recipient_id: candidate.user_id,
          email_type: 'job_alert',
          job_id: jobId,
          subject: `New role: ${job.title}`,
          sent_at: new Date().toISOString(),
          status: 'sent'
        });

      } catch (emailError) {
        console.error('Failed to send job alert to candidate:', candidate.id, emailError);
      }
    }

    return relevantCandidates.length;
  } catch (error) {
    console.error('Failed to send job posting alerts:', error);
    return 0;
  }
}

/**
 * Send engagement nudge 24-48h after initial alert if opened but no action
 */
export async function sendEngagementNudges() {
  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Find job alerts sent 24-48h ago that were opened but had no follow-up action
    const jobAlerts = await base44.entities.EmailEvent.filter({
      email_type: 'job_alert'
    });

    const eligibleAlerts = jobAlerts.filter(alert => {
      const sentDate = new Date(alert.sent_at);
      return sentDate >= twoDaysAgo && sentDate <= oneDayAgo && 
             alert.opened_at && !alert.clicked_at && !alert.applied_at;
    });

    for (const alert of eligibleAlerts) {
      try {
        // Check if nudge already sent
        const existingNudge = await base44.entities.EmailEvent.filter({
          recipient_id: alert.recipient_id,
          job_id: alert.job_id,
          email_type: 'engagement_nudge'
        });

        if (existingNudge.length > 0) continue;

        // Check if user already applied
        const applications = await base44.entities.Application.filter({
          candidate_id: alert.recipient_id,
          job_id: alert.job_id
        });

        if (applications.length > 0) continue;

        const [job] = await base44.entities.Job.filter({ id: alert.job_id });
        if (!job || !job.is_active) continue;

        const [company] = await base44.entities.Company.filter({ id: job.company_id });
        const [user] = await base44.entities.User.filter({ id: alert.recipient_id });
        if (!user?.email) continue;

        await base44.integrations.Core.SendEmail({
          from_name: 'Rell @ SwipeHire',
          to: user.email,
          subject: `Still open: ${job.title}`,
          body: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
              <p style="color: #374151;">Hey ${user.full_name?.split(' ')[0] || 'there'},</p>
              
              <p style="color: #4b5563; line-height: 1.6;">
                Just circling back — this role is still open and getting attention.
              </p>
              
              <div style="background: #f9fafb; border-left: 4px solid #FF005C; padding: 16px; margin: 20px 0; border-radius: 8px;">
                <h3 style="margin: 0; color: #111827;">${job.title}</h3>
                <p style="margin: 8px 0 0 0; color: #6b7280;">${company?.name || 'Company'}</p>
              </div>
              
              <p style="color: #4b5563; line-height: 1.6;">
                If it's relevant, now's a good time to swipe in.<br>
                If not, someone in your circle might be perfect.
              </p>
              
              <p style="text-align: center; margin: 24px 0;">
                <a href="${window.location.origin}/swipe-jobs" style="background: linear-gradient(135deg, #FF005C, #FF7B00); color: white; padding: 12px 24px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: 600; margin-right: 12px;">View role</a>
                <a href="${window.location.origin}/welcome" style="color: #FF005C; padding: 12px 24px; text-decoration: none; border: 2px solid #FF005C; border-radius: 10px; display: inline-block; font-weight: 600;">Send to a friend</a>
              </p>
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
                — Rell
              </p>
            </div>
          `
        });

        await base44.entities.EmailEvent.create({
          recipient_id: alert.recipient_id,
          email_type: 'engagement_nudge',
          job_id: alert.job_id,
          subject: `Still open: ${job.title}`,
          sent_at: new Date().toISOString(),
          status: 'sent'
        });

      } catch (error) {
        console.error('Failed to send engagement nudge:', error);
      }
    }
  } catch (error) {
    console.error('Failed to send engagement nudges:', error);
  }
}

/**
 * Send referral activation email 72h after initial alert to non-applicants
 */
export async function sendReferralActivation() {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const jobAlerts = await base44.entities.EmailEvent.filter({
      email_type: 'job_alert'
    });

    const eligibleAlerts = jobAlerts.filter(alert => {
      const sentDate = new Date(alert.sent_at);
      return sentDate <= threeDaysAgo && !alert.applied_at;
    });

    for (const alert of eligibleAlerts) {
      try {
        // Check if referral email already sent
        const existingReferral = await base44.entities.EmailEvent.filter({
          recipient_id: alert.recipient_id,
          job_id: alert.job_id,
          email_type: 'referral_activation'
        });

        if (existingReferral.length > 0) continue;

        // Check if user applied
        const applications = await base44.entities.Application.filter({
          candidate_id: alert.recipient_id,
          job_id: alert.job_id
        });

        if (applications.length > 0) continue;

        const [job] = await base44.entities.Job.filter({ id: alert.job_id });
        if (!job || !job.is_active) continue;

        const [company] = await base44.entities.Company.filter({ id: job.company_id });
        const [user] = await base44.entities.User.filter({ id: alert.recipient_id });
        if (!user?.email) continue;

        await base44.integrations.Core.SendEmail({
          from_name: 'Rell @ SwipeHire',
          to: user.email,
          subject: `Worth sharing: ${job.title}`,
          body: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
              <p style="color: #374151;">${user.full_name?.split(' ')[0] || 'Hi'},</p>
              
              <p style="color: #4b5563; line-height: 1.6;">
                You may not be looking — but this role is strong and worth passing along.
              </p>
              
              <div style="background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 12px; border: 1px solid #e5e7eb;">
                <h3 style="margin: 0 0 8px 0; color: #111827;">${job.title}</h3>
                <p style="margin: 0; color: #6b7280;">${company?.name || 'Company'}</p>
              </div>
              
              <p style="color: #4b5563; line-height: 1.6;">
                If a friend applies, they just need to create a profile here:<br>
                <a href="${window.location.origin}/welcome" style="color: #FF005C; font-weight: 600;">SwipeHire Signup</a>
              </p>
              
              <p style="color: #6b7280; margin-top: 24px;">
                Appreciate you helping good people find good roles.
              </p>
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
                — Rell
              </p>
            </div>
          `
        });

        await base44.entities.EmailEvent.create({
          recipient_id: alert.recipient_id,
          email_type: 'referral_activation',
          job_id: alert.job_id,
          subject: `Worth sharing: ${job.title}`,
          sent_at: new Date().toISOString(),
          status: 'sent'
        });

      } catch (error) {
        console.error('Failed to send referral activation:', error);
      }
    }
  } catch (error) {
    console.error('Failed to send referral activation emails:', error);
  }
}
import { base44 } from '@/api/base44Client';

export async function sendStatusChangeNotification(match, newStatus, candidate, job, company) {
  try {
    // Get candidate user info
    const [candidateUser] = await base44.entities.User.filter({ id: candidate.user_id });
    if (!candidateUser?.email) return;

    let subject = '';
    let body = '';

    switch (newStatus) {
      case 'rejected':
        subject = `Update on your application for ${job.title}`;
        body = `
Hi ${candidateUser.full_name || 'there'},

Thank you for your interest in the ${job.title} position at ${company.name} and for taking the time to apply.

After careful consideration, we have decided to move forward with other candidates whose experience more closely aligns with our current needs. This was a difficult decision as we received many qualified applications.

We encourage you to:
• Keep your profile updated on SwipeHire
• Continue exploring other opportunities that match your skills
• Apply for future positions at ${company.name} that align with your experience

We wish you the best in your job search and future career endeavors.

Best regards,
${company.name} Hiring Team
        `;
        break;

      case 'interviewing':
        subject = `Great news! Next steps for ${job.title} at ${company.name}`;
        body = `
Hi ${candidateUser.full_name || 'there'},

Congratulations! 🎉

We're excited to inform you that you've been selected to move forward in the hiring process for the ${job.title} position at ${company.name}.

What happens next:
• Our team will reach out to schedule an interview
• Please ensure your availability is up to date
• Prepare any questions you might have about the role

We look forward to speaking with you soon!

Best regards,
${company.name} Hiring Team
        `;
        break;

      case 'offered':
        subject = `Exciting news! Job offer for ${job.title}`;
        body = `
Hi ${candidateUser.full_name || 'there'},

We are thrilled to extend an offer for the ${job.title} position at ${company.name}! 🎉

Your skills and experience impressed our team, and we believe you would be a great addition.

Next steps:
• Review the offer details in your SwipeHire dashboard
• Our team will reach out to discuss the specifics
• Feel free to ask any questions you may have

We're excited about the possibility of having you join our team!

Best regards,
${company.name} Hiring Team
        `;
        break;

      case 'hired':
        subject = `Welcome to ${company.name}! 🎉`;
        body = `
Hi ${candidateUser.full_name || 'there'},

We are absolutely delighted that you've accepted our offer to join ${company.name} as ${job.title}!

Our HR team will be in touch shortly with onboarding details and next steps.

Welcome to the team!

Best regards,
${company.name}
        `;
        break;

      default:
        return;
    }

    // Send email
    await base44.integrations.Core.SendEmail({
      to: candidateUser.email,
      subject,
      body
    });

    // Create notification
    await base44.entities.Notification.create({
      user_id: candidate.user_id,
      type: newStatus === 'rejected' ? 'system' : 'offer',
      title: subject,
      message: newStatus === 'rejected' 
        ? `Your application for ${job.title} has been reviewed.`
        : newStatus === 'interviewing'
        ? `You're moving to the interview stage for ${job.title}!`
        : newStatus === 'offered'
        ? `You have a job offer for ${job.title}!`
        : `Congratulations on joining ${company.name}!`,
      match_id: match.id,
      job_id: job.id
    });

  } catch (error) {
    console.error('Failed to send status notification:', error);
  }
}

export default { sendStatusChangeNotification };
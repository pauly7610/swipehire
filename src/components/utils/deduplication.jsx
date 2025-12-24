/**
 * Deduplication Utilities
 * Prevents duplicate notifications, swipes, and emails
 */

import { base44 } from '@/api/base44Client';

/**
 * Check if user already received notification for this role
 */
export async function hasReceivedRoleNotification(userId, jobId) {
  try {
    const existingNotifs = await base44.entities.RoleNotification.filter({
      user_id: userId,
      job_id: jobId
    });
    
    return existingNotifs.length > 0;
  } catch (e) {
    console.error('Failed to check notification history:', e);
    return false; // Fail open - allow notification
  }
}

/**
 * Check if user already swiped on this target
 */
export async function hasSwipedBefore(swiperId, targetId, targetType) {
  try {
    const existingSwipes = await base44.entities.Swipe.filter({
      swiper_id: swiperId,
      target_id: targetId,
      target_type: targetType
    });
    
    return existingSwipes.length > 0;
  } catch (e) {
    console.error('Failed to check swipe history:', e);
    return false;
  }
}

/**
 * Check if match already exists
 */
export async function matchExists(candidateId, jobId, companyId) {
  try {
    const existingMatches = await base44.entities.Match.filter({
      candidate_id: candidateId,
      job_id: jobId,
      company_id: companyId
    });
    
    return existingMatches.length > 0;
  } catch (e) {
    console.error('Failed to check match existence:', e);
    return false;
  }
}

/**
 * Record notification sent
 */
export async function recordNotificationSent(userId, jobId, notificationType, matchedCriteria, matchScore) {
  try {
    const candidate = await base44.entities.Candidate.filter({ user_id: userId });
    
    await base44.entities.RoleNotification.create({
      user_id: userId,
      candidate_id: candidate[0]?.id || null,
      job_id: jobId,
      notification_type: notificationType,
      match_score: matchScore || null,
      matched_criteria: matchedCriteria || [],
      sent_at: new Date().toISOString(),
      status: 'sent'
    });
  } catch (e) {
    console.error('Failed to record notification:', e);
  }
}

/**
 * Calculate similarity between two role titles (basic version)
 */
export function calculateTitleSimilarity(title1, title2) {
  if (!title1 || !title2) return 0;
  
  const t1 = title1.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const t2 = title2.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  
  if (t1 === t2) return 100;
  
  // Check word overlap
  const words1 = new Set(t1.split(/\s+/));
  const words2 = new Set(t2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return (intersection.size / union.size) * 100;
}

/**
 * Check if similar role was already notified about recently
 */
export async function hasSimilarRoleNotification(userId, jobTitle, daysBack = 7) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    const recentNotifs = await base44.entities.RoleNotification.filter({
      user_id: userId
    });
    
    // Filter by date and check similarity
    const similarNotifs = recentNotifs.filter(notif => {
      if (new Date(notif.sent_at) < cutoffDate) return false;
      
      // Get the job details
      return false; // Need job data to compare
    });
    
    return similarNotifs.length > 0;
  } catch (e) {
    console.error('Failed to check similar notifications:', e);
    return false;
  }
}
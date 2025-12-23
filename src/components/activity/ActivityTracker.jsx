import { base44 } from '@/api/base44Client';

/**
 * Activity Tracker - Transparent signal collection
 * Tracks views, swipes, messages for better matching
 */

export const trackActivity = async (userId, activityType, metadata = {}) => {
  try {
    // Track as interest signal
    await base44.entities.InterestSignal.create({
      user_id: userId,
      candidate_id: metadata.candidateId || metadata.candidate_id,
      job_id: metadata.jobId || metadata.job_id,
      signal_type: activityType,
      weight: getSignalWeight(activityType),
      metadata: metadata
    });

    console.log('[Activity] Tracked:', activityType, metadata);
  } catch (error) {
    console.error('[Activity] Failed to track:', error);
    // Silent failure - don't block UX
  }
};

// Signal weight hierarchy
const getSignalWeight = (type) => {
  const weights = {
    'view': 1,
    'click': 2,
    'dwell': 3,
    'save': 4,
    'swipe_right': 5,
    'message_sent': 6,
    'message_received': 6,
    'video_watched': 4,
    'resume_viewed': 3,
    'profile_viewed': 2
  };
  return weights[type] || 1;
};

// Track profile view
export const trackProfileView = async (viewerId, profileOwnerId, candidateId, jobId = null) => {
  return trackActivity(viewerId, 'view', {
    candidateId,
    jobId,
    profile_owner: profileOwnerId,
    viewed_at: new Date().toISOString()
  });
};

// Track message sent
export const trackMessageSent = async (senderId, receiverId, candidateId = null, jobId = null) => {
  return trackActivity(senderId, 'message_sent', {
    candidateId,
    jobId,
    receiver_id: receiverId
  });
};

// Track resume view
export const trackResumeView = async (viewerId, candidateId, jobId = null) => {
  return trackActivity(viewerId, 'resume_viewed', {
    candidateId,
    jobId
  });
};

// Track video view
export const trackVideoView = async (viewerId, candidateId, jobId = null, duration = null) => {
  return trackActivity(viewerId, 'video_watched', {
    candidateId,
    jobId,
    duration_seconds: duration
  });
};

export default {
  trackActivity,
  trackProfileView,
  trackMessageSent,
  trackResumeView,
  trackVideoView
};
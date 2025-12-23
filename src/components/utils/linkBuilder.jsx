/**
 * Centralized Link Builder
 * Generates environment-aware, deep-linkable URLs for emails and notifications
 */

const getBaseUrl = () => {
  // Check if running in browser
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Fallback for server-side (should not happen in frontend)
  return '';
};

export const buildLink = {
  /**
   * Build a complete URL for a page with optional parameters
   */
  toPage(pageName, params = {}) {
    const base = getBaseUrl();
    const queryString = Object.keys(params).length > 0 
      ? '?' + new URLSearchParams(params).toString()
      : '';
    
    // Convert page name to URL format (e.g., SwipeJobs -> swipe-jobs)
    const urlPath = pageName
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');
    
    return `${base}/${urlPath}${queryString}`;
  },

  /**
   * Job-specific links
   */
  job: {
    view(jobId) {
      return buildLink.toPage('PublicJobView', { jobId });
    },
    swipe(jobId) {
      return buildLink.toPage('SwipeJobs', { jobId });
    },
    apply(jobId) {
      return buildLink.toPage('PublicJobView', { jobId, action: 'apply' });
    }
  },

  /**
   * Candidate-specific links
   */
  candidate: {
    view(candidateId) {
      return buildLink.toPage('ViewCandidateProfile', { candidateId });
    },
    profile() {
      return buildLink.toPage('CandidateProfile');
    }
  },

  /**
   * Match-specific links
   */
  match: {
    view(matchId) {
      return buildLink.toPage('Matches', { matchId });
    },
    chat(matchId) {
      return buildLink.toPage('Chat', { matchId });
    },
    employerChat(matchId) {
      return buildLink.toPage('EmployerChat', { matchId });
    }
  },

  /**
   * Interview-specific links
   */
  interview: {
    view(interviewId) {
      return buildLink.toPage('Matches', { interviewId });
    },
    schedule(matchId) {
      return buildLink.toPage('Matches', { matchId, action: 'schedule' });
    }
  },

  /**
   * Application-specific links
   */
  application: {
    tracker() {
      return buildLink.toPage('ApplicationTracker');
    },
    view(applicationId) {
      return buildLink.toPage('ApplicationTracker', { applicationId });
    }
  },

  /**
   * General app links
   */
  dashboard(userType) {
    return buildLink.toPage(userType === 'employer' ? 'EmployerDashboard' : 'SwipeJobs');
  },

  inbox() {
    return buildLink.toPage('CommunicationHub');
  },

  welcome() {
    return buildLink.toPage('Welcome');
  }
};

/**
 * Validate that a link is not a preview/sandbox URL
 */
export const validateProductionLink = (url) => {
  const previewPatterns = [
    /preview-sandbox/i,
    /localhost/i,
    /\.base44\.app$/
  ];
  
  const isPreview = previewPatterns.some(pattern => pattern.test(url));
  
  if (isPreview && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    console.warn('[LinkBuilder] Preview URL detected in production:', url);
    return false;
  }
  
  return true;
};

/**
 * Get page parameters from current URL
 */
export const getPageParams = () => {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  const result = {};
  
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  
  return result;
};

export default buildLink;
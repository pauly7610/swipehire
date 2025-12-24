import { base44 } from '@/api/base44Client';

/**
 * Session Manager
 * Handles session persistence and recovery across refreshes
 */
class SessionManager {
  constructor() {
    this.sessionKey = 'swipehire_session';
    this.userCache = null;
    this.lastCheck = null;
  }

  // Store session data
  saveSession(user, viewMode, profileData) {
    const session = {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      viewMode,
      profileData,
      timestamp: Date.now()
    };
    
    try {
      sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
      this.userCache = user;
    } catch (e) {
      console.warn('Failed to save session:', e);
    }
  }

  // Retrieve session data
  getSession() {
    try {
      const data = sessionStorage.getItem(this.sessionKey);
      if (!data) return null;
      
      const session = JSON.parse(data);
      
      // Session expires after 24 hours
      if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) {
        this.clearSession();
        return null;
      }
      
      return session;
    } catch (e) {
      console.warn('Failed to retrieve session:', e);
      return null;
    }
  }

  // Clear session
  clearSession() {
    sessionStorage.removeItem(this.sessionKey);
    this.userCache = null;
    this.lastCheck = null;
  }

  // Check authentication with caching
  async checkAuth(forceFresh = false) {
    // Return cached user if checked within last 30 seconds
    if (!forceFresh && this.userCache && this.lastCheck && 
        Date.now() - this.lastCheck < 30000) {
      return this.userCache;
    }

    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        this.clearSession();
        return null;
      }

      const user = await base44.auth.me();
      this.userCache = user;
      this.lastCheck = Date.now();
      return user;
    } catch (e) {
      console.error('Auth check failed:', e);
      // Don't clear session on network errors
      if (e?.response?.status === 401) {
        this.clearSession();
      }
      return null;
    }
  }
}

export default new SessionManager();
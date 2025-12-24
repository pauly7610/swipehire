/**
 * Centralized Session Manager for SwipeHire
 * Single source of truth for authentication state
 */

import { base44 } from '@/api/base44Client';

const SESSION_CACHE_KEY = 'swipehire_session_cache';
const SESSION_TIMESTAMP_KEY = 'swipehire_session_timestamp';
const SESSION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class SessionManager {
  constructor() {
    this.currentUser = null;
    this.sessionValid = false;
    this.lastCheck = 0;
    this.checkInProgress = false;
    this.listeners = new Set();
  }

  /**
   * Subscribe to session changes
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of session change
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentUser, this.sessionValid);
      } catch (e) {
        console.error('[SessionManager] Listener error:', e);
      }
    });
  }

  /**
   * Get cached session if still valid
   */
  getCachedSession() {
    try {
      const cached = localStorage.getItem(SESSION_CACHE_KEY);
      const timestamp = localStorage.getItem(SESSION_TIMESTAMP_KEY);
      
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp, 10);
        if (age < SESSION_CACHE_DURATION) {
          return JSON.parse(cached);
        }
      }
    } catch (e) {
      console.error('[SessionManager] Cache read error:', e);
      this.clearCache();
    }
    return null;
  }

  /**
   * Cache session data
   */
  cacheSession(user) {
    try {
      localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(user));
      localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
    } catch (e) {
      console.error('[SessionManager] Cache write error:', e);
    }
  }

  /**
   * Clear session cache
   */
  clearCache() {
    try {
      localStorage.removeItem(SESSION_CACHE_KEY);
      localStorage.removeItem(SESSION_TIMESTAMP_KEY);
    } catch (e) {
      console.error('[SessionManager] Cache clear error:', e);
    }
  }

  /**
   * Check authentication status with caching and debouncing
   */
  async checkAuth(forceRefresh = false) {
    // Return cached session if available and not forcing refresh
    if (!forceRefresh) {
      const cached = this.getCachedSession();
      if (cached) {
        this.currentUser = cached;
        this.sessionValid = true;
        return { user: cached, valid: true };
      }
    }

    // Prevent concurrent checks
    if (this.checkInProgress) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return { user: this.currentUser, valid: this.sessionValid };
    }

    this.checkInProgress = true;

    try {
      const isAuth = await base44.auth.isAuthenticated();
      
      if (!isAuth) {
        this.currentUser = null;
        this.sessionValid = false;
        this.clearCache();
        this.notifyListeners();
        return { user: null, valid: false };
      }

      const user = await base44.auth.me();
      
      this.currentUser = user;
      this.sessionValid = true;
      this.lastCheck = Date.now();
      this.cacheSession(user);
      this.notifyListeners();
      
      return { user, valid: true };
    } catch (error) {
      console.error('[SessionManager] Auth check error:', error);
      
      // Only clear session on explicit auth errors (401, 403)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.warn('[SessionManager] Auth error - clearing session');
        this.currentUser = null;
        this.sessionValid = false;
        this.clearCache();
        this.notifyListeners();
        return { user: null, valid: false };
      }
      
      // Network errors - keep existing session
      console.log('[SessionManager] Network error - preserving session');
      const cached = this.getCachedSession();
      if (cached) {
        this.currentUser = cached;
        this.sessionValid = true;
        return { user: cached, valid: true };
      }
      
      return { user: null, valid: false };
    } finally {
      this.checkInProgress = false;
    }
  }

  /**
   * Get current user (from cache or server)
   */
  async getUser(forceRefresh = false) {
    const { user } = await this.checkAuth(forceRefresh);
    return user;
  }

  /**
   * Logout user
   */
  async logout(redirectUrl) {
    this.currentUser = null;
    this.sessionValid = false;
    this.clearCache();
    localStorage.removeItem('swipehire_view_mode');
    localStorage.removeItem('swipehire_selected_role');
    this.notifyListeners();
    
    try {
      await base44.auth.logout(redirectUrl);
    } catch (e) {
      console.error('[SessionManager] Logout error:', e);
      window.location.href = redirectUrl || '/';
    }
  }

  /**
   * Validate session is still active
   */
  async validateSession() {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        this.currentUser = null;
        this.sessionValid = false;
        this.clearCache();
        this.notifyListeners();
        return false;
      }
      return true;
    } catch (e) {
      console.error('[SessionManager] Session validation error:', e);
      return false;
    }
  }
}

// Singleton instance
export const sessionManager = new SessionManager();

// React hook for using session manager
export const useSession = () => {
  const [user, setUser] = React.useState(sessionManager.currentUser);
  const [valid, setValid] = React.useState(sessionManager.sessionValid);

  React.useEffect(() => {
    const unsubscribe = sessionManager.subscribe((newUser, newValid) => {
      setUser(newUser);
      setValid(newValid);
    });

    return unsubscribe;
  }, []);

  return { user, valid, checkAuth: sessionManager.checkAuth.bind(sessionManager) };
};

export default sessionManager;
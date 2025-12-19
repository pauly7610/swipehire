import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    let refreshTimer = null;

    const initAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        
        if (!mounted) return;

        if (isAuth) {
          const currentUser = await base44.auth.me();
          if (mounted) {
            setUser(currentUser);
            console.log('[Auth] User authenticated:', currentUser.email);
          }
        } else {
          if (mounted) {
            setUser(null);
            console.log('[Auth] Not authenticated');
          }
        }
      } catch (error) {
        console.error('[Auth] Init error:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setAuthChecked(true);
        }
      }
    };

    // Refresh auth check periodically (every 30 seconds)
    const startAuthRefresh = () => {
      refreshTimer = setInterval(async () => {
        try {
          const isAuth = await base44.auth.isAuthenticated();
          
          if (!isAuth && user) {
            // User was logged in but is now logged out
            console.warn('[Auth] Session expired, clearing user');
            setUser(null);
          } else if (isAuth && !user) {
            // User logged in elsewhere, refresh
            const currentUser = await base44.auth.me();
            setUser(currentUser);
            console.log('[Auth] Session restored:', currentUser.email);
          }
        } catch (error) {
          // Don't log out on network errors, only on explicit auth failures
          if (error?.response?.status === 401) {
            console.warn('[Auth] 401 detected, clearing session');
            setUser(null);
          }
        }
      }, 30000); // Check every 30 seconds
    };

    initAuth();
    startAuthRefresh();

    return () => {
      mounted = false;
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  }, []);

  const refreshUser = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        return currentUser;
      }
    } catch (error) {
      console.error('[Auth] Refresh user error:', error);
    }
    return null;
  };

  const logout = async (redirectUrl) => {
    try {
      setUser(null);
      localStorage.removeItem('swipehire_user');
      localStorage.removeItem('swipehire_view_mode');
      await base44.auth.logout(redirectUrl);
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      // Force logout even if API fails
      window.location.href = redirectUrl || '/';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, authChecked, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Simple analytics tracker
class Analytics {
  constructor() {
    this.enabled = true;
    this.events = [];
  }

  track(eventName, properties = {}) {
    if (!this.enabled) return;
    
    const event = {
      name: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    };
    
    this.events.push(event);
    console.log('📊 Analytics:', eventName, properties);
    
    // Store in localStorage for now (in production, send to analytics service)
    try {
      const stored = JSON.parse(localStorage.getItem('swipehire_analytics') || '[]');
      stored.push(event);
      // Keep only last 100 events
      const recent = stored.slice(-100);
      localStorage.setItem('swipehire_analytics', JSON.stringify(recent));
    } catch (e) {
      console.error('Failed to store analytics:', e);
    }
  }

  page(pageName, properties = {}) {
    this.track('Page Viewed', { page: pageName, ...properties });
  }

  identify(userId, traits = {}) {
    this.track('User Identified', { userId, ...traits });
  }

  getEvents() {
    try {
      return JSON.parse(localStorage.getItem('swipehire_analytics') || '[]');
    } catch {
      return [];
    }
  }

  clearEvents() {
    localStorage.removeItem('swipehire_analytics');
    this.events = [];
  }
}

export const analytics = new Analytics();

// Make globally available
if (typeof window !== 'undefined') {
  window.analytics = analytics;
}

// Hook to track page views
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    const pageName = location.pathname.split('/').pop() || 'Home';
    analytics.page(pageName, { path: location.pathname });
  }, [location]);
}

export default analytics;
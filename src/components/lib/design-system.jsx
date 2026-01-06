/**
 * Design System - Sorce-inspired design tokens
 * Centralized design values for consistent UI
 */

export const colors = {
  primary: {
    DEFAULT: '#FF005C',
    gradient: 'linear-gradient(135deg, #FF005C 0%, #FF7B00 100%)',
  },
  success: {
    DEFAULT: '#4ECDC4',
    gradient: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
  },
  bg: {
    DEFAULT: '#FFFFFF',
    dark: '#1A1A1A',
  },
};

export const radius = {
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
};

export const shadows = {
  sm: '0 2px 8px rgba(0, 0, 0, 0.08)',
  md: '0 4px 16px rgba(0, 0, 0, 0.12)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.15)',
  xl: '0 16px 48px rgba(0, 0, 0, 0.2)',
};

export const springs = {
  smooth: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
  },
  bouncy: {
    type: 'spring',
    stiffness: 300,
    damping: 20,
  },
  slow: {
    type: 'spring',
    stiffness: 200,
    damping: 25,
  },
};
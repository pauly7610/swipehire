/**
 * SwipeHire Design System
 * Sorce-inspired minimalist design with smooth animations
 */

// Color System
export const colors = {
  // Primary: Energetic but professional
  primary: {
    DEFAULT: '#FF6B6B',
    light: '#FFE5E5',
    dark: '#E85555',
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)',
  },

  // Success: Celebratory
  success: {
    DEFAULT: '#4ECDC4',
    light: '#D4F4F1',
    dark: '#3DBDB5',
    gradient: 'linear-gradient(135deg, #4ECDC4 0%, #6FE3DC 100%)',
  },

  // Warning
  warning: {
    DEFAULT: '#FFB347',
    light: '#FFE5CC',
    dark: '#FF9F1C',
  },

  // Neutrals: Clean & minimal
  bg: {
    DEFAULT: '#FFFFFF',
    secondary: '#FAFAFA',
    tertiary: '#F5F5F5',
  },

  text: {
    DEFAULT: '#2D3436',
    light: '#636E72',
    lighter: '#95A5A6',
  },

  border: {
    DEFAULT: '#E8E8E8',
    light: '#F0F0F0',
  },

  // Dark mode: True blacks for OLED
  dark: {
    bg: '#000000',
    bgSecondary: '#1A1A1A',
    bgTertiary: '#2A2A2A',
    text: '#FFFFFF',
    textLight: '#A0A0A0',
    textLighter: '#6A6A6A',
    border: '#333333',
  },
};

// Typography
export const typography = {
  fonts: {
    display: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  sizes: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '20px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
    '4xl': '64px',
  },

  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Spacing System (8px base unit)
export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '24px',
  6: '32px',
  7: '48px',
  8: '64px',
  9: '96px',
  10: '128px',
};

// Border Radius
export const radius = {
  sm: '8px',
  md: '12px',
  lg: '20px',
  xl: '28px',
  '2xl': '36px',
  full: '9999px',
};

// Shadows
export const shadows = {
  sm: '0 2px 8px rgba(0,0,0,0.08)',
  md: '0 4px 16px rgba(0,0,0,0.12)',
  lg: '0 8px 24px rgba(0,0,0,0.16)',
  xl: '0 16px 48px rgba(0,0,0,0.20)',
  '2xl': '0 24px 64px rgba(0,0,0,0.24)',
  focus: '0 0 0 4px rgba(255,107,107,0.2)',
  inner: 'inset 0 2px 4px rgba(0,0,0,0.06)',
};

// Animation Presets (for Framer Motion)
export const animations = {
  // Entrance
  slideUp: {
    initial: { y: 100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -100, opacity: 0 },
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },

  slideDown: {
    initial: { y: -100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 100, opacity: 0 },
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },

  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },

  scaleIn: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },

  // Swipe
  swipeRight: {
    x: 500,
    rotate: 25,
    opacity: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },

  swipeLeft: {
    x: -500,
    rotate: -25,
    opacity: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },

  swipeUp: {
    y: -500,
    scale: 1.1,
    opacity: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },

  // Press feedback
  buttonPress: {
    scale: 0.95,
    transition: { duration: 0.1 },
  },

  buttonTap: {
    scale: 0.98,
    transition: { duration: 0.08 },
  },

  // Success
  matchCelebration: {
    scale: [1, 1.2, 1],
    rotate: [0, 10, -10, 0],
    transition: { duration: 0.6, ease: 'easeInOut' },
  },

  heartbeat: {
    scale: [1, 1.15, 1],
    transition: { duration: 0.3, ease: 'easeInOut' },
  },

  // Loading
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'easeInOut',
    },
  },

  spin: {
    rotate: 360,
    transition: {
      repeat: Infinity,
      duration: 1,
      ease: 'linear',
    },
  },

  shimmer: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: 'linear',
    },
  },
};

// Spring Configs
export const springs = {
  // Smooth, natural spring
  smooth: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  },

  // Bouncy spring
  bouncy: {
    type: 'spring',
    stiffness: 400,
    damping: 15,
    mass: 0.5,
  },

  // Gentle spring
  gentle: {
    type: 'spring',
    stiffness: 200,
    damping: 40,
    mass: 1,
  },

  // Snappy spring
  snappy: {
    type: 'spring',
    stiffness: 500,
    damping: 25,
    mass: 0.6,
  },
};

// Breakpoints
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Z-Index Scale
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  notification: 1700,
};

// Transitions
export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  smooth: '400ms cubic-bezier(0.4, 0, 0.2, 1)',
};

// Card Dimensions
export const cardDimensions = {
  width: {
    mobile: '90vw',
    tablet: '420px',
    desktop: '480px',
  },
  height: {
    mobile: 'calc(100vh - 280px)',
    tablet: '600px',
    desktop: '680px',
  },
  aspectRatio: '3/4',
};

// Haptic Feedback Patterns (for mobile)
export const haptics = {
  light: { duration: 10, intensity: 0.5 },
  medium: { duration: 20, intensity: 0.7 },
  heavy: { duration: 30, intensity: 1 },
  success: { duration: 15, intensity: 0.8 },
  warning: { duration: 25, intensity: 0.9 },
  error: { duration: 40, intensity: 1 },
};

// Export all as default
export default {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  animations,
  springs,
  breakpoints,
  zIndex,
  transitions,
  cardDimensions,
  haptics,
};

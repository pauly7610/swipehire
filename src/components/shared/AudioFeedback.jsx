/**
 * Audio Feedback System for SwipeHire
 * Provides subtle, brand-aligned notification sounds
 */

class AudioFeedback {
  constructor() {
    this.enabled = localStorage.getItem('swipehire_audio_enabled') !== 'false';
    this.audioContext = null;
    this.gainNode = null;
    
    // Initialize on first user interaction
    this.initialized = false;
  }

  init() {
    if (this.initialized || typeof window === 'undefined') return;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = 0.3; // Subtle volume
      this.initialized = true;
    } catch (e) {
      console.warn('Audio feedback unavailable:', e);
    }
  }

  // Play a tone
  playTone(frequency = 440, duration = 0.1, type = 'sine') {
    if (!this.enabled || !this.audioContext) return;
    
    this.init();
    if (!this.initialized) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Swipe sounds
  swipeRight() {
    this.playTone(800, 0.08, 'sine'); // Uplifting
    setTimeout(() => this.playTone(1000, 0.06, 'sine'), 50);
  }

  swipeLeft() {
    this.playTone(400, 0.12, 'sine'); // Dismissive
  }

  swipeSuper() {
    this.playTone(600, 0.05, 'sine');
    setTimeout(() => this.playTone(800, 0.05, 'sine'), 40);
    setTimeout(() => this.playTone(1200, 0.08, 'sine'), 80);
  }

  // Match celebration
  match() {
    this.playTone(800, 0.1, 'sine');
    setTimeout(() => this.playTone(1000, 0.1, 'sine'), 80);
    setTimeout(() => this.playTone(1200, 0.15, 'sine'), 160);
  }

  // Notification
  notification() {
    this.playTone(900, 0.08, 'sine');
    setTimeout(() => this.playTone(1100, 0.1, 'sine'), 70);
  }

  // Success (application sent, etc)
  success() {
    this.playTone(700, 0.06, 'sine');
    setTimeout(() => this.playTone(900, 0.08, 'sine'), 50);
    setTimeout(() => this.playTone(1100, 0.12, 'sine'), 100);
  }

  // Error
  error() {
    this.playTone(300, 0.15, 'square');
  }

  // Click/tap
  click() {
    this.playTone(1000, 0.03, 'sine');
  }

  // Toggle audio on/off
  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('swipehire_audio_enabled', this.enabled);
    return this.enabled;
  }
}

export const audioFeedback = new AudioFeedback();

// Make globally available
if (typeof window !== 'undefined') {
  window.audioFeedback = audioFeedback;
}

export default audioFeedback;
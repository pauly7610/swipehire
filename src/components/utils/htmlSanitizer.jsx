/**
 * HTML Sanitization Utility for SwipeHire
 * 
 * Purpose: Safely render user-generated HTML content (profile bios, experience descriptions, etc.)
 * while preventing XSS attacks and cleaning up malformed HTML.
 * 
 * Approach: Use DOMPurify to sanitize and allow only safe tags.
 * Allowed tags: p, br, ul, ol, li, b, strong, i, em, a, span, div
 * All other tags are stripped, leaving clean text.
 */

import DOMPurify from 'dompurify';

// Configure DOMPurify with allowed tags and attributes
const ALLOWED_TAGS = ['p', 'br', 'ul', 'ol', 'li', 'b', 'strong', 'i', 'em', 'a', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'class'];

/**
 * Sanitize HTML string for safe rendering
 * @param {string} html - Raw HTML string
 * @param {object} options - Sanitization options
 * @returns {string} - Sanitized HTML or plain text
 */
export function sanitizeHTML(html, options = {}) {
  if (!html) return '';
  
  const {
    stripAll = false, // If true, remove all HTML and return plain text
    preserveNewlines = true, // Convert <br> to \n in plain text mode
    maxLength = null // Truncate to max length if specified
  } = options;

  // Strip all HTML if requested
  if (stripAll) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    let text = temp.textContent || temp.innerText || '';
    
    // Preserve basic formatting
    if (preserveNewlines) {
      text = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '');
    }
    
    text = text.trim();
    if (maxLength && text.length > maxLength) {
      text = text.substring(0, maxLength) + '...';
    }
    return text;
  }

  // Sanitize with allowed tags
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    KEEP_CONTENT: true, // Keep content even if tag is not allowed
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false
  });

  // Handle empty or whitespace-only results
  const temp = document.createElement('div');
  temp.innerHTML = clean;
  const text = temp.textContent || temp.innerText || '';
  
  if (!text.trim()) return '';
  
  return clean;
}

/**
 * Create safe innerHTML object for React dangerouslySetInnerHTML
 * @param {string} html - Raw HTML string
 * @returns {object} - Object with __html property
 */
export function createSafeHTML(html) {
  return { __html: sanitizeHTML(html) };
}

/**
 * Extract plain text from HTML for search indexing
 * @param {string} html - Raw HTML string
 * @returns {string} - Plain text without any HTML
 */
export function extractPlainText(html) {
  return sanitizeHTML(html, { stripAll: true, preserveNewlines: false });
}

/**
 * Truncate HTML content to specified length while preserving tags
 * @param {string} html - Raw HTML string
 * @param {number} maxLength - Maximum character length
 * @returns {string} - Truncated and sanitized HTML
 */
export function truncateHTML(html, maxLength = 200) {
  const cleaned = sanitizeHTML(html);
  const temp = document.createElement('div');
  temp.innerHTML = cleaned;
  const text = temp.textContent || temp.innerText || '';
  
  if (text.length <= maxLength) return cleaned;
  
  // Truncate plain text and return
  return sanitizeHTML(text.substring(0, maxLength) + '...', { stripAll: false });
}

/**
 * Highlight search terms in HTML content
 * @param {string} html - Raw HTML string
 * @param {string[]} terms - Search terms to highlight
 * @returns {string} - HTML with highlighted terms
 */
export function highlightTerms(html, terms = []) {
  if (!terms.length || !html) return sanitizeHTML(html);
  
  let result = sanitizeHTML(html);
  const plainText = extractPlainText(html);
  
  terms.forEach(term => {
    const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
    result = result.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900/50">$1</mark>');
  });
  
  return result;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default {
  sanitizeHTML,
  createSafeHTML,
  extractPlainText,
  truncateHTML,
  highlightTerms
};
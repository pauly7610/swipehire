/**
 * Enhanced ATS Search Engine
 * 
 * Searches across ALL candidate data:
 * - Structured fields (name, title, skills, location, etc.)
 * - Profile content (bio, experience descriptions, education, certifications)
 * - Resume content (parsed text from uploaded resumes)
 * 
 * Returns ranked results with match explanations
 */

import { extractPlainText } from '@/components/utils/htmlSanitizer';

class EnhancedATSSearch {
  constructor() {
    // Weight multipliers for different data sources
    this.weights = {
      name: 10,
      headline: 8,
      skills: 9,
      experience_title: 7,
      experience_company: 6,
      experience_description: 5,
      bio: 5,
      resume_text: 6,
      resume_metadata: 7,
      education: 4,
      certifications: 5,
      location: 3
    };
  }

  /**
   * Build comprehensive searchable index for a candidate
   */
  buildCandidateIndex(candidate, user) {
    const index = {
      candidateId: candidate.id,
      sources: {},
      fullText: ''
    };

    // Name (highest priority)
    if (user?.full_name) {
      index.sources.name = user.full_name.toLowerCase();
    }

    // Headline/Title
    if (candidate?.headline) {
      index.sources.headline = candidate.headline.toLowerCase();
    }

    // Skills (exact match priority)
    if (candidate?.skills?.length > 0) {
      index.sources.skills = candidate.skills.join(' ').toLowerCase();
    }

    // Bio (sanitized and plain text)
    if (candidate?.bio) {
      index.sources.bio = extractPlainText(candidate.bio).toLowerCase();
    }

    // Location
    if (candidate?.location) {
      index.sources.location = candidate.location.toLowerCase();
    }

    // Experience (titles, companies, descriptions)
    if (candidate?.experience?.length > 0) {
      const experienceTitles = [];
      const experienceCompanies = [];
      const experienceDescriptions = [];

      candidate.experience.forEach(exp => {
        if (exp.title) experienceTitles.push(exp.title.toLowerCase());
        if (exp.company) experienceCompanies.push(exp.company.toLowerCase());
        if (exp.description) {
          experienceDescriptions.push(extractPlainText(exp.description).toLowerCase());
        }
      });

      index.sources.experience_title = experienceTitles.join(' ');
      index.sources.experience_company = experienceCompanies.join(' ');
      index.sources.experience_description = experienceDescriptions.join(' ');
    }

    // Education
    if (candidate?.education?.length > 0) {
      const educationText = candidate.education.map(edu => 
        `${edu.degree || ''} ${edu.major || ''} ${edu.university || ''}`.toLowerCase()
      ).join(' ');
      index.sources.education = educationText;
    }

    // Certifications
    if (candidate?.certifications?.length > 0) {
      const certText = candidate.certifications.map(cert =>
        `${cert.name || ''} ${cert.issuer || ''}`.toLowerCase()
      ).join(' ');
      index.sources.certifications = certText;
    }

    // CRITICAL: Resume parsed text (full text search)
    if (candidate?.resume_parsed_text) {
      index.sources.resume_text = candidate.resume_parsed_text.toLowerCase();
    }

    // Resume metadata (structured resume data)
    if (candidate?.resume_parsed_metadata) {
      try {
        const metadata = typeof candidate.resume_parsed_metadata === 'string' 
          ? JSON.parse(candidate.resume_parsed_metadata)
          : candidate.resume_parsed_metadata;
        
        const metadataText = [
          metadata.summary || '',
          ...(metadata.skills || []),
          ...(metadata.experience_highlights || []),
          ...(metadata.education_highlights || [])
        ].join(' ').toLowerCase();
        
        index.sources.resume_metadata = metadataText;
      } catch (e) {
        console.warn('Failed to parse resume metadata:', e);
      }
    }

    // Build combined full text for fallback search
    index.fullText = Object.values(index.sources).join(' ');

    return index;
  }

  /**
   * Search candidates with comprehensive matching
   * @param {string} query - Search query
   * @param {Array} candidates - Array of candidate objects
   * @param {Object} usersMap - Map of user IDs to user objects
   * @returns {Array} - Array of {candidate, score, matches} objects
   */
  search(query, candidates, usersMap = {}) {
    if (!query?.trim()) {
      return candidates.map(c => ({ candidate: c, score: 0, matches: [] }));
    }

    const terms = this.extractSearchTerms(query);
    const results = [];

    candidates.forEach(candidate => {
      const user = usersMap[candidate.user_id];
      const index = this.buildCandidateIndex(candidate, user);
      
      let score = 0;
      const matches = [];

      // Score each search term against all data sources
      terms.forEach(term => {
        Object.entries(index.sources).forEach(([source, text]) => {
          if (text && text.includes(term)) {
            const weight = this.weights[source] || 1;
            const occurrences = (text.match(new RegExp(term, 'gi')) || []).length;
            const termScore = weight * occurrences;
            
            score += termScore;
            
            // Track match source for explanation
            if (!matches.some(m => m.source === source)) {
              matches.push({
                source: this.formatSourceName(source),
                term: term,
                snippet: this.extractSnippet(text, term)
              });
            }
          }
        });
      });

      if (score > 0 || matches.length > 0) {
        results.push({
          candidate,
          user,
          score,
          matches
        });
      }
    });

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return results;
  }

  /**
   * Extract search terms from query (handle basic boolean)
   */
  extractSearchTerms(query) {
    // Remove boolean operators for term extraction
    const cleaned = query
      .replace(/\bAND\b|\bOR\b|\bNOT\b/gi, ' ')
      .replace(/[()]/g, ' ');

    // Extract quoted phrases
    const phrases = [];
    const phraseRegex = /"([^"]+)"/g;
    let match;
    while ((match = phraseRegex.exec(query)) !== null) {
      phrases.push(match[1].toLowerCase());
    }

    // Extract individual terms
    const terms = cleaned
      .toLowerCase()
      .split(/\s+/)
      .filter(t => t.length > 2 && !['and', 'or', 'not'].includes(t));

    return [...new Set([...phrases, ...terms])];
  }

  /**
   * Extract snippet around matched term
   */
  extractSnippet(text, term, contextLength = 60) {
    const index = text.toLowerCase().indexOf(term.toLowerCase());
    if (index === -1) return text.substring(0, 100);

    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + term.length + contextLength);
    
    let snippet = text.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    return snippet;
  }

  /**
   * Format source name for display
   */
  formatSourceName(source) {
    const names = {
      name: 'Name',
      headline: 'Job Title',
      skills: 'Skills',
      experience_title: 'Past Job Title',
      experience_company: 'Company',
      experience_description: 'Experience Details',
      bio: 'Profile Bio',
      resume_text: 'Resume',
      resume_metadata: 'Resume',
      education: 'Education',
      certifications: 'Certifications',
      location: 'Location'
    };
    return names[source] || source;
  }

  /**
   * Generate match summary for candidate
   */
  getMatchSummary(matches) {
    if (!matches || matches.length === 0) return null;

    // Group matches by source
    const grouped = matches.reduce((acc, match) => {
      if (!acc[match.source]) acc[match.source] = [];
      acc[match.source].push(match.term);
      return acc;
    }, {});

    // Build summary text
    const summaries = Object.entries(grouped).map(([source, terms]) => {
      const uniqueTerms = [...new Set(terms)];
      return `${source}: "${uniqueTerms.join('", "')}"`;
    });

    return summaries.slice(0, 3).join(' • '); // Show top 3 sources
  }
}

export default EnhancedATSSearch;
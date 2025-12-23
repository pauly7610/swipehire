import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, filters = {} } = await req.json();

    // Get all candidates
    let candidates = await base44.entities.Candidate.list();

    // Apply structured filters first
    if (filters.experience_level) {
      candidates = candidates.filter(c => c.experience_level === filters.experience_level);
    }
    if (filters.industry) {
      candidates = candidates.filter(c => c.industry === filters.industry);
    }
    if (filters.location) {
      candidates = candidates.filter(c => c.location === filters.location);
    }
    if (filters.min_experience) {
      candidates = candidates.filter(c => (c.experience_years || 0) >= filters.min_experience);
    }
    if (filters.max_experience) {
      candidates = candidates.filter(c => (c.experience_years || 0) <= filters.max_experience);
    }

    // Boolean search on resume text + structured fields
    if (query && query.trim()) {
      const normalizedQuery = query.toLowerCase().trim();

      // Parse Boolean operators
      const andParts = normalizedQuery.split(/\s+and\s+/i);
      
      candidates = candidates.filter(candidate => {
        // Build searchable text from all fields
        const searchableText = [
          candidate.resume_normalized_text || '',
          candidate.headline || '',
          candidate.bio || '',
          (candidate.skills || []).join(' '),
          (candidate.experience || []).map(e => `${e.title} ${e.company} ${e.description || ''}`).join(' ')
        ].join(' ').toLowerCase();

        // All AND conditions must match
        return andParts.every(andPart => {
          // Handle OR within AND parts
          const orParts = andPart.split(/\s+or\s+/i);
          
          // At least one OR condition must match
          return orParts.some(orPart => {
            // Handle NOT
            if (orPart.trim().startsWith('not ')) {
              const notTerm = orPart.replace(/^not\s+/i, '').trim();
              return !searchableText.includes(notTerm);
            }
            
            // Positive match
            return searchableText.includes(orPart.trim());
          });
        });
      });
    }

    // Add match context for each candidate
    const resultsWithContext = candidates.map(candidate => {
      const matchReasons = [];
      
      if (query) {
        const queryLower = query.toLowerCase();
        
        if (candidate.resume_normalized_text?.toLowerCase().includes(queryLower)) {
          matchReasons.push('Resume content');
        }
        if (candidate.headline?.toLowerCase().includes(queryLower)) {
          matchReasons.push('Job title');
        }
        if (candidate.skills?.some(s => s.toLowerCase().includes(queryLower))) {
          matchReasons.push('Skills');
        }
        if (candidate.bio?.toLowerCase().includes(queryLower)) {
          matchReasons.push('Bio');
        }
      }

      return {
        ...candidate,
        match_context: matchReasons.length > 0 ? matchReasons : ['Profile match']
      };
    });

    return Response.json({
      success: true,
      candidates: resultsWithContext,
      total: resultsWithContext.length
    });

  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});
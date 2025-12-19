// Enterprise-grade Boolean Search Parser for ATS
// Supports: AND, OR, NOT, parentheses, phrase matching, skill synonyms

const SKILL_SYNONYMS = {
  'javascript': ['js', 'typescript', 'ts', 'ecmascript', 'node.js', 'nodejs'],
  'react': ['reactjs', 'react.js', 'react native'],
  'python': ['py', 'django', 'flask', 'fastapi'],
  'java': ['java', 'spring', 'springboot', 'kotlin'],
  'aws': ['amazon web services', 'ec2', 'lambda', 's3'],
  'azure': ['microsoft azure', 'azure cloud'],
  'gcp': ['google cloud', 'google cloud platform'],
  'senior': ['sr', 'sr.', 'lead', 'principal', 'staff'],
  'engineer': ['developer', 'programmer', 'coder', 'eng'],
  'frontend': ['front-end', 'front end', 'ui developer'],
  'backend': ['back-end', 'back end', 'server side'],
  'fullstack': ['full-stack', 'full stack'],
  'devops': ['dev ops', 'sre', 'site reliability'],
  'manager': ['mgr', 'management', 'lead'],
  'designer': ['ux', 'ui', 'product designer'],
};

// Title normalization (seniority levels)
const TITLE_LEVELS = {
  'junior': ['jr', 'jr.', 'junior', 'entry', 'associate'],
  'mid': ['mid-level', 'intermediate', 'regular'],
  'senior': ['sr', 'sr.', 'senior', 'lead'],
  'staff': ['staff', 'principal', 'architect'],
  'executive': ['vp', 'director', 'chief', 'head of', 'cto', 'cio'],
};

class BooleanSearchParser {
  constructor() {
    this.position = 0;
    this.tokens = [];
  }

  // Tokenize the search query
  tokenize(query) {
    const tokens = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = null;

    for (let i = 0; i < query.length; i++) {
      const char = query[i];
      
      // Handle quotes for phrase matching
      if ((char === '"' || char === "'") && !inQuotes) {
        if (current.trim()) tokens.push(current.trim());
        current = '';
        inQuotes = true;
        quoteChar = char;
        continue;
      } else if (char === quoteChar && inQuotes) {
        if (current) {
          tokens.push({ type: 'PHRASE', value: current });
        }
        current = '';
        inQuotes = false;
        quoteChar = null;
        continue;
      }

      if (inQuotes) {
        current += char;
        continue;
      }

      // Handle parentheses
      if (char === '(') {
        if (current.trim()) tokens.push(current.trim());
        tokens.push({ type: 'LPAREN' });
        current = '';
      } else if (char === ')') {
        if (current.trim()) tokens.push(current.trim());
        tokens.push({ type: 'RPAREN' });
        current = '';
      } else if (char === ' ') {
        if (current.trim()) tokens.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) tokens.push(current.trim());

    return tokens;
  }

  // Expand terms with synonyms
  expandTermWithSynonyms(term) {
    const lowerTerm = term.toLowerCase();
    const expanded = [lowerTerm];

    // Check skill synonyms
    for (const [key, synonyms] of Object.entries(SKILL_SYNONYMS)) {
      if (key === lowerTerm || synonyms.includes(lowerTerm)) {
        expanded.push(key, ...synonyms);
        break;
      }
    }

    // Check title levels
    for (const [key, variations] of Object.entries(TITLE_LEVELS)) {
      if (key === lowerTerm || variations.includes(lowerTerm)) {
        expanded.push(key, ...variations);
        break;
      }
    }

    return [...new Set(expanded)]; // Remove duplicates
  }

  // Parse the boolean expression
  parse(query) {
    this.tokens = this.tokenize(query);
    this.position = 0;

    if (this.tokens.length === 0) {
      return { type: 'EMPTY' };
    }

    return this.parseExpression();
  }

  parseExpression() {
    let left = this.parseTerm();

    while (this.position < this.tokens.length) {
      const token = this.tokens[this.position];
      
      if (typeof token === 'string' && token.toUpperCase() === 'OR') {
        this.position++;
        const right = this.parseTerm();
        left = { type: 'OR', left, right };
      } else if (typeof token === 'string' && token.toUpperCase() === 'AND') {
        this.position++;
        const right = this.parseTerm();
        left = { type: 'AND', left, right };
      } else if (token?.type === 'RPAREN') {
        break;
      } else if (typeof token === 'string' && !['AND', 'OR', 'NOT'].includes(token.toUpperCase())) {
        // Implicit AND
        const right = this.parseTerm();
        left = { type: 'AND', left, right };
      } else {
        break;
      }
    }

    return left;
  }

  parseTerm() {
    const token = this.tokens[this.position];

    // Handle NOT
    if (typeof token === 'string' && token.toUpperCase() === 'NOT') {
      this.position++;
      const operand = this.parseTerm();
      return { type: 'NOT', operand };
    }

    // Handle negation with minus sign
    if (typeof token === 'string' && token.startsWith('-') && token.length > 1) {
      this.position++;
      const term = token.substring(1);
      return { type: 'NOT', operand: { type: 'TERM', value: term, expanded: this.expandTermWithSynonyms(term) } };
    }

    // Handle parentheses
    if (token?.type === 'LPAREN') {
      this.position++;
      const expression = this.parseExpression();
      if (this.tokens[this.position]?.type === 'RPAREN') {
        this.position++;
      }
      return expression;
    }

    // Handle phrase
    if (token?.type === 'PHRASE') {
      this.position++;
      return { type: 'PHRASE', value: token.value };
    }

    // Handle term
    if (typeof token === 'string' && !['AND', 'OR', 'NOT'].includes(token.toUpperCase())) {
      this.position++;
      return { type: 'TERM', value: token, expanded: this.expandTermWithSynonyms(token) };
    }

    this.position++;
    return { type: 'EMPTY' };
  }

  // Evaluate the parsed expression against candidate data
  evaluate(ast, searchableText) {
    if (!ast || ast.type === 'EMPTY') return true;

    switch (ast.type) {
      case 'AND':
        return this.evaluate(ast.left, searchableText) && this.evaluate(ast.right, searchableText);
      
      case 'OR':
        return this.evaluate(ast.left, searchableText) || this.evaluate(ast.right, searchableText);
      
      case 'NOT':
        return !this.evaluate(ast.operand, searchableText);
      
      case 'PHRASE':
        return searchableText.includes(ast.value.toLowerCase());
      
      case 'TERM':
        // Check if any expanded term matches
        return ast.expanded.some(term => searchableText.includes(term));
      
      default:
        return true;
    }
  }

  // Main search function
  search(query, candidate, user) {
    if (!query.trim()) return true;

    try {
      const ast = this.parse(query);
      
      // Build comprehensive searchable text
      const searchableText = [
        user?.full_name || '',
        user?.email || '',
        candidate?.headline || '',
        candidate?.location || '',
        candidate?.bio || '',
        candidate?.experience_level || '',
        ...(candidate?.skills || []),
        ...(candidate?.experience?.map(e => `${e.title} ${e.company} ${e.description || ''}`) || []),
        ...(candidate?.education?.map(e => `${e.degree || ''} ${e.major || ''} ${e.university || ''}`) || []),
        ...(candidate?.certifications?.map(c => `${c.name || ''} ${c.issuer || ''}`) || []),
        candidate?.resume_url ? 'has_resume resume uploaded' : '',
        candidate?.video_intro_url ? 'has_video video_intro' : '',
      ].join(' ').toLowerCase();

      return this.evaluate(ast, searchableText);
    } catch (error) {
      console.error('Boolean search parse error:', error);
      // Fallback to simple search
      const terms = query.toLowerCase().split(/\s+/);
      const text = searchableText.toLowerCase();
      return terms.every(term => text.includes(term));
    }
  }

  // Validate query syntax
  validate(query) {
    try {
      const tokens = this.tokenize(query);
      let parenCount = 0;
      let quoteCount = 0;

      for (const token of tokens) {
        if (token?.type === 'LPAREN') parenCount++;
        if (token?.type === 'RPAREN') parenCount--;
        if (parenCount < 0) {
          return { valid: false, error: 'Mismatched parentheses' };
        }
      }

      if (parenCount !== 0) {
        return { valid: false, error: 'Unclosed parentheses' };
      }

      // Try parsing
      this.parse(query);
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Get search suggestions
  getSuggestions(query) {
    const suggestions = [];
    const lastToken = query.split(/\s+/).pop()?.toLowerCase() || '';

    if (lastToken.length >= 2) {
      // Suggest skills
      for (const [skill, synonyms] of Object.entries(SKILL_SYNONYMS)) {
        if (skill.startsWith(lastToken) || synonyms.some(s => s.startsWith(lastToken))) {
          suggestions.push({ type: 'skill', value: skill, label: `${skill} (skill)` });
        }
      }

      // Suggest title levels
      for (const [level, variations] of Object.entries(TITLE_LEVELS)) {
        if (level.startsWith(lastToken) || variations.some(v => v.startsWith(lastToken))) {
          suggestions.push({ type: 'title', value: level, label: `${level} (level)` });
        }
      }
    }

    return suggestions.slice(0, 5);
  }
}

export default BooleanSearchParser;
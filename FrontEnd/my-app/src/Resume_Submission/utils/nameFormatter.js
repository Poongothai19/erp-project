// utils/nameFormatter.js

/**
 * Format a single name or title to proper case
 * Preserves initials (single letters) as uppercase
 * 
 * Examples:
 * - "META SHANKAR" -> "Meta Shankar"
 * - "BECKY B PAREDES" -> "Becky B Paredes" (preserves middle initial)
 * - "JOHN D. SMITH" -> "John D. Smith" (preserves initial with dot)
 * - "JEEVAN KUMAR" -> "Jeevan Kumar"
 * - "KARTHICK RAJ" -> "Karthick Raj"
 * - "SENIOR SOFTWARE ENGINEER" -> "Senior Software Engineer" (when used as job title)
 * 
 * @param {string} name - The name to format
 * @returns {string} Formatted name
 */
export const formatName = (name) => {
  if (!name || typeof name !== 'string') return name || '';
  
  const trimmed = name.trim();
  if (!trimmed) return '';
  
  // Split while preserving hyphens and spaces
  const words = trimmed.split(/([-\s])/);
  
  return words.map(word => {
    // Preserve separators (spaces and hyphens)
    if (word === ' ' || word === '-') return word;
    if (!word) return '';
    
    // Check if the word is a single letter (initial) or a single letter with dot
    if (/^[A-Za-z]\.?$/.test(word)) {
      // It's an initial - keep it uppercase
      return word.toUpperCase();
    }
    
    const lowerWord = word.toLowerCase();
    
    // Handle special prefixes
    if (lowerWord.startsWith('mc')) {
      return 'Mc' + word.charAt(2).toUpperCase() + word.slice(3).toLowerCase();
    }
    if (lowerWord.startsWith("o'")) {
      return "O'" + word.charAt(2).toUpperCase() + word.slice(3).toLowerCase();
    }
    if (lowerWord.startsWith("mac")) {
      return 'Mac' + word.charAt(3).toUpperCase() + word.slice(4).toLowerCase();
    }
    
    // Handle roman numerals (II, III, IV, etc.) - keep them uppercase
    if (/^(II|III|IV|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX)$/i.test(word)) {
      return word.toUpperCase();
    }
    
    // Handle common abbreviations (PhD, MD, etc.) - keep them uppercase
    const abbreviations = ['phd', 'md', 'jd', 'dds', 'dvm', 'rn', 'lpn', 'cpa', 'cfa', 'pe', 'ra', 'aia'];
    if (abbreviations.includes(lowerWord)) {
      return word.toUpperCase();
    }
    
    // Handle words with dots (like "J.R.R." or "Ph.D.")
    if (word.includes('.')) {
      return word.split('.').map(part => {
        if (!part) return '';
        // If the part is a single letter, keep it uppercase
        if (part.length === 1) {
          return part.toUpperCase();
        }
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }).join('.');
    }
    
    // Handle common two-letter words that should remain lowercase (like "van", "der", "de")
    const twoLetterExceptions = ['van', 'der', 'de', 'la', 'le', 'el'];
    if (twoLetterExceptions.includes(lowerWord) && word.length === 2) {
      return lowerWord;
    }
    
    // Default: capitalize first letter, lowercase the rest
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join('');
};

/**
 * Format job title (converts ALL CAPS to proper case)
 * 
 * Examples:
 * - "SENIOR SOFTWARE ENGINEER" -> "Senior Software Engineer"
 * - "LEAD JAVA FULL STACK DEVELOPER" -> "Lead Java Full Stack Developer"
 * - "PYTHON LEAD ENGINEER" -> "Python Lead Engineer"
 * - "DEVOPS ENGINEER" -> "DevOps Engineer"
 * - "UI/UX DESIGNER" -> "UI/UX Designer"
 * 
 * @param {string} title - Job title to format
 * @returns {string} Formatted job title
 */
export const formatJobTitle = (title) => {
  if (!title) return '';
  
  // Split by common delimiters but preserve them
  const words = title.split(/([-\s/])/);
  
  return words.map(word => {
    if (word === ' ' || word === '-' || word === '/') return word;
    if (!word) return '';
    
    // Special case for known acronyms only (keep uppercase)
    const knownAcronyms = [
      'UI', 'UX', 'AI', 'ML', 'API', 'AWS', 'GCP', 'SQL', 'ETL', 'ERP', 'CRM', 'SAP',
      'HR', 'IT', 'QA', 'BA', 'PM', 'VP', 'CTO', 'CFO', 'CEO', 'COO', 'CIO', 'CISO',
      'SEO', 'SEM', 'SRE', 'AR', 'VR', 'ERP', 'MVC', 'REST', 'SOAP', 'JSON', 'XML',
      'HTML', 'CSS', 'PHP', 'NET', 'iOS', 'RPA', 'BI', 'DBA', 'ETL', 'MDM', 'SLA',
      'KPI', 'OKR', 'B2B', 'B2C', 'SaaS', 'PaaS', 'IaaS', 'CI', 'CD', 'PR', 'USA',
    ];
    if (/^[A-Z]{2,}$/.test(word) && knownAcronyms.includes(word)) return word;
    
    // Special case for single letters (like "B" in "Becky B Paredes") - shouldn't happen in job titles
    // but handle gracefully
    if (/^[A-Za-z]\.?$/.test(word)) {
      return word.toUpperCase();
    }
    
    // Special case for words that should remain lowercase (like "and", "or", "of", "the")
    const lowerWord = word.toLowerCase();
    const keepLowercase = ['and', 'or', 'of', 'the', 'in', 'at', 'on', 'for', 'to', 'with'];
    if (keepLowercase.includes(lowerWord) && word.length > 1) {
      return lowerWord;
    }
    
    // Handle special tech terms
    if (lowerWord === 'devops') return 'DevOps';
    if (lowerWord === 'ios') return 'iOS';
    if (lowerWord === 'android') return 'Android';
    if (lowerWord === 'ui' || lowerWord === 'ux') return word.toUpperCase();
    if (lowerWord === 'ai' || lowerWord === 'ml') return word.toUpperCase();
    if (lowerWord === 'api') return 'API';
    if (lowerWord === 'aws') return 'AWS';
    if (lowerWord === 'gcp') return 'GCP';
    if (lowerWord === 'azure') return 'Azure';
    
    // Handle words with dots (like "Ph.D.")
    if (word.includes('.')) {
      return word.split('.').map(part => {
        if (!part) return '';
        // If the part is a single letter, keep it uppercase
        if (part.length === 1) {
          return part.toUpperCase();
        }
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }).join('.');
    }
    
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join('');
};

/**
 * Format a full name with first, middle, and last parts
 * 
 * @param {string} firstName - First name
 * @param {string} middleName - Middle name (optional)
 * @param {string} lastName - Last name
 * @returns {string} Formatted full name
 */
export const formatFullName = (firstName, middleName, lastName) => {
  const parts = [
    formatName(firstName),
    formatName(middleName),
    formatName(lastName)
  ].filter(Boolean);
  
  return parts.join(' ');
};

/**
 * Apply formatting to an object's name fields
 * 
 * @param {Object} data - The data object
 * @param {Array} fields - Fields to format (default: ['FirstName', 'LastName', 'MiddleName', 'JobTitle'])
 * @returns {Object} Data with formatted fields
 */
export const formatNameFields = (data, fields = ['FirstName', 'LastName', 'MiddleName', 'JobTitle']) => {
  if (!data || typeof data !== 'object') return data;
  
  const formatted = { ...data };
  
  fields.forEach(field => {
    if (formatted[field] && typeof formatted[field] === 'string') {
      if (field === 'JobTitle') {
        formatted[field] = formatJobTitle(formatted[field]);
      } else {
        formatted[field] = formatName(formatted[field]);
      }
    }
  });
  
  return formatted;
};

/**
 * Format names in an array of objects
 * 
 * @param {Array} items - Array of objects
 * @param {Array} fields - Fields to format
 * @returns {Array} Array with formatted fields
 */
export const formatNameFieldsInArray = (items, fields = ['FirstName', 'LastName', 'MiddleName', 'JobTitle']) => {
  if (!Array.isArray(items)) return items;
  
  return items.map(item => formatNameFields(item, fields));
};
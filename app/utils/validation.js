// Input validation and sanitization utilities

export function validateProjectId(id) {
  const numId = Number(id);
  if (isNaN(numId) || numId <= 0 || !Number.isInteger(numId)) {
    throw new Error('Invalid project ID');
  }
  return numId;
}

export function validateDocumentId(id) {
  const numId = Number(id);
  if (isNaN(numId) || numId <= 0 || !Number.isInteger(numId)) {
    throw new Error('Invalid document ID');
  }
  return numId;
}

export function sanitizeString(str, maxLength = 255) {
  if (typeof str !== 'string') {
    return '';
  }
  // Remove potential XSS patterns and limit length
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
    .substring(0, maxLength);
}

export function validateJSON(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
}

export function validateFileSize(size, maxSizeBytes = 10 * 1024 * 1024) { // 10MB default
  if (size > maxSizeBytes) {
    throw new Error(`File size exceeds maximum allowed size of ${maxSizeBytes} bytes`);
  }
  return true;
}

export function validateFileName(fileName) {
  // Prevent directory traversal and dangerous filenames
  const sanitized = fileName.replace(/[^a-zA-Z0-9.-_]/g, '_');
  if (sanitized !== fileName) {
    throw new Error('Invalid characters in filename');
  }
  if (fileName.includes('..') || fileName.startsWith('.')) {
    throw new Error('Invalid filename pattern');
  }
  return fileName;
}

export function validateAnalysisConfig(config) {
  if (typeof config !== 'object' || config === null) {
    throw new Error('Analysis config must be an object');
  }
  
  for (const [tag, tagConfig] of Object.entries(config)) {
    if (!tagConfig.output_fields || !Array.isArray(tagConfig.output_fields)) {
      throw new Error(`Invalid output_fields for tag: ${tag}`);
    }
    
    for (const field of tagConfig.output_fields) {
      if (!field.name || typeof field.name !== 'string') {
        throw new Error(`Invalid field name in tag: ${tag}`);
      }
      if (!field.dtype || !['str', 'int', 'float', 'bool'].includes(field.dtype)) {
        throw new Error(`Invalid field data type in tag: ${tag}`);
      }
    }
  }
  
  return config;
}
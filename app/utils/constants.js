// File upload configuration
export const VALID_FILE_TYPES = [
  "application/pdf",
  "image/jpeg", 
  "image/png",
  "image/jpg",
];

// Security configurations
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_UPLOAD = 10;
export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

// MIME type validation mapping
export const MIME_TYPE_EXTENSIONS = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/jpg": [".jpg"]
};

export const DEFAULT_ANALYSIS_FIELDS = [
  { name: 'full_name', description: 'Name of surname of the main person appearing in the document', dtype: 'str' },
  { name: 'is_scanned', description: 'Is the document scanned or is it a digital document?', dtype: 'bool' },
  { name: 'language', description: 'Language of the document', dtype: 'str' },
  { name: 'is_notarized', description: 'Is it notarized / certified / apostilled?', dtype: 'bool' },
  { name: 'issue_date', description: 'Document issuing date', dtype: 'str' },
  { name: 'expiration_date', description: 'Expiration date if present', dtype: 'str' },
  { name: 'signed_by_notary', description: 'Signed by Public Notary, lawyer or similar?', dtype: 'bool' },
  { name: 'is_obstructed', description: 'Is the document obstructed or damaged?', dtype: 'bool' }
];

export const PRECISION_THRESHOLDS = {
  GOOD_CONFIDENCE: 80,
  WARNING_CONFIDENCE: 70,
  ERROR_CONFIDENCE: 70
};

export const FIELD_DATA_TYPES = [
  { value: 'str', label: 'String' },
  { value: 'int', label: 'Integer' },
  { value: 'float', label: 'Decimal' },
  { value: 'bool', label: 'Logical' }
];
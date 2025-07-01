import { PRECISION_THRESHOLDS } from './constants.js';

// Precision calculation helper functions
export const calculateTagPrecision = (tagResult) => {
  if (!tagResult.success || !tagResult.data) {
    return {
      avgConfidence: 0,
      lowConfidenceFields: 0,
      totalFields: 0,
      status: 'error'
    };
  }

  const fields = Object.entries(tagResult.data);
  const totalFields = fields.length;
  
  if (totalFields === 0) {
    return {
      avgConfidence: 0,
      lowConfidenceFields: 0,
      totalFields: 0,
      status: 'error'
    };
  }

  const confidenceScores = fields.map(([fieldName, fieldResult]) => {
    return {
      name: fieldName,
      confidence: fieldResult.confidence_degree ? fieldResult.confidence_degree * 10 : 0
    };
  });

  const avgConfidence = Math.round(confidenceScores.reduce((sum, field) => sum + field.confidence, 0) / totalFields);
  const lowConfidenceFields = confidenceScores.filter(field => field.confidence < PRECISION_THRESHOLDS.WARNING_CONFIDENCE);
  const lowConfidenceFieldNames = lowConfidenceFields.map(field => field.name);
  
  let status = 'good';
  if (avgConfidence < PRECISION_THRESHOLDS.ERROR_CONFIDENCE || lowConfidenceFields.length > totalFields / 2) {
    status = 'error';
  } else if (avgConfidence < PRECISION_THRESHOLDS.GOOD_CONFIDENCE || lowConfidenceFields.length > 0) {
    status = 'warning';
  }

  return {
    avgConfidence,
    lowConfidenceFields: lowConfidenceFields.length,
    lowConfidenceFieldNames,
    totalFields,
    status,
    processedDocs: tagResult.processedDocs || 0
  };
};

export const getOverallPrecisionStats = (results) => {
  if (!results || Object.keys(results).length === 0) {
    return {
      totalTags: 0,
      totalFields: 0,
      avgConfidence: 0,
      tagsWithWarnings: 0
    };
  }

  const tagStats = Object.entries(results).map(([tag, result]) => {
    return { tag, ...calculateTagPrecision(result) };
  });

  const totalTags = tagStats.length;
  const totalFields = tagStats.reduce((sum, stat) => sum + stat.totalFields, 0);
  const avgConfidence = Math.round(
    tagStats.reduce((sum, stat) => sum + stat.avgConfidence, 0) / totalTags
  );
  const tagsWithWarnings = tagStats.filter(stat => stat.status !== 'good').length;

  return {
    totalTags,
    totalFields,
    avgConfidence,
    tagsWithWarnings,
    tagStats
  };
};
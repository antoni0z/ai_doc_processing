export default function AnalysisResults({
  currentProjectAnalyzing,
  currentProjectResults,
  availableResultTags,
  currentResultTagIndex,
  navigateToNextResultTag,
  navigateToPrevResultTag,
  currentResultTag,
  getOverallPrecisionStats
}) {
  return (
    <section className="w-full md:w-1/2 p-6 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800">Analysis Results</h2>
        
        {/* Results Navigation Arrows */}
        {availableResultTags.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={navigateToPrevResultTag}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={navigateToNextResultTag}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {currentProjectAnalyzing && (
        <div className="flex items-center justify-center py-8">
          <div className="text-blue-600">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
          </div>
          <span className="ml-3 text-gray-600">Analyzing documents...</span>
        </div>
      )}
      
      {!currentProjectAnalyzing && !currentProjectResults && (
        <div className="text-sm text-gray-500">
          Configure analysis settings and click "Analyze Documents" to see results here.
        </div>
      )}
      
      {currentProjectResults && (
        <div className="space-y-4">
          {currentProjectResults.error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-medium text-red-800 mb-2">Error</h3>
              <p className="text-sm text-red-600">{currentProjectResults.error}</p>
            </div>
          ) : currentResultTag && currentProjectResults.results[currentResultTag] ? (
            <div className="space-y-4">
              {(() => {
                const tag = currentResultTag;
                const result = currentProjectResults.results[currentResultTag];
                
                return (
                  <div key={tag} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-gray-800">{tag}</h3>
                        {availableResultTags.length > 1 && (
                          <span className="text-xs text-gray-500">
                            {currentResultTagIndex + 1} of {availableResultTags.length}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          let copyText = `${tag}\n\n`;                      
                          if (Object.values(result.data || {}).some(
                            fieldResult => fieldResult.confidence_degree && fieldResult.confidence_degree < 70
                          )) {
                            copyText += `⚠️ Warning: Some fields have low confidence (<70%). Please review carefully.\n\n`;
                          }
                          
                          Object.entries(result.data || {}).forEach(([field, fieldResult]) => {
                            const confidence = fieldResult.confidence_degree ? Math.round(fieldResult.confidence_degree * 10) : 0;
                            
                            // Handle all types properly for copy
                            let displayValue;
                            if (fieldResult.result === null || fieldResult.result === undefined) {
                              displayValue = 'N/A';
                            } else if (typeof fieldResult.result === 'boolean') {
                              displayValue = fieldResult.result ? 'true' : 'false';
                            } else {
                              displayValue = String(fieldResult.result);
                            }
                            
                            copyText += `${field}: ${displayValue} (${confidence}%)\n`;
                          });
                          
                          navigator.clipboard.writeText(copyText);
                        }}
                        className="p-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded transition-colors"
                        title="Copy results"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="p-4">
                      {result.error ? (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                          {result.error}
                        </div>
                      ) : result.success ? (
                        <div>
                          <div className="space-y-1">
                            <div className="text-xs text-gray-500 mb-3">
                              {Object.values(result.data || {}).some(
                                fieldResult => fieldResult.confidence_degree && (fieldResult.confidence_degree * 10) < 70
                              ) && (
                                <span className="ml-2 text-yellow-600">Some fields need review</span>
                              )}
                            </div>
                            
                            {Object.entries(result.data || {}).map(([field, fieldResult]) => {
                              const confidence = fieldResult.confidence_degree ? Math.round(fieldResult.confidence_degree * 10) : 0;
                              const isLowConfidence = confidence < 70;
                              
                              // Convert result to string, handling all types properly
                              let displayValue;
                              if (fieldResult.result === null || fieldResult.result === undefined) {
                                displayValue = 'N/A';
                              } else if (typeof fieldResult.result === 'boolean') {
                                displayValue = fieldResult.result ? 'true' : 'false';
                              } else {
                                displayValue = String(fieldResult.result);
                              }
                              
                              return (
                                <div key={field} className="flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded">
                                  <div className="flex items-center gap-3 flex-1">
                                    <span className="text-sm font-medium text-gray-700 min-w-0">
                                      {field}:
                                    </span>
                                    <span className="text-sm text-gray-900 flex-1">
                                      {displayValue}
                                    </span>
                                  </div>
                                  <span className={`text-xs font-medium ${isLowConfidence ? 'text-yellow-600' : 'text-blue-600'}`}>
                                    {confidence}%
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No results available</div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              No results available for the selected tags.
            </div>
          )}
        </div>
      )}

      {/* Precision Dashboard */}
      {currentProjectResults && !currentProjectResults.error && currentProjectResults.results && Object.keys(currentProjectResults.results).length > 0 && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Analysis Precision Dashboard</h2>
        
        {(() => {
          const overallStats = getOverallPrecisionStats(currentProjectResults.results);
          
          return (
            <div className="space-y-6">
              {/* Overall Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`border rounded-lg p-4 text-center ${
                  overallStats.avgConfidence >= 80 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className={`text-2xl font-bold ${
                    overallStats.avgConfidence >= 80 
                      ? 'text-blue-600' 
                      : 'text-yellow-600'
                  }`}>
                    {overallStats.avgConfidence}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Confidence</div>
                </div>
                
                <div className={`border rounded-lg p-4 text-center ${
                  overallStats.tagsWithWarnings === 0 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className={`text-2xl font-bold ${
                    overallStats.tagsWithWarnings === 0 ? 'text-blue-600' : 'text-yellow-600'
                  }`}>
                    {overallStats.tagsWithWarnings}
                  </div>
                  <div className="text-sm text-gray-600">Tags with Warnings</div>
                </div>
              </div>

              {/* Per-Tag Details */}
              <div className="space-y-3">
                <h3 className="text-md font-medium text-gray-700">Tag Details</h3>
                <div className="space-y-3">
                  {overallStats.tagStats.map(stat => (
                    <div key={stat.tag} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                      <div className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="font-medium text-gray-800 min-w-0">
                            {stat.tag}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{stat.processedDocs} docs</span>
                            <span>{stat.totalFields} fields</span>
                            {stat.lowConfidenceFields > 0 && (
                              <span className="text-yellow-600">
                                {stat.lowConfidenceFields} need review
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className={`text-sm font-medium ${
                            stat.avgConfidence >= 80 
                              ? 'text-blue-600' 
                              : 'text-yellow-600'
                          }`}>
                            {stat.avgConfidence}%
                          </div>
                          
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            stat.status === 'good' 
                              ? 'bg-blue-100 text-blue-700' 
                              : stat.status === 'warning' 
                              ? 'bg-yellow-100 text-yellow-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {stat.status === 'good' ? 'Good' : stat.status === 'warning' ? 'Warning' : 'Error'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Fields breakdown */}
                      {stat.lowConfidenceFieldNames && stat.lowConfidenceFieldNames.length > 0 && (
                        <div className="px-3 pb-3">
                          <div className="text-xs text-gray-500 mb-1">Fields requiring review:</div>
                          <div className="flex flex-wrap gap-1">
                            {stat.lowConfidenceFieldNames.map(fieldName => (
                              <span key={fieldName} className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                                {fieldName}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
        </div>
      )}
    </section>
  );
}
import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { FIELD_DATA_TYPES } from "../utils/constants.js";

export default function TagConfiguration({
  projectTags,
  analysisConfig,
  setAnalysisConfig,
  onAnalyze,
  isAnalyzing,
  docs,
  saveTagConfigToCache,
}) {
  const [currentTagIndex, setCurrentTagIndex] = useState(0);


  const navigateToNextTag = () => {
    if (projectTags.length > 0) {
      setCurrentTagIndex((prev) => (prev + 1) % projectTags.length);
    }
  };

  const navigateToPrevTag = () => {
    if (projectTags.length > 0) {
      setCurrentTagIndex((prev) => (prev - 1 + projectTags.length) % projectTags.length);
    }
  };

  useEffect(() => {
    setCurrentTagIndex(0);
  }, [JSON.stringify(projectTags)]);


  const currentTag = projectTags[currentTagIndex] || null;


  const addOutputField = (tag) => {
    setAnalysisConfig(prev => {
      const newConfig = {
        ...prev,
        [tag]: {
          ...prev[tag],
          output_fields: [
            ...(prev[tag]?.output_fields || []),
            { name: '', description: '', dtype: 'str' }
          ]
        }
      };
      
      if (saveTagConfigToCache) {
        saveTagConfigToCache(tag, newConfig[tag]);
      }
      
      return newConfig;
    });
  };

  const updateOutputField = (tag, index, field, value) => {
    setAnalysisConfig(prev => {
      const newConfig = {
        ...prev,
        [tag]: {
          ...prev[tag],
          output_fields: prev[tag]?.output_fields?.map((f, i) => 
            i === index ? { ...f, [field]: value } : f
          ) || []
        }
      };
      
      if (saveTagConfigToCache) {
        saveTagConfigToCache(tag, newConfig[tag]);
      }
      
      return newConfig;
    });
  };

  const removeOutputField = (tag, index) => {
    setAnalysisConfig(prev => {
      const newConfig = {
        ...prev,
        [tag]: {
          ...prev[tag],
          output_fields: prev[tag]?.output_fields?.filter((_, i) => i !== index) || []
        }
      };
      
      if (saveTagConfigToCache) {
        saveTagConfigToCache(tag, newConfig[tag]);
      }
      
      return newConfig;
    });
  };

  const canAnalyze = projectTags.length > 0 && 
    Object.entries(analysisConfig)
      .filter(([tag]) => projectTags.includes(tag))
      .some(([tag, tagConfig]) => 
        tagConfig.output_fields && tagConfig.output_fields.length > 0 &&
        tagConfig.output_fields.some(field => field.name && field.description)
      ) &&
    docs.some(doc => {
      try {
        const docTags = doc.tags ? JSON.parse(doc.tags) : [];
        return docTags.length > 0 && projectTags.includes(docTags[0]);
      } catch {
        return false;
      }
    });

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700">Analysis Configuration</h3>
        
        {/* Tag Navigation Arrows */}
        {projectTags.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={navigateToPrevTag}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={navigateToNextTag}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        {projectTags.length > 0 ? (
          currentTag && (
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-800">{currentTag}</h4>
                {projectTags.length > 1 && (
                  <span className="text-xs text-gray-500">{currentTagIndex + 1} of {projectTags.length}</span>
                )}
              </div>
              <div className="space-y-3">
                <div className="text-sm text-gray-600 mb-2">Output config</div>
                
                {/* Output fields list */}
                <div className="space-y-2">
                  {(analysisConfig[currentTag]?.output_fields || []).map((field, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center p-2 rounded">
                      <input
                        type="text"
                        placeholder="Field name"
                        value={field.name}
                        onChange={(e) => updateOutputField(currentTag, index, 'name', e.target.value)}
                        className="flex-1 w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-200"
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        value={field.description}
                        onChange={(e) => updateOutputField(currentTag, index, 'description', e.target.value)}
                        className="flex-1 w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-200"
                      />
                      <div className="flex gap-2 items-center w-full sm:w-auto">
                        <select
                          value={field.dtype}
                          onChange={(e) => updateOutputField(currentTag, index, 'dtype', e.target.value)}
                          className="flex-1 sm:flex-none px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-200"
                        >
                          {FIELD_DATA_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeOutputField(currentTag, index)}
                          className="w-4 h-4 bg-gray-400 text-white text-xs rounded-full hover:bg-gray-600 transition-opacity flex items-center justify-center flex-shrink-0"
                        >
                          <XMarkIcon className="w-3 h-3"/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Add field button */}
                <button
                  onClick={() => addOutputField(currentTag)}
                  className="w-full py-2 px-3 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded transition-colors duration-200"
                >
                  + Add Output Field
                </button>
              </div>
            </div>
          )
        ) : (
          <p className="text-sm text-gray-500">Add project tags to configure analysis output fields</p>
        )}
      </div>
      
      {projectTags.length > 0 && (
        <button 
          onClick={onAnalyze}
          className="mt-6 w-full bg-gray-800 text-white py-2 px-4 rounded hover:bg-gray-900 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={isAnalyzing || !canAnalyze}
        >
          {isAnalyzing ? "Analyzing..." : "Analyze Documents"}
        </button>
      )}
    </div>
  );
}
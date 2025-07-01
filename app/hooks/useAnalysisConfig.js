import { useState, useEffect } from "react";
import { DEFAULT_ANALYSIS_FIELDS } from "../utils/constants.js";

export function useAnalysisConfig(activeProject, projectTags) {
  const [analysisConfig, setAnalysisConfig] = useState({});
  const [analysisResults, setAnalysisResults] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState({});

  const loadTagConfigFromCache = (tagName) => {
    try {
      const cached = localStorage.getItem(`tag_config_${activeProject.id}_${tagName}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error loading tag config from cache:', error);
      return null;
    }
  };

  const saveTagConfigToCache = (tagName, config) => {
    try {
      localStorage.setItem(`tag_config_${activeProject.id}_${tagName}`, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving tag config to cache:', error);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const newConfig = {};
    projectTags.forEach(tag => {
      const cachedConfig = loadTagConfigFromCache(tag);
      if (cachedConfig) {
        newConfig[tag] = cachedConfig;
      } else {
        newConfig[tag] = {
          output_fields: DEFAULT_ANALYSIS_FIELDS
        };
        saveTagConfigToCache(tag, newConfig[tag]);
      }
    });
    
    if (Object.keys(newConfig).length > 0) {
      setAnalysisConfig(prev => ({
        ...prev,
        ...newConfig
      }));
    }
  }, [JSON.stringify(projectTags), activeProject.id]);

  // Cleanup configurations when switching projects
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Clear configurations that don't belong to current project
    setAnalysisConfig(prev => {
      const filteredConfig = {};
      Object.entries(prev).forEach(([tag, config]) => {
        if (projectTags.includes(tag)) {
          filteredConfig[tag] = config;
        }
      });
      return filteredConfig;
    });
  }, [activeProject.id]);

  const analyzeDocuments = async () => {
    // Set analyzing state for current project only
    setIsAnalyzing(prev => ({
      ...prev,
      [activeProject.id]: true
    }));
    
    // Clear current project results
    setAnalysisResults(prev => ({
      ...prev,
      [activeProject.id]: null
    }));
    
    try {
      const formData = new FormData();
      formData.append("projectId", activeProject.id);
      formData.append("analysisConfig", JSON.stringify(analysisConfig));
      formData.append("projectDescription", activeProject.description || "");
      formData.append("projectTags", JSON.stringify(projectTags));
      
      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        const results = await response.json();
        // Store results per project
        setAnalysisResults(prev => ({
          ...prev,
          [activeProject.id]: results
        }));
      } else {
        const error = await response.text();
        setAnalysisResults(prev => ({
          ...prev,
          [activeProject.id]: { error: `API Error: ${error}` }
        }));
      }
    } catch (error) {
      console.error("Analysis error:", error);
      setAnalysisResults(prev => ({
        ...prev,
        [activeProject.id]: { error: `Network error: ${error.message}` }
      }));
    } finally {
      // Clear analyzing state for current project only
      setIsAnalyzing(prev => ({
        ...prev,
        [activeProject.id]: false
      }));
    }
  };

  // Get results for current project
  const currentProjectResults = analysisResults[activeProject.id] || null;
  const currentProjectAnalyzing = isAnalyzing[activeProject.id] || false;

  return {
    analysisConfig,
    setAnalysisConfig,
    analysisResults,
    isAnalyzing,
    currentProjectResults,
    currentProjectAnalyzing,
    analyzeDocuments,
    saveTagConfigToCache
  };
}
// src/hooks/useAnalysis.js
import { useState } from "react";
import { analyzeIncident } from "../services/api";

export const useAnalysis = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeIncidentHandler = async (requestData) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    
    try {
      console.log('🔄 useAnalysis: Sending request', requestData);
      const result = await analyzeIncident(requestData);
      console.log('✅ useAnalysis: Received response', result);
      
      if (result.success) {
        setAnalysis(result.analysis); // Only set the analysis part, not the whole response
      } else {
        setError(result.error || 'Analysis failed');
      }
      return result;
    } catch (err) {
      console.error('❌ useAnalysis: Error', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setAnalysis(null);
    setError(null);
    setLoading(false);
  };

  return {
    analyzeIncident: analyzeIncidentHandler,
    analysis, // This now contains only the analysis object
    loading,
    error,
    resetAnalysis
  };
};
// src/pages/IncidentAnalysis.jsx
import React, { useState, useEffect } from 'react';
import { useAnalysis } from '../hooks/useAnalysis';
import { getConfig } from '../services/api';
import AnalysisResult from '../components/Analysis/AnalysisResult';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { Search, Activity, Cloud, GitBranch, AlertTriangle, Settings, CheckCircle } from 'lucide-react';

const IncidentAnalysis = () => {
  const { analyzeIncident, analysis, loading, error, resetAnalysis } = useAnalysis();
  const [showResults, setShowResults] = useState(false);
  const [query, setQuery] = useState('');
  const [config, setConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setConfigLoading(true);
      const response = await getConfig();
      setConfig(response.config);
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setConfigLoading(false);
    }
  };

  const handleAnalysis = async (serviceType = 'all') => {
    if (!query.trim()) return;
    
    console.log('🔄 Starting analysis for service:', serviceType);
    
    let requestData = {
      query: query.trim()
    };

    if (serviceType === 'all') {
      requestData.services = ['k8s', 'aws', 'github'];
    } else {
      requestData.services = [serviceType];
    }

    console.log('📤 Sending request data:', requestData);
    
    const result = await analyzeIncident(requestData);
    
    if (result && result.success) {
      setShowResults(true);
    }
  };
    
  const handleNewAnalysis = () => {
    resetAnalysis();
    setShowResults(false);
    setQuery('');
  };

  const navigateToSettings = () => {
    window.location.href = '/settings';
  };

  if (configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Check if GitHub is configured
  const isGitHubConfigured = config && config.github_owner && config.github_repo;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incident Analysis</h1>
          <p className="text-gray-600">AI-powered analysis using your configured services</p>
        </div>
        <button
          onClick={navigateToSettings}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
        >
          <Settings className="h-4 w-4" />
          <span>Configure Services</span>
        </button>
      </div>

      {/* Configuration Status */}
      <div className={`p-4 rounded-lg border ${
        isGitHubConfigured ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center space-x-2">
          {isGitHubConfigured ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          )}
          <span className={`font-medium ${isGitHubConfigured ? 'text-green-800' : 'text-yellow-800'}`}>
            {isGitHubConfigured ? 'Services Configured' : 'GitHub Not Configured'}
          </span>
        </div>
        {config && (
          <div className="text-sm text-gray-600 mt-1">
            GitHub: {isGitHubConfigured ? `${config.github_owner}/${config.github_repo}` : 'Not set'} • 
            K8s: {config.k8s_namespace} • 
            AWS: {config.aws_region}
          </div>
        )}
        {!isGitHubConfigured && (
          <p className="text-yellow-700 text-sm mt-2">
            GitHub analysis won't work until configured in Settings
          </p>
        )}
      </div>

      {/* Loading State */}
      {loading && (
          <div className="bg-white rounded-xl p-6 flex flex-col items-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-gray-700 font-medium">Analyzing your incident...</p>
            <p className="text-gray-500 text-sm">This may take a few moments</p>
          </div>
      )}

      {!showResults ? (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Query Input */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">What's happening?</h2>
                  <p className="text-gray-600">Describe the incident and choose services to analyze</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Incident Description *
                </label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Examples:
- My Kubernetes pods are crashing
- GitHub workflows are failing  
- AWS shows high error rates
- Complete system health check
- Deployment is stuck..."
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          {/* Service Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Kubernetes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Kubernetes</h3>
              </div>
              <button
                onClick={() => handleAnalysis('k8s')}
                disabled={loading || !query.trim()}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Analyzing...' : 'Analyze K8s'}
              </button>
            </div>

            {/* AWS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Cloud className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900">AWS CloudWatch</h3>
              </div>
              <button
                onClick={() => handleAnalysis('aws')}
                disabled={loading || !query.trim()}
                className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Analyzing...' : 'Analyze AWS'}
              </button>
            </div>

            {/* GitHub */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <GitBranch className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">GitHub Actions</h3>
              </div>
              <button
                onClick={() => handleAnalysis('github')}
                disabled={loading || !query.trim() || !isGitHubConfigured}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Analyzing...' : 'Analyze GitHub'}
              </button>
              {!isGitHubConfigured && (
                <p className="text-xs text-red-500 mt-2 text-center">
                  Configure in Settings first
                </p>
              )}
            </div>

            {/* All Services */}
            <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">All Services</h3>
              </div>
              <button
                onClick={() => handleAnalysis('all')}
                disabled={loading || !query.trim()}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Analyzing...' : 'Analyze All'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <AnalysisResult 
          analysis={analysis}
          onNewAnalysis={handleNewAnalysis}
          error={error}
        />
      )}

      {/* Error Display */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Error: {error}</span>
          </div>
          <p className="text-red-700 text-sm mt-1">
            Check browser console for details
          </p>
        </div>
      )}
    </div>
  );
};

export default IncidentAnalysis;
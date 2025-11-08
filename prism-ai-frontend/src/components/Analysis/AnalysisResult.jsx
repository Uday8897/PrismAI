// src/components/Analysis/AnalysisResult.jsx
import React from 'react';
import { AlertTriangle, CheckCircle, Clock, XCircle, RotateCcw } from 'lucide-react';

const AnalysisResult = ({ analysis, onNewAnalysis, error }) => {
  console.log('📊 AnalysisResult received:', { analysis, error });

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <XCircle className="h-6 w-6 text-red-600" />
          <h2 className="text-lg font-semibold text-red-800">Analysis Failed</h2>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={onNewAnalysis}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <Clock className="h-6 w-6 text-yellow-600" />
          <h2 className="text-lg font-semibold text-yellow-800">No Analysis Data</h2>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    const statusUpper = String(status).toUpperCase();
    switch (statusUpper) {
      case "HEALTHY":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "DEGRADED":
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case "CRITICAL":
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Clock className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    const statusUpper = String(status).toUpperCase();
    switch (statusUpper) {
      case "HEALTHY": return "green";
      case "DEGRADED": return "yellow";
      case "CRITICAL": return "red";
      default: return "gray";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon(analysis.overall_status)}
          <div>
            <h2 className="text-xl font-bold text-gray-900">Analysis Results</h2>
            <p className="text-gray-600">
              Status: <span className={`font-medium text-${getStatusColor(analysis.overall_status)}-600`}>
                {analysis.overall_status}
              </span>
              {analysis.confidence && ` • Confidence: ${analysis.confidence}%`}
            </p>
          </div>
        </div>
        <button
          onClick={onNewAnalysis}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <RotateCcw className="h-4 w-4" />
          <span>New Analysis</span>
        </button>
      </div>

      {/* Root Cause Analysis */}
      {analysis.root_cause_analysis && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Root Cause Analysis</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{analysis.root_cause_analysis}</p>
        </div>
      )}

      {/* Service Health */}
      {analysis.services && Object.keys(analysis.services).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(analysis.services).map(([service, health]) => (
              <div key={service} className={`border-2 rounded-lg p-4 ${
                health.status === 'HEALTHY' ? 'border-green-200 bg-green-50' :
                health.status === 'DEGRADED' ? 'border-yellow-200 bg-yellow-50' :
                'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 capitalize">{service}</h4>
                  {getStatusIcon(health.status)}
                </div>
                <p className="text-sm text-gray-600">Score: {health.score}/100</p>
                {health.issues && health.issues.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">Issues:</p>
                    <ul className="text-sm text-gray-600 list-disc list-inside">
                      {health.issues.slice(0, 2).map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Immediate Actions */}
      {analysis.immediate_actions && analysis.immediate_actions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Immediate Actions</h3>
          <ul className="space-y-2">
            {analysis.immediate_actions.map((action, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-blue-500 mt-1">•</span>
                <span className="text-gray-700">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Debug Info */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <details>
          <summary className="cursor-pointer font-medium text-gray-700">Debug Information</summary>
          <pre className="mt-2 text-xs text-gray-600 overflow-auto">
            {JSON.stringify(analysis, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default AnalysisResult;
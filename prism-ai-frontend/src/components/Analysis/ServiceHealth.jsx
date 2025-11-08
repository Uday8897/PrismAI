// src/components/Analysis/ServiceHealth.jsx
import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Activity, Cloud, GitBranch } from 'lucide-react';

const ServiceHealth = ({ service, health }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'HEALTHY':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'DEGRADED':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'CRITICAL':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'HEALTHY':
        return 'text-green-800 bg-green-100';
      case 'DEGRADED':
        return 'text-yellow-800 bg-yellow-100';
      case 'CRITICAL':
        return 'text-red-800 bg-red-100';
      default:
        return 'text-gray-800 bg-gray-100';
    }
  };

  const getServiceIcon = (serviceName) => {
    switch (serviceName.toLowerCase()) {
      case 'k8s':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'aws':
        return <Cloud className="h-4 w-4 text-orange-500" />;
      case 'github':
        return <GitBranch className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getServiceIcon(service)}
          <span className="font-medium text-gray-900 capitalize">{service}</span>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(health.status)}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(health.status)}`}>
            {health.status}
          </span>
        </div>
      </div>
      
      {/* Health Score */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-600">Health Score</span>
        <span className={`font-bold ${getScoreColor(health.score)}`}>
          {health.score}/100
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div 
          className={`h-2 rounded-full ${
            health.score >= 80 ? 'bg-green-500' :
            health.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${health.score}%` }}
        ></div>
      </div>
      
      {/* Issues */}
      {health.issues && health.issues.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Issues Found</span>
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
              {health.issues.length}
            </span>
          </div>
          <ul className="space-y-1">
            {health.issues.slice(0, 3).map((issue, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <p className="text-xs text-gray-700 line-clamp-2">{issue}</p>
              </li>
            ))}
            {health.issues.length > 3 && (
              <li className="text-xs text-gray-500 pl-3">
                +{health.issues.length - 3} more issues
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {health.recommendations && health.recommendations.length > 0 && (
        <div>
          <span className="text-sm font-medium text-gray-700 mb-2 block">Recommendations</span>
          <ul className="space-y-1">
            {health.recommendations.slice(0, 2).map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <p className="text-xs text-gray-700 line-clamp-2">{recommendation}</p>
              </li>
            ))}
            {health.recommendations.length > 2 && (
              <li className="text-xs text-gray-500 pl-3">
                +{health.recommendations.length - 2} more recommendations
              </li>
            )}
          </ul>
        </div>
      )}

      {/* No Issues State */}
      {(!health.issues || health.issues.length === 0) && (
        <div className="flex items-center space-x-2 text-green-600 text-sm">
          <CheckCircle className="h-4 w-4" />
          <span>No critical issues detected</span>
        </div>
      )}
    </div>
  );
};

export default ServiceHealth;
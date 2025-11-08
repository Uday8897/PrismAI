// src/components/Analysis/ServiceHealth.jsx
import React from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

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

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getStatusIcon(health.status)}
          <span className="font-medium text-gray-900 capitalize">{service}</span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(health.status)}`}>
          {health.status}
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Health Score</span>
          <span className="font-medium text-gray-900">{health.score}/100</span>
        </div>
        
        {health.issues.length > 0 && (
          <div>
            <span className="text-sm text-gray-600">Issues Found</span>
            <ul className="mt-1 space-y-1">
              {health.issues.slice(0, 2).map((issue, index) => (
                <li key={index} className="text-xs text-red-600 truncate">
                  • {issue}
                </li>
              ))}
              {health.issues.length > 2 && (
                <li className="text-xs text-gray-500">
                  +{health.issues.length - 2} more issues
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceHealth;
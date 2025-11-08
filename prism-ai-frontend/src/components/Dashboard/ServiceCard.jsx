// src/components/Dashboard/ServiceCard.jsx
import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, MoreVertical } from 'lucide-react';
import StatusBadge from './StatusBadge';

const ServiceCard = ({ service }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <service.icon className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{service.name}</h3>
            <p className="text-sm text-gray-600">{service.description}</p>
          </div>
        </div>
        <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {getStatusIcon(service.status)}
          <StatusBadge status={service.status} size="sm" />
        </div>
        <span className="text-sm text-gray-500">{service.lastIncident}</span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        {Object.entries(service.metrics).map(([key, value]) => (
          <div key={key} className="text-center">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-600 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceCard; // ADD THIS LINE
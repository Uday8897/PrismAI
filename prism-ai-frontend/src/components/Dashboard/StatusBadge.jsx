// src/components/Dashboard/StatusBadge.jsx
import React from 'react';

const StatusBadge = ({ status, size = 'md' }) => {
  const statusConfig = {
    healthy: {
      label: 'Healthy',
      className: 'bg-green-100 text-green-800 border-green-200'
    },
    degraded: {
      label: 'Degraded',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    critical: {
      label: 'Critical',
      className: 'bg-red-100 text-red-800 border-red-200'
    },
    low: {
      label: 'Low',
      className: 'bg-gray-100 text-gray-800 border-gray-200'
    },
    medium: {
      label: 'Medium',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    high: {
      label: 'High',
      className: 'bg-orange-100 text-orange-800 border-orange-200'
    }
  };

  const config = statusConfig[status] || statusConfig.low;
  const sizeClass = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${sizeClass} ${config.className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge; // ADD THIS LINE
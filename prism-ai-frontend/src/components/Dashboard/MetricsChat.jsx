// src/components/Dashboard/MetricsChart.jsx
import React from 'react';

// Simple chart component - you can replace this with Recharts or Chart.js later
const MetricsChart = () => {
  const data = [
    { hour: '00:00', k8s: 85, aws: 92, github: 78 },
    { hour: '04:00', k8s: 82, aws: 95, github: 85 },
    { hour: '08:00', k8s: 88, aws: 89, github: 92 },
    { hour: '12:00', k8s: 92, aws: 87, github: 88 },
    { hour: '16:00', k8s: 85, aws: 91, github: 84 },
    { hour: '20:00', k8s: 89, aws: 94, github: 89 },
  ];

  const maxValue = 100;

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center space-x-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-gray-600">Kubernetes</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-orange-500 rounded"></div>
          <span className="text-gray-600">AWS</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-purple-500 rounded"></div>
          <span className="text-gray-600">GitHub</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-48">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 25, 50, 75, 100].map((value) => (
            <div key={value} className="flex items-center">
              <div className="w-8 pr-2 text-right text-xs text-gray-400">
                {value}%
              </div>
              <div className="flex-1 border-t border-gray-200"></div>
            </div>
          ))}
        </div>

        {/* Chart bars */}
        <div className="absolute inset-0 pl-8 flex items-end space-x-2">
          {data.map((point, index) => (
            <div key={index} className="flex-1 flex space-x-1 items-end">
              <div
                className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                style={{ height: `${(point.k8s / maxValue) * 100}%` }}
                title={`K8s: ${point.k8s}%`}
              ></div>
              <div
                className="w-full bg-orange-500 rounded-t transition-all hover:bg-orange-600"
                style={{ height: `${(point.aws / maxValue) * 100}%` }}
                title={`AWS: ${point.aws}%`}
              ></div>
              <div
                className="w-full bg-purple-500 rounded-t transition-all hover:bg-purple-600"
                style={{ height: `${(point.github / maxValue) * 100}%` }}
                title={`GitHub: ${point.github}%`}
              ></div>
            </div>
          ))}
        </div>

        {/* X-axis labels */}
        <div className="absolute -bottom-6 left-8 right-0 flex justify-between text-xs text-gray-500">
          {data.map((point, index) => (
            <span key={index}>{point.hour}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MetricsChart; // ADD THIS LINE
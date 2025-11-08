import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Cloud, GitBranch, AlertTriangle, TrendingUp, Clock, Server, Users } from 'lucide-react';
import ServiceCard from '../components/Dashboard/ServiceCard';
// import MetricsChart from '../components/Dashboard/MetricsChart';
import MetricsChart from '../components/Dashboard/MetricsChat'
import StatusBadge from '../components/Dashboard/StatusBadge';
import { getSystemMetrics } from '../services/api';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await getSystemMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const services = [
    {
      name: 'Kubernetes',
      icon: Activity,
      status: metrics?.k8s_status || 'unknown',
      description: 'Container orchestration platform',
      metrics: { 
        pods: metrics?.k8s_pods || 0, 
        nodes: metrics?.k8s_nodes || 0,
        health: metrics?.k8s_health || 0 
      },
      lastIncident: metrics?.k8s_last_incident || 'Never'
    },
    {
      name: 'AWS CloudWatch',
      icon: Cloud,
      status: metrics?.aws_status || 'unknown',
      description: 'Monitoring and observability service',
      metrics: { 
        logGroups: metrics?.aws_log_groups || 0, 
        alarms: metrics?.aws_alarms || 0,
        health: metrics?.aws_health || 0 
      },
      lastIncident: metrics?.aws_last_incident || 'Never'
    },
    {
      name: 'GitHub Actions',
      icon: GitBranch,
      status: metrics?.github_status || 'unknown',
      description: 'CI/CD pipeline automation',
      metrics: { 
        workflows: metrics?.github_workflows || 0, 
        successRate: metrics?.github_success_rate || '0%',
        health: metrics?.github_health || 0 
      },
      lastIncident: metrics?.github_last_incident || 'Never'
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Dashboard</h1>
          <p className="text-gray-600">Real-time monitoring and health status</p>
        </div>
        <Link
          to="/analyze"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
        >
          <AlertTriangle className="h-4 w-4" />
          <span>New Analysis</span>
        </Link>
      </div>

      {/* Real Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Health</p>
              <p className="text-2xl font-bold text-gray-900">{metrics?.overall_health || 0}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Incidents</p>
              <p className="text-2xl font-bold text-gray-900">{metrics?.active_incidents || 0}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Services Monitored</p>
              <p className="text-2xl font-bold text-gray-900">{metrics?.services_monitored || 0}</p>
            </div>
            <Server className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Last Updated</p>
              <p className="text-lg font-bold text-gray-900">
                {metrics?.data_freshness ? new Date(metrics.data_freshness).toLocaleTimeString() : 'Never'}
              </p>
            </div>
            <Clock className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Real Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <ServiceCard key={service.name} service={service} />
        ))}
      </div>

      {/* Real Metrics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health Trends</h3>
          <MetricsChart metrics={metrics} />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Status</h3>
          <div className="space-y-4">
            {services.map((service) => (
              <div key={service.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <StatusBadge status={service.status} />
                  <div>
                    <p className="font-medium text-gray-900">{service.name}</p>
                    <p className="text-sm text-gray-600">Health: {service.metrics.health}%</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">Last: {service.lastIncident}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
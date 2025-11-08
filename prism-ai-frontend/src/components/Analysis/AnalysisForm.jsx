// src/components/Analysis/AnalysisForm.jsx
import React, { useState } from 'react';
import { Activity, Cloud, GitBranch, Search } from 'lucide-react';

const AnalysisForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    query: '',
    owner: '',
    repo: '',
    namespace: 'default',
    services: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleServiceToggle = (service) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Incident Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Incident Description *
        </label>
        <textarea
          required
          value={formData.query}
          onChange={(e) => setFormData(prev => ({ ...prev, query: e.target.value }))}
          placeholder="Describe the incident in detail. The AI will automatically determine which services to investigate..."
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
        />
        <p className="text-sm text-gray-500 mt-1">
          Be specific about symptoms, error messages, and impacted services
        </p>
      </div>

      {/* Service Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Services to Analyze (Optional - AI will auto-detect if empty)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'k8s', name: 'Kubernetes', icon: Activity, description: 'Pods, nodes, deployments' },
            { id: 'aws', name: 'AWS CloudWatch', icon: Cloud, description: 'Logs, metrics, alarms' },
            { id: 'github', name: 'GitHub Actions', icon: GitBranch, description: 'Workflows, CI/CD' }
          ].map((service) => (
            <div
              key={service.id}
              onClick={() => handleServiceToggle(service.id)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.services.includes(service.id)
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <service.icon className={`h-5 w-5 ${
                  formData.services.includes(service.id) ? 'text-primary-600' : 'text-gray-400'
                }`} />
                <div>
                  <p className="font-medium text-gray-900">{service.name}</p>
                  <p className="text-sm text-gray-600">{service.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GitHub Owner
          </label>
          <input
            type="text"
            value={formData.owner}
            onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
            placeholder="organization-name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GitHub Repository
          </label>
          <input
            type="text"
            value={formData.repo}
            onChange={(e) => setFormData(prev => ({ ...prev, repo: e.target.value }))}
            placeholder="repository-name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kubernetes Namespace
        </label>
        <input
          type="text"
          value={formData.namespace}
          onChange={(e) => setFormData(prev => ({ ...prev, namespace: e.target.value }))}
          placeholder="default"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading || !formData.query.trim()}
          className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              <span>Start Analysis</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default AnalysisForm;
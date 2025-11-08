import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Settings, Server, Database, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { 
  getConfig, 
  saveConfig, 
  updateConfig, 
  updateGitHubConfig, 
  updateK8sConfig, 
  updateAWSConfig, 
  updateAgentConfig,
  validateConfig,
  resetConfig,
  getSystemMetrics 
} from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const SettingsPage = () => {
  const [config, setConfig] = useState({
    github_owner: '',
    github_repo: '',
    k8s_namespace: 'default',
    aws_region: 'us-east-1',
    analysis_timeout: 30,
    max_history_items: 100
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [configExists, setConfigExists] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [validation, setValidation] = useState(null);

  useEffect(() => {
    loadConfig();
    loadMetrics();
    checkConfigExists();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await getConfig();
      setConfig(response.config);
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const data = await getSystemMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const checkConfigExists = async () => {
    try {
      const response = await getConfig();
      setConfigExists(response.config.github_owner !== '' && response.config.github_repo !== '');
    } catch (error) {
      console.error('Failed to check config:', error);
      setConfigExists(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const response = await saveConfig(config);
      setSaved(true);
      setConfigExists(true);
      setTimeout(() => setSaved(false), 3000);
      
      // Reload metrics after config change
      await loadMetrics();
      await handleValidate();
    } catch (error) {
      console.error('Failed to save config:', error);
      alert(`Save failed: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateConfig = async () => {
    setUpdating(true);
    try {
      const response = await updateConfig(config);
      setUpdated(true);
      setTimeout(() => setUpdated(false), 3000);
      
      // Reload metrics after config change
      await loadMetrics();
      await handleValidate();
    } catch (error) {
      console.error('Failed to update config:', error);
      alert(`Update failed: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateGitHub = async () => {
    setUpdating(true);
    try {
      const response = await updateGitHubConfig({
        github_owner: config.github_owner,
        github_repo: config.github_repo
      });
      setUpdated(true);
      setTimeout(() => setUpdated(false), 3000);
      await handleValidate();
    } catch (error) {
      console.error('Failed to update GitHub config:', error);
      alert(`GitHub update failed: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateK8s = async () => {
    setUpdating(true);
    try {
      const response = await updateK8sConfig({
        k8s_namespace: config.k8s_namespace
      });
      setUpdated(true);
      setTimeout(() => setUpdated(false), 3000);
    } catch (error) {
      console.error('Failed to update K8s config:', error);
      alert(`K8s update failed: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateAWS = async () => {
    setUpdating(true);
    try {
      const response = await updateAWSConfig({
        aws_region: config.aws_region
      });
      setUpdated(true);
      setTimeout(() => setUpdated(false), 3000);
    } catch (error) {
      console.error('Failed to update AWS config:', error);
      alert(`AWS update failed: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateAgent = async () => {
    setUpdating(true);
    try {
      const response = await updateAgentConfig({
        analysis_timeout: config.analysis_timeout,
        max_history_items: config.max_history_items
      });
      setUpdated(true);
      setTimeout(() => setUpdated(false), 3000);
    } catch (error) {
      console.error('Failed to update agent config:', error);
      alert(`Agent update failed: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      try {
        await resetConfig();
        await loadConfig();
        setConfigExists(false);
        setValidation(null);
      } catch (error) {
        console.error('Failed to reset config:', error);
      }
    }
  };

  const handleValidate = async () => {
    try {
      const result = await validateConfig();
      setValidation(result);
    } catch (error) {
      console.error('Failed to validate config:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings & Configuration</h1>
          <p className="text-gray-600">Configure your SRE Agent services and settings</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleValidate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Validate</span>
          </button>
          
          <button
            onClick={handleReset}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Configuration Status */}
      <div className={`p-4 rounded-lg border ${
        configExists ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {configExists ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            )}
            <span className={`font-medium ${configExists ? 'text-green-800' : 'text-yellow-800'}`}>
              {configExists ? 'Configuration Saved' : 'Configuration Not Saved'}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {configExists ? 
              'Your settings are saved and will be used for analysis' : 
              'Save your configuration to use it for incident analysis'
            }
          </div>
        </div>
      </div>

      {/* Validation Results */}
      {validation && (
        <div className={`p-4 rounded-lg ${
          validation.valid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center space-x-2">
            {validation.valid ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            )}
            <span className={`font-medium ${validation.valid ? 'text-green-800' : 'text-yellow-800'}`}>
              {validation.valid ? 'Configuration is valid' : 'Configuration issues found'}
            </span>
          </div>
          {validation.issues.length > 0 && (
            <ul className="mt-2 list-disc list-inside text-sm text-yellow-700">
              {validation.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GitHub Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Database className="h-6 w-6 text-purple-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">GitHub Configuration</h2>
                <p className="text-sm text-gray-600">Configure GitHub Actions monitoring</p>
              </div>
            </div>
            <button
              onClick={handleUpdateGitHub}
              disabled={updating || !config.github_owner || !config.github_repo}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              {updating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>{updating ? 'Updating...' : 'Update GitHub'}</span>
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization/Owner *
              </label>
              <input
                type="text"
                value={config.github_owner}
                onChange={(e) => setConfig(prev => ({ ...prev, github_owner: e.target.value }))}
                placeholder="Uday8897"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Repository *
              </label>
              <input
                type="text"
                value={config.github_repo}
                onChange={(e) => setConfig(prev => ({ ...prev, github_repo: e.target.value }))}
                placeholder="CI-CD"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Kubernetes Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Server className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Kubernetes Configuration</h2>
                <p className="text-sm text-gray-600">Configure cluster access</p>
              </div>
            </div>
            <button
              onClick={handleUpdateK8s}
              disabled={updating}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              {updating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>{updating ? 'Updating...' : 'Update K8s'}</span>
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Namespace
              </label>
              <input
                type="text"
                value={config.k8s_namespace}
                onChange={(e) => setConfig(prev => ({ ...prev, k8s_namespace: e.target.value }))}
                placeholder="default"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* AWS Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Server className="h-6 w-6 text-orange-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">AWS Configuration</h2>
                <p className="text-sm text-gray-600">Configure CloudWatch access</p>
              </div>
            </div>
            <button
              onClick={handleUpdateAWS}
              disabled={updating}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              {updating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>{updating ? 'Updating...' : 'Update AWS'}</span>
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AWS Region
              </label>
              <input
                type="text"
                value={config.aws_region}
                onChange={(e) => setConfig(prev => ({ ...prev, aws_region: e.target.value }))}
                placeholder="us-east-1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Agent Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Settings className="h-6 w-6 text-gray-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Agent Settings</h2>
                <p className="text-sm text-gray-600">Configure analysis behavior</p>
              </div>
            </div>
            <button
              onClick={handleUpdateAgent}
              disabled={updating}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              {updating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>{updating ? 'Updating...' : 'Update Agent'}</span>
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Analysis Timeout (seconds)
              </label>
              <input
                type="number"
                value={config.analysis_timeout}
                onChange={(e) => setConfig(prev => ({ ...prev, analysis_timeout: parseInt(e.target.value) || 30 }))}
                min="10"
                max="300"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max History Items
              </label>
              <input
                type="number"
                value={config.max_history_items}
                onChange={(e) => setConfig(prev => ({ ...prev, max_history_items: parseInt(e.target.value) || 100 }))}
                min="10"
                max="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      {metrics && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current System Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{metrics.overall_health}%</p>
              <p className="text-sm text-gray-600">Overall Health</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{metrics.services_monitored}</p>
              <p className="text-sm text-gray-600">Services Monitored</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{metrics.active_incidents}</p>
              <p className="text-sm text-gray-600">Active Incidents</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{metrics.total_analyses || 0}</p>
              <p className="text-sm text-gray-600">Total Analyses</p>
            </div>
          </div>
        </div>
      )}

      {/* Save & Update Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleSaveConfig}
          disabled={saving || configExists}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : saved ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{saving ? 'Saving...' : saved ? 'Saved!' : 'Save Configuration'}</span>
        </button>

        <button
          onClick={handleUpdateConfig}
          disabled={updating || !configExists}
          className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
        >
          {updating ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : updated ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span>{updating ? 'Updating...' : updated ? 'Updated!' : 'Update All'}</span>
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
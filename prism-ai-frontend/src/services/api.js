// services/api.js
const API_BASE_URL = 'http://localhost:7000';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// Configuration APIs
export const getConfig = async () => {
  return await apiCall('/config');
};

export const saveConfig = async (config) => {
  return await apiCall('/config/save', {
    method: 'POST',
    body: JSON.stringify(config),
  });
};

export const updateConfig = async (config) => {
  return await apiCall('/config/update', {
    method: 'PUT',
    body: JSON.stringify(config),
  });
};

export const updateGitHubConfig = async (githubConfig) => {
  return await apiCall('/config/github', {
    method: 'PUT',
    body: JSON.stringify(githubConfig),
  });
};

export const updateK8sConfig = async (k8sConfig) => {
  return await apiCall('/config/k8s', {
    method: 'PUT',
    body: JSON.stringify(k8sConfig),
  });
};

export const updateAWSConfig = async (awsConfig) => {
  return await apiCall('/config/aws', {
    method: 'PUT',
    body: JSON.stringify(awsConfig),
  });
};

export const updateAgentConfig = async (agentConfig) => {
  return await apiCall('/config/agent', {
    method: 'PUT',
    body: JSON.stringify(agentConfig),
  });
};

export const deleteConfig = async () => {
  return await apiCall('/config', {
    method: 'DELETE',
  });
};

export const checkConfig = async () => {
  return await apiCall('/config/check');
};

export const validateConfig = async () => {
  return await apiCall('/config/validate');
};

export const resetConfig = async () => {
  return await apiCall('/config/reset', {
    method: 'POST',
  });
};

export const getDatabaseConfig = async () => {
  return await apiCall('/config/database');
};

// Connection Testing APIs (kept for internal use)
export const testConnection = async (service) => {
  return await apiCall('/test-connection', {
    method: 'POST',
    body: JSON.stringify({ service }),
  });
};

export const testAllConnections = async () => {
  return await apiCall('/test-all-connections', {
    method: 'POST',
  });
};

// Metrics and Status APIs
export const getSystemMetrics = async () => {
  return await apiCall('/metrics');
};

export const getHealth = async () => {
  return await apiCall('/health');
};

export const getStatus = async () => {
  return await apiCall('/status');
};

// Analysis APIs - FIX THIS FUNCTION
export const analyzeIncident = async (requestData) => {
  const request = {
    query: requestData.query,
    priority: 'medium',
  };
  
  // Only add services if provided
  if (requestData.services) {
    request.services = requestData.services;
  }
  
  console.log('📤 Sending analysis request:', request);
  
  return await apiCall('/analyze-incident', {
    method: 'POST',
    body: JSON.stringify(request),
  });
};

export const getAnalysisHistory = async (limit = 20) => {
  return await apiCall(`/analysis/history?limit=${limit}`);
};

export const getAnalysisById = async (analysisId) => {
  return await apiCall(`/analysis/${analysisId}`);
};

// Service-specific analysis
export const analyzeK8s = async (query, namespace = null) => {
  const params = new URLSearchParams({ query });
  if (namespace) params.append('namespace', namespace);
  
  return await apiCall(`/analyze/k8s?${params}`, {
    method: 'POST',
  });
};

export const analyzeAWS = async (query) => {
  return await apiCall(`/analyze/aws?query=${encodeURIComponent(query)}`, {
    method: 'POST',
  });
};

export const analyzeGitHub = async (query) => {
  return await apiCall(`/analyze/github?query=${encodeURIComponent(query)}`, {
    method: 'POST',
  });
};

// Utility function to check if GitHub is configured
export const isGitHubConfigured = async () => {
  try {
    const config = await getConfig();
    return config.config.github_owner && config.config.github_repo;
  } catch (error) {
    console.error('Failed to check GitHub configuration:', error);
    return false;
  }
};

// Utility function to get current configuration status
export const getConfigStatus = async () => {
  try {
    const config = await getConfig();
    const hasGitHub = config.config.github_owner && config.config.github_repo;
    
    return {
      exists: hasGitHub, // Consider config exists if GitHub is configured
      hasGitHubConfig: hasGitHub,
      github: {
        owner: config.config.github_owner,
        repo: config.config.github_repo
      },
      k8s: {
        namespace: config.config.k8s_namespace
      },
      aws: {
        region: config.config.aws_region
      },
      agent: {
        analysis_timeout: config.config.analysis_timeout,
        max_history_items: config.config.max_history_items
      }
    };
  } catch (error) {
    console.error('Failed to get config status:', error);
    return {
      exists: false,
      hasGitHubConfig: false,
      github: { owner: '', repo: '' },
      k8s: { namespace: 'default' },
      aws: { region: 'us-east-1' },
      agent: { analysis_timeout: 30, max_history_items: 100 }
    };
  }
};

// Batch update multiple configurations
export const batchUpdateConfig = async (updates) => {
  const updatesToApply = {};
  
  if (updates.github) {
    updatesToApply.github_owner = updates.github.owner;
    updatesToApply.github_repo = updates.github.repo;
  }
  
  if (updates.k8s) {
    updatesToApply.k8s_namespace = updates.k8s.namespace;
  }
  
  if (updates.aws) {
    updatesToApply.aws_region = updates.aws.region;
  }
  
  if (updates.agent) {
    updatesToApply.analysis_timeout = updates.agent.analysis_timeout;
    updatesToApply.max_history_items = updates.agent.max_history_items;
  }
  
  return await updateConfig(updatesToApply);
};

// Export all methods
export default {
  // Configuration methods
  getConfig,
  saveConfig,
  updateConfig,
  updateGitHubConfig,
  updateK8sConfig,
  updateAWSConfig,
  updateAgentConfig,
  deleteConfig,
  checkConfig,
  validateConfig,
  resetConfig,
  getDatabaseConfig,
  
  // Utility methods
  isGitHubConfigured,
  getConfigStatus,
  batchUpdateConfig,
  
  // Connection testing
  testConnection,
  testAllConnections,
  
  // Metrics and status
  getSystemMetrics,
  getHealth,
  getStatus,
  
  // Analysis methods
  analyzeIncident,
  getAnalysisHistory,
  getAnalysisById,
  analyzeK8s,
  analyzeAWS,
  analyzeGitHub,
};
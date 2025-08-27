import { apiRequest } from './queryClient';

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    const response = await apiRequest('POST', '/api/auth/login', { username, password });
    return response.json();
  },

  register: async (userData: { username: string; email: string; password: string; role?: string }) => {
    const response = await apiRequest('POST', '/api/auth/register', userData);
    return response.json();
  },

  logout: async () => {
    const response = await apiRequest('POST', '/api/auth/logout');
    return response.json();
  },

  getMe: async () => {
    const response = await apiRequest('GET', '/api/auth/me');
    return response.json();
  }
};

// System API
export const systemApi = {
  getStats: async () => {
    const response = await apiRequest('GET', '/api/system/stats');
    return response.json();
  },

  getStatus: async () => {
    const response = await apiRequest('GET', '/api/system/status');
    return response.json();
  }
};

// Agents API
export const agentsApi = {
  getAll: async () => {
    const response = await apiRequest('GET', '/api/agents');
    return response.json();
  },

  getById: async (id: string) => {
    const response = await apiRequest('GET', `/api/agents/${id}`);
    return response.json();
  },

  update: async (id: string, updates: any) => {
    const response = await apiRequest('PATCH', `/api/agents/${id}`, updates);
    return response.json();
  }
};

// Transactions API
export const transactionsApi = {
  getAll: async (limit = 50, offset = 0) => {
    const response = await apiRequest('GET', `/api/transactions?limit=${limit}&offset=${offset}`);
    return response.json();
  },

  getHighRisk: async (limit = 20) => {
    const response = await apiRequest('GET', `/api/transactions/high-risk?limit=${limit}`);
    return response.json();
  },

  getById: async (id: string) => {
    const response = await apiRequest('GET', `/api/transactions/${id}`);
    return response.json();
  },

  getByWallet: async (address: string, limit = 50) => {
    const response = await apiRequest('GET', `/api/wallets/${address}/transactions?limit=${limit}`);
    return response.json();
  }
};

// Alerts API
export const alertsApi = {
  getAll: async (limit = 50, offset = 0) => {
    const response = await apiRequest('GET', `/api/alerts?limit=${limit}&offset=${offset}`);
    return response.json();
  },

  getOpen: async () => {
    const response = await apiRequest('GET', '/api/alerts/open');
    return response.json();
  },

  create: async (alertData: any) => {
    const response = await apiRequest('POST', '/api/alerts', alertData);
    return response.json();
  },

  update: async (id: string, updates: any) => {
    const response = await apiRequest('PATCH', `/api/alerts/${id}`, updates);
    return response.json();
  }
};

// Wallets API
export const walletsApi = {
  getAll: async (limit = 50, offset = 0) => {
    const response = await apiRequest('GET', `/api/wallets?limit=${limit}&offset=${offset}`);
    return response.json();
  },

  getHighRisk: async (limit = 20) => {
    const response = await apiRequest('GET', `/api/wallets/high-risk?limit=${limit}`);
    return response.json();
  },

  getByAddress: async (address: string) => {
    const response = await apiRequest('GET', `/api/wallets/${address}`);
    return response.json();
  }
};

// Reports API
export const reportsApi = {
  getAll: async (limit = 50, offset = 0) => {
    const response = await apiRequest('GET', `/api/reports?limit=${limit}&offset=${offset}`);
    return response.json();
  },

  create: async (reportData: any) => {
    const response = await apiRequest('POST', '/api/reports', reportData);
    return response.json();
  }
};

// Audit Logs API
export const auditLogsApi = {
  getAll: async (limit = 100, offset = 0) => {
    const response = await apiRequest('GET', `/api/audit-logs?limit=${limit}&offset=${offset}`);
    return response.json();
  }
};

// API client for Searchlyst backend
// In production: set VITE_API_BASE_URL to your backend URL (e.g. https://api.searchlyst.com/api)
// If unset in production, uses same-origin /api (works when frontend & backend share a domain via reverse proxy)

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:3000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Helper to get auth token
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const apiClient = {
  async get(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`GET ${endpoint} failed:`, error);
      throw error;
    }
  },

  async post(endpoint, data) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }
      
      return responseData;
    } catch (error) {
      console.error(`POST ${endpoint} failed:`, error);
      throw error;
    }
  },

  async put(endpoint, data) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }
      
      return responseData;
    } catch (error) {
      console.error(`PUT ${endpoint} failed:`, error);
      throw error;
    }
  },

  async delete(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`DELETE ${endpoint} failed:`, error);
      throw error;
    }
  },

  // Authentication methods
  auth: {
    async login(email, password) {
      const response = await apiClient.post('/auth/login', { email, password });
      return response;
    },
    
    async verify() {
      return apiClient.get('/auth/verify');
    },
    
    logout() {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  },

  // Waitlist specific methods
  waitlist: {
    async create(data) {
      return apiClient.post('/waitlist', data);
    },
    
    async list() {
      return apiClient.get('/waitlist');
    },
    
    async update(id, data) {
      return apiClient.put(`/waitlist/${id}`, data);
    },
    
    async getStats() {
      return apiClient.get('/waitlist/stats');
    }
  }
};

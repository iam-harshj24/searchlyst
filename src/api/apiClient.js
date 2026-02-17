// API client for Searchlyst backend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

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

// Handle 401 responses globally
const handle401 = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('searchlyst_user_profile');
  if (window.location.pathname !== '/Login' && window.location.pathname !== '/Signup') {
    window.location.href = '/Login';
  }
};

export const apiClient = {
  async get(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: getAuthHeaders()
      });

      if (response.status === 401) {
        handle401();
        throw new Error('Session expired. Please log in again.');
      }

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

      if (response.status === 401) {
        handle401();
        throw new Error('Session expired. Please log in again.');
      }
      
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

      if (response.status === 401) {
        handle401();
        throw new Error('Session expired. Please log in again.');
      }
      
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

      if (response.status === 401) {
        handle401();
        throw new Error('Session expired. Please log in again.');
      }
      
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

    async signup({ full_name, email, password }) {
      const response = await apiClient.post('/auth/register', { full_name, email, password });
      return response;
    },
    
    async verify() {
      return apiClient.get('/auth/verify');
    },

    async forgotPassword(email) {
      return apiClient.post('/auth/forgot-password', { email });
    },
    
    async me() {
      const token = localStorage.getItem('authToken');
      if (!token) return null;
      try {
        const response = await apiClient.get('/auth/verify');
        const backendUser = response?.user;
        if (!backendUser) return null;
        // Backend returns full user with profile; use as primary, fallback to localStorage for offline
        const profile = JSON.parse(localStorage.getItem('searchlyst_user_profile') || '{}');
        return {
          id: backendUser.id,
          email: backendUser.email,
          full_name: backendUser.full_name || backendUser.name || profile.full_name || 'User',
          name: backendUser.name || backendUser.full_name,
          role: backendUser.role,
          onboarded: backendUser.onboarded ?? profile.onboarded ?? true,
          role_type: backendUser.role_type || profile.role_type || 'founder',
          industry: backendUser.industry ?? profile.industry,
          target_audience: backendUser.target_audience ?? profile.target_audience,
          location: backendUser.location ?? profile.location,
          website_url: backendUser.website_url ?? profile.website_url,
          goals: backendUser.goals ?? profile.goals,
          platforms: backendUser.platforms ?? profile.platforms,
          company_name: backendUser.company_name ?? profile.company_name,
          funding_stage: backendUser.funding_stage ?? profile.funding_stage,
          content_style: backendUser.content_style ?? profile.content_style,
          follower_range: backendUser.follower_range ?? profile.follower_range,
          social_linkedin: backendUser.social_linkedin ?? profile.social_linkedin,
          social_instagram: backendUser.social_instagram ?? profile.social_instagram,
          social_substack: backendUser.social_substack ?? profile.social_substack,
          social_reddit: backendUser.social_reddit ?? profile.social_reddit,
          social_twitter: backendUser.social_twitter ?? profile.social_twitter,
          ...profile,
          ...backendUser,
        };
      } catch {
        return null;
      }
    },
    
    async updateMe(data) {
      // Save to localStorage immediately as cache
      const profile = JSON.parse(localStorage.getItem('searchlyst_user_profile') || '{}');
      const updated = { ...profile, ...data };
      localStorage.setItem('searchlyst_user_profile', JSON.stringify(updated));

      // Persist to backend
      try {
        const res = await apiClient.put('/auth/profile', data);
        if (res?.user) {
          const merged = { ...profile, ...data, ...res.user };
          localStorage.setItem('searchlyst_user_profile', JSON.stringify(merged));
          return merged;
        }
      } catch {
        // Backend not available -- localStorage is the source of truth
      }

      return updated;
    },
    
    logout() {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('searchlyst_user_profile');
      window.location.href = '/';
    }
  },

  // Domains (projects)
  domains: {
    async list() {
      try {
        const res = await apiClient.get('/domains');
        return res?.domains ?? res ?? [];
      } catch {
        const stored = JSON.parse(localStorage.getItem('searchlyst_domains') || '[]');
        return stored;
      }
    },
    async create(data) {
      try {
        const res = await apiClient.post('/domains', data);
        return res?.domain ?? res;
      } catch {
        const stored = JSON.parse(localStorage.getItem('searchlyst_domains') || '[]');
        const domain = { id: Date.now(), ...data, created_at: new Date().toISOString() };
        stored.push(domain);
        localStorage.setItem('searchlyst_domains', JSON.stringify(stored));
        return domain;
      }
    }
  },

  // Brand profile (project-scoped)
  brandProfile: {
    async get(projectId) {
      return apiClient.get(`/projects/${projectId}/brand-profile`);
    },
    async update(projectId, data) {
      return apiClient.put(`/projects/${projectId}/brand-profile`, data);
    },
  },

  // Social connections & writing style analysis
  social: {
    async listConnections() {
      const res = await apiClient.get('/social/connections');
      return res?.connections ?? [];
    },
    async analyzeWritingStyle(projectId) {
      return apiClient.post('/social/analyze', { projectId });
    },
  },

  // Content generation - uses backend when available, mock otherwise
  async generateContent(topic, options = {}) {
    const { projectId, platformIds } = options;
    try {
      const res = await apiClient.post('/content/generate', { topic, projectId, platformIds });
      const contents = res?.contents ?? res;
      return Array.isArray(contents) ? contents : [contents];
    } catch (err) {
      const platforms = (platformIds || []).length ? platformIds : ['linkedin', 'blog'];
      return platforms.map((id) => ({
        platform: id.charAt(0).toUpperCase() + id.slice(1),
        title: topic?.slice(0, 60) || 'Content',
        content: `[Content generation failed: ${err.message}]\n\nTopic: ${topic?.slice(0, 100)}...\n\nEnsure PERPLEXITY_API_KEY is set in backend .env.`,
        ai_optimization_tips: ['Add relevant keywords', 'Include a clear CTA', 'Use formatting for readability']
      }));
    }
  },

  // AI Assistant chat (Perplexity API via backend)
  chat: {
    async send(message, history = []) {
      const res = await apiClient.post('/chat', { message, history });
      return res?.content ?? '';
    },
  },

  // Audits (SEO, AEO, GEO)
  audit: {
    async run(projectId, body = {}) {
      const res = await apiClient.post(`/projects/${projectId}/audits`, body);
      return res?.audit ?? res;
    },
    async list(projectId) {
      const res = await apiClient.get(`/projects/${projectId}/audits`);
      return res?.audits ?? [];
    },
    async get(projectId, auditId) {
      const res = await apiClient.get(`/projects/${projectId}/audits/${auditId}`);
      return res?.audit ?? res;
    },
    async compare(projectId, auditId1, auditId2) {
      const res = await apiClient.get(`/projects/${projectId}/audits/compare?auditId1=${auditId1}&auditId2=${auditId2}`);
      return res?.comparison ?? res;
    },
    async export(projectId, auditId, format = 'pdf') {
      const token = localStorage.getItem('authToken');
      const url = `${API_BASE_URL}/projects/${projectId}/audits/${auditId}/export?format=${format}`;
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/Login';
        throw new Error('Session expired');
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Export failed: ${res.status}`);
      }
      const blob = await res.blob();
      const ext = format === 'csv' ? 'csv' : 'pdf';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `audit-${projectId}-${new Date().toISOString().slice(0, 10)}.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
    },
  },

  // AI Visibility
  aiVisibility: {
    async getSummary(projectId, range = '30d') {
      const res = await apiClient.get(`/projects/${projectId}/ai-visibility?range=${range}`);
      return res;
    },
  },

  // Overview dashboard
  overview: {
    async get(activeProjectId = null) {
      const q = activeProjectId ? `?activeProjectId=${activeProjectId}` : '';
      const res = await apiClient.get(`/overview${q}`);
      return res;
    },
  },

  // Sentiment & GEO tracking
  sentimentGeo: {
    async getSummary(projectId, range = '30d') {
      const res = await apiClient.get(`/projects/${projectId}/sentiment-geo?range=${range}`);
      return res;
    },
    async runScan(projectId) {
      const res = await apiClient.post(`/projects/${projectId}/sentiment-geo/scan`);
      return res;
    },
    async listPrompts(projectId) {
      const res = await apiClient.get(`/projects/${projectId}/sentiment-geo/prompts`);
      return res?.prompts ?? [];
    },
    async addPrompt(projectId, query) {
      const res = await apiClient.post(`/projects/${projectId}/sentiment-geo/prompts`, { query });
      return res?.prompt ?? res;
    },
    async deletePrompt(projectId, promptId) {
      await apiClient.delete(`/projects/${projectId}/sentiment-geo/prompts/${promptId}`);
    },
  },

  // Waitlist specific methods (kept for AdminPanel)
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

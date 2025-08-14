// OFEM API Integration Service
// Connects the mobile app with the OFEM Integration Controller

class OFEMApiService {
  constructor() {
    this.baseURL = '/api';
    this.token = localStorage.getItem('token');
  }

  // Set auth token
  setAuthToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  // Clear auth token
  clearAuthToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  // Make authenticated request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      ...options,
    };

    if (config.body && typeof config.body !== 'string') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          this.clearAuthToken();
          throw new Error('Authentication failed');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    
    if (response.token) {
      this.setAuthToken(response.token);
    }
    
    return response;
  }

  async logout() {
    this.clearAuthToken();
    return { success: true };
  }

  // Dashboard data
  async getDashboardStats() {
    return await this.request('/dashboard/stats');
  }

  async getRecentJobs(limit = 10) {
    return await this.request(`/jobs?limit=${limit}`);
  }

  // Content management
  async createJob(jobData) {
    return await this.request('/jobs', {
      method: 'POST',
      body: jobData,
    });
  }

  async publishContent(contentData) {
    return await this.request('/content/publish', {
      method: 'POST',
      body: contentData,
    });
  }

  async scheduleContent(scheduleData) {
    return await this.request('/content/schedule', {
      method: 'POST',
      body: scheduleData,
    });
  }

  // Subscriber management
  async getSubscribers(filters = {}) {
    const params = new URLSearchParams(filters);
    return await this.request(`/subscribers?${params}`);
  }

  async addSubscriber(subscriberData) {
    return await this.request('/subscribers', {
      method: 'POST',
      body: subscriberData,
    });
  }

  async sendMessage(subscriberId, messageData) {
    return await this.request(`/subscribers/${subscriberId}/message`, {
      method: 'POST',
      body: messageData,
    });
  }

  // Campaign management
  async getCampaigns() {
    return await this.request('/campaigns');
  }

  async createCampaign(campaignData) {
    return await this.request('/campaigns', {
      method: 'POST',
      body: campaignData,
    });
  }

  async runCampaign(campaignId) {
    return await this.request(`/campaigns/${campaignId}/run`, {
      method: 'POST',
    });
  }

  async triggerCampaign(campaignType, segment = null) {
    return await this.request('/campaigns/trigger', {
      method: 'POST',
      body: { type: campaignType, segment },
    });
  }

  // Analytics
  async getAnalytics(timeRange = '7d') {
    return await this.request(`/analytics?range=${timeRange}`);
  }

  async getSystemStatus() {
    return await this.request('/system/status');
  }

  async runAnalyticsExtraction() {
    return await this.request('/analytics/extract', {
      method: 'POST',
    });
  }

  async runAnomalyDetection() {
    return await this.request('/analytics/anomalies', {
      method: 'POST',
    });
  }

  // Export data
  async exportAnalyticsReport(format = 'json') {
    return await this.request(`/analytics/export?format=${format}`);
  }

  // Settings
  async getUserProfile() {
    return await this.request('/user/profile');
  }

  async updateUserProfile(profileData) {
    return await this.request('/user/profile', {
      method: 'PUT',
      body: profileData,
    });
  }

  async updateSettings(settingsData) {
    return await this.request('/user/settings', {
      method: 'PUT',
      body: settingsData,
    });
  }

  // Health check
  async healthCheck() {
    try {
      return await this.request('/health');
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
}

// Create singleton instance
const ofemApi = new OFEMApiService();

export default ofemApi;
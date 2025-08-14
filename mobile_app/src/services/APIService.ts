/**
 * OFEM Mobile API Service
 * Connects to all OFEM backend microservices
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { showMessage } from 'react-native-flash-message';

// Types
export interface APIConfig {
  baseURL: string;
  timeout: number;
  retries: number;
}

export interface ServiceEndpoints {
  master: string;
  scheduler: string;
  crm: string;
  analytics: string;
  content: string;
  revenue: string;
}

export interface DashboardData {
  system_status: Record<string, any>;
  content_scheduling: any;
  subscriber_management: any;
  analytics_overview: any;
  revenue_metrics: any;
  last_updated: string;
}

export interface ContentPackage {
  package_id: string;
  created_at: string;
  image?: {
    success: boolean;
    filename: string;
    filepath: string;
  };
  caption?: {
    success: boolean;
    caption: string;
    hashtags: string;
  };
}

export interface ScheduledPost {
  id: number;
  content: string;
  caption?: string;
  hashtags?: string;
  platform: string;
  publish_time: string;
  status: 'pending' | 'published' | 'failed';
  created_at: string;
}

export interface Subscriber {
  id: number;
  username: string;
  email?: string;
  tier: string;
  total_spent: number;
  last_activity: string;
  status: string;
  subscription_date: string;
}

export interface Campaign {
  campaign_id: number;
  campaign_name: string;
  target_segment: string;
  messages_sent: number;
  conversions: number;
  revenue_generated: number;
  success_rate: number;
}

class APIServiceClass {
  private endpoints: ServiceEndpoints;
  private clients: Record<string, AxiosInstance> = {};
  private offlineQueue: Array<{ service: string; endpoint: string; method: string; data?: any }> = [];

  constructor() {
    // Default endpoints - can be configured based on environment
    this.endpoints = {
      master: 'http://localhost:3000',
      scheduler: 'http://localhost:3001', 
      crm: 'http://localhost:3002',
      analytics: 'http://localhost:3003',
      content: 'http://localhost:3004',
      revenue: 'http://localhost:3005',
    };

    this.initializeClients();
    this.setupOfflineSupport();
  }

  async initialize(): Promise<void> {
    try {
      // Load saved configuration
      const savedConfig = await AsyncStorage.getItem('api_config');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        this.endpoints = { ...this.endpoints, ...config };
        this.initializeClients();
      }

      // Test connectivity
      await this.testConnectivity();
      console.log('✅ API Service initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing API Service:', error);
      throw error;
    }
  }

  private initializeClients(): void {
    Object.keys(this.endpoints).forEach(service => {
      this.clients[service] = axios.create({
        baseURL: this.endpoints[service as keyof ServiceEndpoints],
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Add request interceptor
      this.clients[service].interceptors.request.use(
        async (config) => {
          // Add auth token if available
          const token = await AsyncStorage.getItem('auth_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error) => Promise.reject(error)
      );

      // Add response interceptor
      this.clients[service].interceptors.response.use(
        (response) => response,
        async (error) => {
          if (error.response?.status === 401) {
            // Handle unauthorized access
            await AsyncStorage.removeItem('auth_token');
            showMessage({
              message: 'Session expired',
              description: 'Please log in again',
              type: 'warning',
            });
          }
          return Promise.reject(error);
        }
      );
    });
  }

  private async setupOfflineSupport(): Promise<void> {
    NetInfo.addEventListener(state => {
      if (state.isConnected && this.offlineQueue.length > 0) {
        console.log('📡 Connection restored, processing offline queue...');
        this.processOfflineQueue();
      }
    });
  }

  private async processOfflineQueue(): Promise<void> {
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const request of queue) {
      try {
        await this.makeRequest(request.service, request.endpoint, request.method, request.data);
      } catch (error) {
        console.error('Error processing offline request:', error);
        // Re-queue failed requests
        this.offlineQueue.push(request);
      }
    }
  }

  private async makeRequest(service: string, endpoint: string, method: string = 'GET', data?: any): Promise<any> {
    try {
      const client = this.clients[service];
      if (!client) {
        throw new Error(`Service ${service} not found`);
      }

      let response: AxiosResponse;
      
      switch (method.toUpperCase()) {
        case 'GET':
          response = await client.get(endpoint);
          break;
        case 'POST':
          response = await client.post(endpoint, data);
          break;
        case 'PUT':
          response = await client.put(endpoint, data);
          break;
        case 'DELETE':
          response = await client.delete(endpoint);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      return response.data;
    } catch (error: any) {
      // Handle offline mode
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected && method !== 'GET') {
        console.log('📴 Offline - queuing request for later');
        this.offlineQueue.push({ service, endpoint, method, data });
        showMessage({
          message: 'Offline mode',
          description: 'Request will be sent when connection is restored',
          type: 'info',
        });
        return null;
      }

      console.error(`API Error [${service}${endpoint}]:`, error.message);
      throw error;
    }
  }

  // Dashboard API
  async getDashboard(): Promise<DashboardData> {
    return this.makeRequest('master', '/api/dashboard');
  }

  async getSystemHealth(): Promise<any> {
    return this.makeRequest('master', '/api/system/health');
  }

  // Content Generation API
  async generateContentPackage(options: {
    content_type?: string;
    style?: string;
    mood?: string;
    include_image?: boolean;
    include_caption?: boolean;
    custom_prompt?: string;
  }): Promise<ContentPackage> {
    return this.makeRequest('content', '/api/generate/package', 'POST', options);
  }

  async generateCaption(context: {
    content_type?: string;
    mood?: string;
    target_audience?: string;
  }): Promise<any> {
    return this.makeRequest('content', '/api/generate/caption', 'POST', context);
  }

  async generateBatchContent(count: number, options: any): Promise<any> {
    return this.makeRequest('content', '/api/generate/batch', 'POST', { count, options });
  }

  async getRandomPrompt(type: string): Promise<any> {
    return this.makeRequest('content', `/api/prompts/${type}`);
  }

  // Scheduler API
  async schedulePost(postData: {
    content: string;
    caption?: string;
    hashtags?: string;
    platform?: string;
    publishTime: string;
  }): Promise<any> {
    return this.makeRequest('scheduler', '/api/posts/schedule', 'POST', postData);
  }

  async getScheduledPosts(limit?: number): Promise<ScheduledPost[]> {
    const params = limit ? `?limit=${limit}` : '';
    return this.makeRequest('scheduler', `/api/posts${params}`);
  }

  async getSchedulerStats(): Promise<any> {
    return this.makeRequest('scheduler', '/api/stats');
  }

  // CRM API
  async getSubscribers(): Promise<Subscriber[]> {
    return this.makeRequest('crm', '/api/subscribers');
  }

  async addSubscriber(userData: {
    username: string;
    email?: string;
    tier?: string;
    totalSpent?: number;
  }): Promise<any> {
    return this.makeRequest('crm', '/api/subscribers', 'POST', userData);
  }

  async updateSubscriberActivity(username: string): Promise<any> {
    return this.makeRequest('crm', `/api/subscribers/${username}/activity`, 'PUT');
  }

  async getSubscriberStats(): Promise<any> {
    return this.makeRequest('crm', '/api/subscribers/stats');
  }

  async triggerOnboarding(): Promise<any> {
    return this.makeRequest('crm', '/api/automation/onboarding', 'POST');
  }

  async triggerRetention(): Promise<any> {
    return this.makeRequest('crm', '/api/automation/retention', 'POST');
  }

  // Analytics API
  async getAnalytics(): Promise<any> {
    return this.makeRequest('analytics', '/api/dashboard');
  }

  async getKPIs(): Promise<any> {
    return this.makeRequest('analytics', '/api/kpis');
  }

  async getAnomalies(): Promise<any> {
    return this.makeRequest('analytics', '/api/anomalies');
  }

  async getChurnPredictions(): Promise<any> {
    return this.makeRequest('analytics', '/api/churn-predictions');
  }

  // Revenue Optimization API
  async generateUpsellMessage(context: {
    subscriber_tier: string;
    target_tier: string;
    spending_history: number;
    engagement_level: string;
  }): Promise<any> {
    return this.makeRequest('revenue', '/api/upsell/generate', 'POST', context);
  }

  async createCampaign(campaignConfig: {
    campaign_name: string;
    target_segment: string;
    pricing_strategy: string;
    message_template: string;
  }): Promise<any> {
    return this.makeRequest('revenue', '/api/campaigns', 'POST', campaignConfig);
  }

  async executeCampaign(campaignId: number): Promise<any> {
    return this.makeRequest('revenue', `/api/campaigns/${campaignId}/execute`, 'POST');
  }

  async getCampaignPerformance(): Promise<Campaign[]> {
    return this.makeRequest('revenue', '/api/campaigns/performance');
  }

  async getRevenueAnalytics(days: number = 30): Promise<any> {
    return this.makeRequest('revenue', `/api/analytics/revenue?days=${days}`);
  }

  async getRecommendations(): Promise<any> {
    return this.makeRequest('revenue', '/api/recommendations');
  }

  async createQuickCampaign(options: {
    target_segment?: string;
    auto_execute?: boolean;
  }): Promise<any> {
    return this.makeRequest('revenue', '/api/automation/quick-campaign', 'POST', options);
  }

  // Workflow API (Master Orchestrator)
  async createContentCampaign(options: {
    content_count?: number;
    target_segment?: string;
    include_upsell?: boolean;
    schedule_days_ahead?: number;
  }): Promise<any> {
    return this.makeRequest('master', '/api/workflows/content-campaign', 'POST', options);
  }

  async triggerDailyContent(): Promise<any> {
    return this.makeRequest('master', '/api/workflows/daily-content', 'POST');
  }

  async triggerRevenueOptimization(): Promise<any> {
    return this.makeRequest('master', '/api/workflows/revenue-optimization', 'POST');
  }

  // Configuration
  async updateEndpoints(newEndpoints: Partial<ServiceEndpoints>): Promise<void> {
    this.endpoints = { ...this.endpoints, ...newEndpoints };
    await AsyncStorage.setItem('api_config', JSON.stringify(this.endpoints));
    this.initializeClients();
  }

  async testConnectivity(): Promise<boolean> {
    try {
      await this.makeRequest('master', '/health');
      return true;
    } catch (error) {
      console.warn('Connectivity test failed:', error);
      return false;
    }
  }

  // Utility methods
  getEndpoints(): ServiceEndpoints {
    return this.endpoints;
  }

  async clearCache(): Promise<void> {
    await AsyncStorage.multiRemove(['api_config', 'auth_token']);
  }
}

export const APIService = new APIServiceClass();
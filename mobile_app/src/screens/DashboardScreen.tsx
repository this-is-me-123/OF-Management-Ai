/**
 * OFEM Mobile Dashboard Screen
 * Main overview screen with key metrics and quick actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Alert,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import SkeletonContent from 'react-native-skeleton-content';
import { showMessage } from 'react-native-flash-message';

// Services
import { APIService, DashboardData } from '../services/APIService';

// Components
import { MetricCard } from '../components/MetricCard';
import { QuickActionCard } from '../components/QuickActionCard';
import { SystemStatusCard } from '../components/SystemStatusCard';
import { RecentActivityCard } from '../components/RecentActivityCard';

const { width } = Dimensions.get('window');

interface DashboardScreenProps {
  navigation: any;
}

interface QuickStats {
  totalRevenue: number;
  totalSubscribers: number;
  engagementRate: number;
  pendingPosts: number;
  activeCampaigns: number;
  systemHealth: string;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Load dashboard data
  const loadDashboard = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const [dashboard, systemHealth] = await Promise.all([
        APIService.getDashboard(),
        APIService.getSystemHealth(),
      ]);

      setDashboardData(dashboard);
      
      // Extract quick stats
      const stats: QuickStats = {
        totalRevenue: dashboard.revenue_metrics?.reduce((sum: number, metric: any) => 
          sum + (metric.total_revenue || 0), 0) || 0,
        totalSubscribers: dashboard.subscriber_management?.total || 0,
        engagementRate: dashboard.analytics_overview?.engagement_rate || 0,
        pendingPosts: dashboard.content_scheduling?.pending || 0,
        activeCampaigns: 0, // Will be populated from API
        systemHealth: systemHealth.orchestrator_status || 'unknown',
      };

      setQuickStats(stats);
      setLastUpdated(new Date());

      if (isRefresh) {
        showMessage({
          message: 'Dashboard updated',
          type: 'success',
          duration: 2000,
        });
      }

    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      showMessage({
        message: 'Error loading dashboard',
        description: error.message,
        type: 'danger',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboard(true);
  }, []);

  // Focus effect to reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  // Quick action handlers
  const quickActions = [
    {
      title: 'Create Content',
      icon: 'add-photo-alternate',
      color: '#FF6B6B',
      onPress: () => navigation.navigate('ContentCreator'),
    },
    {
      title: 'Schedule Post',
      icon: 'schedule',
      color: '#4ECDC4',
      onPress: () => navigation.navigate('Scheduler'),
    },
    {
      title: 'View Analytics',
      icon: 'trending-up',
      color: '#45B7D1',
      onPress: () => navigation.navigate('Analytics'),
    },
    {
      title: 'Revenue Insights',
      icon: 'monetization-on',
      color: '#96CEB4',
      onPress: () => navigation.navigate('Revenue'),
    },
    {
      title: 'Subscribers',
      icon: 'people',
      color: '#FFEAA7',
      onPress: () => navigation.navigate('CRM'),
    },
    {
      title: 'Auto Campaign',
      icon: 'auto-awesome',
      color: '#DDA0DD',
      onPress: () => createAutoCampaign(),
    },
  ];

  const createAutoCampaign = async () => {
    Alert.alert(
      'Create Auto Campaign',
      'This will create and schedule content automatically based on your analytics data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Create', 
          onPress: async () => {
            try {
              showMessage({
                message: 'Creating campaign...',
                type: 'info',
              });

              const result = await APIService.createContentCampaign({
                content_count: 5,
                include_upsell: true,
                schedule_days_ahead: 7,
              });

              showMessage({
                message: 'Campaign created successfully!',
                description: `${result.content_generated} posts scheduled`,
                type: 'success',
              });

              loadDashboard(true);
            } catch (error: any) {
              showMessage({
                message: 'Failed to create campaign',
                description: error.message,
                type: 'danger',
              });
            }
          }
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <SkeletonContent
            containerStyle={styles.skeletonContainer}
            isLoading={true}
            layout={[
              { key: 'header', width: width - 40, height: 120, marginBottom: 20 },
              { key: 'metrics', width: width - 40, height: 200, marginBottom: 20 },
              { key: 'actions', width: width - 40, height: 150, marginBottom: 20 },
            ]}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF1493']}
            tintColor="#FF1493"
          />
        }
      >
        {/* Header Section */}
        <LinearGradient
          colors={['#FF1493', '#FF69B4']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.welcomeText}>Welcome back!</Text>
              <Text style={styles.lastUpdatedText}>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Icon name="settings" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* System Status */}
        <SystemStatusCard 
          status={quickStats?.systemHealth || 'unknown'}
          lastUpdated={lastUpdated}
        />

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Total Revenue"
              value={`$${quickStats?.totalRevenue?.toFixed(2) || '0.00'}`}
              icon="monetization-on"
              color="#4CAF50"
              trend="+12%"
            />
            <MetricCard
              title="Subscribers"
              value={quickStats?.totalSubscribers?.toString() || '0'}
              icon="people"
              color="#2196F3"
              trend="+5%"
            />
            <MetricCard
              title="Engagement"
              value={`${quickStats?.engagementRate?.toFixed(1) || '0.0'}%`}
              icon="favorite"
              color="#FF5722"
              trend="+8%"
            />
            <MetricCard
              title="Pending Posts"
              value={quickStats?.pendingPosts?.toString() || '0'}
              icon="schedule"
              color="#FF9800"
              trend="3 today"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <QuickActionCard
                key={index}
                title={action.title}
                icon={action.icon}
                color={action.color}
                onPress={action.onPress}
              />
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <RecentActivityCard 
          activities={[
            { type: 'content', message: 'Generated new content package', time: '2 min ago' },
            { type: 'revenue', message: 'Campaign converted $125', time: '15 min ago' },
            { type: 'subscriber', message: '3 new subscribers joined', time: '1 hour ago' },
            { type: 'analytics', message: 'Weekly report generated', time: '2 hours ago' },
          ]}
        />

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  skeletonContainer: {
    padding: 20,
  },
  headerGradient: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  lastUpdatedText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bottomPadding: {
    height: 20,
  },
});

export default DashboardScreen;
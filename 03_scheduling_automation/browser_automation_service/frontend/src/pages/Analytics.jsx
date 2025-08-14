import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, DollarSign, Eye, AlertTriangle } from 'lucide-react';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('7d');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAnalytics({
        overview: {
          totalRevenue: 12450.75,
          revenueChange: 8.2,
          totalViews: 45230,
          viewsChange: -2.1,
          conversionRate: 3.4,
          conversionChange: 0.8,
          activeSubscribers: 1247,
          subscribersChange: 12.5
        },
        recentAnomalies: [
          {
            id: 1,
            type: 'revenue_drop',
            severity: 'medium',
            description: 'Revenue 15% below weekly average',
            detectedAt: '2 hours ago'
          },
          {
            id: 2,
            type: 'subscriber_spike',
            severity: 'low',
            description: 'New subscriber rate increased by 25%',
            detectedAt: '1 day ago'
          }
        ],
        trends: {
          revenue: [120, 145, 180, 165, 200, 190, 225],
          subscribers: [1200, 1210, 1235, 1240, 1245, 1247, 1247]
        }
      });
      setLoading(false);
    };

    fetchAnalytics();
  }, [timeRange]);

  const MetricCard = ({ title, value, change, icon: Icon, format = 'number' }) => {
    const isPositive = change > 0;
    const formattedValue = format === 'currency' ? `$${value.toLocaleString()}` : 
                          format === 'percentage' ? `${value}%` : 
                          value.toLocaleString();

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <Icon size={24} className="text-primary-600" />
          <div className={`flex items-center text-sm ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp 
              size={16} 
              className={`mr-1 ${!isPositive ? 'rotate-180' : ''}`} 
            />
            {Math.abs(change)}%
          </div>
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {formattedValue}
        </div>
        <div className="text-sm text-gray-600">
          {title}
        </div>
      </motion.div>
    );
  };

  const AnomalyCard = ({ anomaly }) => {
    const getSeverityColor = (severity) => {
      switch (severity) {
        case 'high': return 'bg-red-100 text-red-800 border-red-200';
        case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        default: return 'bg-blue-100 text-blue-800 border-blue-200';
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="card p-4 border-l-4"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <AlertTriangle size={20} className="text-orange-500" />
            <span className={`status-badge ${getSeverityColor(anomaly.severity)}`}>
              {anomaly.severity}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {anomaly.detectedAt}
          </span>
        </div>
        <p className="text-sm text-gray-800">
          {anomaly.description}
        </p>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="loading-pulse h-8 w-32 mb-2"></div>
            <div className="loading-pulse h-4 w-48"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4">
              <div className="loading-pulse h-6 w-6 mb-4"></div>
              <div className="loading-pulse h-8 w-full mb-2"></div>
              <div className="loading-pulse h-4 w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Performance insights and metrics</p>
        </div>
        <BarChart3 className="text-primary-600" size={24} />
      </div>

      {/* Time Range Selector */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex space-x-2"
      >
        {['24h', '7d', '30d', '90d'].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === range
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {range}
          </button>
        ))}
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          title="Total Revenue"
          value={analytics.overview.totalRevenue}
          change={analytics.overview.revenueChange}
          icon={DollarSign}
          format="currency"
        />
        <MetricCard
          title="Total Views"
          value={analytics.overview.totalViews}
          change={analytics.overview.viewsChange}
          icon={Eye}
        />
        <MetricCard
          title="Conversion Rate"
          value={analytics.overview.conversionRate}
          change={analytics.overview.conversionChange}
          icon={TrendingUp}
          format="percentage"
        />
        <MetricCard
          title="Active Subscribers"
          value={analytics.overview.activeSubscribers}
          change={analytics.overview.subscribersChange}
          icon={TrendingUp}
        />
      </div>

      {/* Recent Anomalies */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Anomalies
        </h2>
        
        {analytics.recentAnomalies.length > 0 ? (
          <div className="space-y-3">
            {analytics.recentAnomalies.map((anomaly) => (
              <AnomalyCard key={anomaly.id} anomaly={anomaly} />
            ))}
          </div>
        ) : (
          <div className="card p-6 text-center">
            <AlertTriangle size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No anomalies detected</p>
            <p className="text-sm text-gray-400">Your performance is stable</p>
          </div>
        )}
      </motion.div>

      {/* Performance Insights */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          AI Insights
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <p className="text-sm text-gray-800 font-medium">
                Subscriber growth trending upward
              </p>
              <p className="text-xs text-gray-600">
                Your engagement strategy is working well this week
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
            <div>
              <p className="text-sm text-gray-800 font-medium">
                Peak engagement hours: 7-9 PM
              </p>
              <p className="text-xs text-gray-600">
                Consider scheduling more content during these hours
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
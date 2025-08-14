import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, TrendingDown, Users, DollarSign, MessageCircle, Activity } from 'lucide-react';

const AnalyticsCharts = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  // Sample data (in real app, this would come from API)
  const sampleData = {
    kpis: {
      revenue: {
        current_month: 12875,
        previous_month: 9650,
        growth_rate: 0.334,
        target: 15000,
        daily_average: 415.32
      },
      subscribers: {
        total_active: 1456,
        new_this_month: 234,
        churned_this_month: 89,
        net_growth: 145,
        churn_rate: 0.061
      },
      engagement: {
        message_response_rate: 0.68,
        post_engagement_rate: 0.41,
        average_session_duration: "8:34",
        messages_per_subscriber: 4.2
      }
    },
    trends: {
      revenue_trend_30_days: [
        {date: "2025-01-15", revenue: 298, subscribers: 1421},
        {date: "2025-01-16", revenue: 456, subscribers: 1423},
        {date: "2025-01-17", revenue: 512, subscribers: 1427},
        {date: "2025-01-18", revenue: 389, subscribers: 1425},
        {date: "2025-01-19", revenue: 634, subscribers: 1431},
        {date: "2025-01-20", revenue: 723, subscribers: 1436},
        {date: "2025-01-21", revenue: 445, subscribers: 1441},
        {date: "2025-01-22", revenue: 578, subscribers: 1445},
        {date: "2025-01-23", revenue: 692, subscribers: 1448},
        {date: "2025-01-24", revenue: 534, subscribers: 1452},
        {date: "2025-01-25", revenue: 601, subscribers: 1456}
      ],
      engagement_trend_7_days: [
        {date: "2025-01-19", messages_sent: 89, response_rate: 0.71},
        {date: "2025-01-20", messages_sent: 156, response_rate: 0.68},
        {date: "2025-01-21", messages_sent: 134, response_rate: 0.72},
        {date: "2025-01-22", messages_sent: 98, response_rate: 0.69},
        {date: "2025-01-23", messages_sent: 203, response_rate: 0.74},
        {date: "2025-01-24", messages_sent: 167, response_rate: 0.66},
        {date: "2025-01-25", messages_sent: 142, response_rate: 0.70}
      ]
    },
    content_analytics: {
      content_categories: {
        lingerie: {posts: 12, avg_engagement: 0.48, revenue: 2340},
        teaser: {posts: 8, avg_engagement: 0.52, revenue: 3456},
        outdoor: {posts: 6, avg_engagement: 0.41, revenue: 1234},
        casual: {posts: 15, avg_engagement: 0.38, revenue: 1876},
        explicit: {posts: 4, avg_engagement: 0.67, revenue: 2890}
      }
    },
    subscriber_analytics: {
      demographics: {
        age_groups: {
          "18-24": 0.15,
          "25-34": 0.42,
          "35-44": 0.28,
          "45-54": 0.12,
          "55+": 0.03
        }
      }
    }
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAnalyticsData(sampleData);
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  const formatCurrency = (value) => `$${value.toLocaleString()}`;
  const formatPercentage = (value) => `${(value * 100).toFixed(1)}%`;

  // Prepare chart data
  const prepareRevenueData = () => {
    return analyticsData?.trends?.revenue_trend_30_days?.map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    })) || [];
  };

  const prepareEngagementData = () => {
    return analyticsData?.trends?.engagement_trend_7_days?.map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
      response_rate_percent: item.response_rate * 100
    })) || [];
  };

  const prepareContentCategoryData = () => {
    const categories = analyticsData?.content_analytics?.content_categories || {};
    return Object.entries(categories).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      posts: data.posts,
      engagement: data.avg_engagement * 100,
      revenue: data.revenue
    }));
  };

  const prepareAgeGroupData = () => {
    const ageGroups = analyticsData?.subscriber_analytics?.demographics?.age_groups || {};
    return Object.entries(ageGroups).map(([age, percentage]) => ({
      age,
      value: percentage * 100,
      count: Math.round(percentage * 1456) // Assuming total of 1456 subscribers
    }));
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analyticsData?.kpis?.revenue?.current_month || 0)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
          <div className="mt-2 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-600 ml-1">
              +{formatPercentage(analyticsData?.kpis?.revenue?.growth_rate || 0)}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Subscribers</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData?.kpis?.subscribers?.total_active?.toLocaleString() || 0}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <div className="mt-2 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-600 ml-1">
              +{analyticsData?.kpis?.subscribers?.net_growth || 0} this month
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(analyticsData?.kpis?.engagement?.post_engagement_rate || 0)}
              </p>
            </div>
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
          <div className="mt-2 flex items-center">
            <MessageCircle className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-gray-600 ml-1">
              {formatPercentage(analyticsData?.kpis?.engagement?.message_response_rate || 0)} response rate
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Churn Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(analyticsData?.kpis?.subscribers?.churn_rate || 0)}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">
              {analyticsData?.kpis?.subscribers?.churned_this_month || 0} churned this month
            </span>
          </div>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={prepareRevenueData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
            <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Engagement and Content Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Trend */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={prepareEngagementData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => `${value}%`} />
              <Tooltip formatter={(value) => [`${value}%`, 'Response Rate']} />
              <Line type="monotone" dataKey="response_rate_percent" stroke="#82ca9d" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Content Category Performance */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Category Revenue</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={prepareContentCategoryData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
              <Bar dataKey="revenue" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Demographics and Content Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age Demographics */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscriber Demographics</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={prepareAgeGroupData()}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({age, value}) => `${age}: ${value.toFixed(1)}%`}
              >
                {prepareAgeGroupData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Percentage']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Content Engagement Analysis */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Engagement by Type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={prepareContentCategoryData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `${value}%`} />
              <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Engagement Rate']} />
              <Bar dataKey="engagement" fill="#ff7300" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights Panel */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Revenue Growth</p>
              <p className="text-sm text-green-700">Revenue is up 33.4% this month! Your Valentine's campaign is performing exceptionally well.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Activity className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Engagement Opportunity</p>
              <p className="text-sm text-yellow-700">Engagement on Tuesday posts is 23% below average. Try posting at different times or different content types on Tuesdays.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Users className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Retention Focus</p>
              <p className="text-sm text-blue-700">67 subscribers are at high churn risk but haven't been contacted in 10+ days. Launch targeted retention campaign immediately.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
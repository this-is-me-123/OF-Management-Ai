import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { 
  Plus, 
  Calendar, 
  Users, 
  TrendingUp, 
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

// Quick Stats Component
const QuickStats = ({ stats, loading }) => {
  const statItems = [
    {
      title: 'Total Subscribers',
      value: stats?.totalSubscribers || 0,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      title: 'Recent Messages',
      value: stats?.recentMessages || 0,
      icon: Activity,
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      title: 'Revenue',
      value: `$${(stats?.totalRevenue || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-100'
    },
    {
      title: 'Pending Jobs',
      value: stats?.pendingJobs || 0,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-100'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-4">
            <div className="loading-pulse h-4 w-full mb-2"></div>
            <div className="loading-pulse h-8 w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statItems.map((item, index) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="card p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-lg ${item.bg}`}>
              <item.icon size={20} className={item.color} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {item.value}
          </div>
          <div className="text-sm text-gray-600">
            {item.title}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Job Card Component
const JobCard = ({ job }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'failed': return 'status-failed';
      case 'running': return 'status-processing';
      default: return 'status-queued';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'failed': return AlertCircle;
      case 'running': return RefreshCw;
      default: return Clock;
    }
  };

  const StatusIcon = getStatusIcon(job.status);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <StatusIcon size={16} className="text-gray-400" />
          <span className="font-medium text-gray-900 truncate">
            {job.type || job.folder}
          </span>
        </div>
        <span className={`status-badge ${getStatusColor(job.status)}`}>
          {job.status}
        </span>
      </div>
      
      <div className="text-sm text-gray-600 mb-2">
        ID: {job.id}
      </div>
      
      <div className="text-xs text-gray-500">
        {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
      </div>
    </motion.div>
  );
};

// Quick Actions Component
const QuickActions = ({ onNewJob, onRunCampaign }) => {
  const actions = [
    {
      title: 'New Post',
      icon: Plus,
      color: 'btn-primary',
      onClick: onNewJob
    },
    {
      title: 'Schedule Content',
      icon: Calendar,
      color: 'btn-secondary',
      onClick: () => toast.success('Scheduler coming soon!')
    }
  ];

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <button
            key={action.title}
            onClick={action.onClick}
            className={`${action.color} flex flex-col items-center space-y-2 py-4`}
          >
            <action.icon size={24} />
            <span className="text-sm font-medium">{action.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// New Job Modal Component
const NewJobModal = ({ isOpen, onClose, onSubmit }) => {
  const [jobData, setJobData] = useState({
    type: 'post_content',
    text: '',
    media: []
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSubmit(jobData);
      setJobData({ type: 'post_content', text: '', media: [] });
      onClose();
      toast.success('Job created successfully!');
    } catch (error) {
      toast.error('Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 w-full max-w-md"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Create New Job
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Job Type</label>
            <select
              value={jobData.type}
              onChange={(e) => setJobData({ ...jobData, type: e.target.value })}
              className="input"
            >
              <option value="post_content">Post Content</option>
              <option value="send_dm">Send DM</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Content</label>
            <textarea
              value={jobData.text}
              onChange={(e) => setJobData({ ...jobData, text: e.target.value })}
              placeholder="Enter your content..."
              className="input"
              rows={4}
              required
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading || !jobData.text.trim()}
            >
              {loading ? (
                <div className="loading-spinner w-5 h-5 mx-auto" />
              ) : (
                'Create Job'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Main Dashboard Component
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewJobModal, setShowNewJobModal] = useState(false);

  // Fetch dashboard data
  const fetchDashboardData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setRefreshing(!showLoader);

      // Mock API calls - replace with actual OFEM API endpoints
      const [statsRes, jobsRes] = await Promise.all([
        fetch('/api/system/status').catch(() => ({ ok: false })),
        fetch('/api/jobs?limit=10').catch(() => ({ ok: false }))
      ]);

      // Mock data for demonstration
      const mockStats = {
        totalSubscribers: 1247,
        recentMessages: 156,
        totalRevenue: 8495.50,
        pendingJobs: 3
      };

      const mockJobs = [
        {
          id: 1,
          type: 'post_content',
          status: 'completed',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          type: 'send_dm',
          status: 'running',
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          id: 3,
          type: 'post_content',
          status: 'queued',
          created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        }
      ];

      setStats(mockStats);
      setJobs(mockJobs);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Create new job
  const handleCreateJob = async (jobData) => {
    // Mock job creation - replace with actual OFEM API call
    const newJob = {
      id: Date.now(),
      type: jobData.type,
      status: 'queued',
      created_at: new Date().toISOString(),
      content: jobData.text
    };

    setJobs(prev => [newJob, ...prev.slice(0, 9)]);
    
    // In real implementation, this would call the OFEM publishContent API
    console.log('Creating job:', jobData);
  };

  // Run campaign
  const handleRunCampaign = async (campaignType) => {
    toast.success(`${campaignType} campaign started!`);
    // In real implementation, this would call the OFEM triggerCampaign API
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchDashboardData(false), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back to OFEM</p>
        </div>
        <button
          onClick={() => fetchDashboardData(false)}
          disabled={refreshing}
          className="btn-ghost p-2"
        >
          <RefreshCw 
            size={20} 
            className={refreshing ? 'animate-spin' : ''} 
          />
        </button>
      </div>

      {/* Quick Stats */}
      <QuickStats stats={stats} loading={loading} />

      {/* Quick Actions */}
      <QuickActions 
        onNewJob={() => setShowNewJobModal(true)}
        onRunCampaign={handleRunCampaign}
      />

      {/* Recent Jobs */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Jobs
        </h2>
        
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-4">
                <div className="loading-pulse h-4 w-full mb-2"></div>
                <div className="loading-pulse h-6 w-1/2"></div>
              </div>
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <div className="space-y-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Clock size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No recent jobs found</p>
            <button
              onClick={() => setShowNewJobModal(true)}
              className="btn-primary mt-4"
            >
              Create First Job
            </button>
          </div>
        )}
      </div>

      {/* New Job Modal */}
      <NewJobModal
        isOpen={showNewJobModal}
        onClose={() => setShowNewJobModal(false)}
        onSubmit={handleCreateJob}
      />
    </div>
  );
}
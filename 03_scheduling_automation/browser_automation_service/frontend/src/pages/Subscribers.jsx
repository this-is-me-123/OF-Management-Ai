import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Star, MessageCircle, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Subscribers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  // Mock subscriber data
  const subscribers = [
    {
      id: 1,
      username: 'user123',
      tier: 'premium',
      engagement: 'high',
      totalSpent: 250.00,
      lastActive: '2 hours ago'
    },
    {
      id: 2,
      username: 'subscriber456',
      tier: 'free',
      engagement: 'medium',
      totalSpent: 45.00,
      lastActive: '1 day ago'
    },
    {
      id: 3,
      username: 'vipfan789',
      tier: 'vip',
      engagement: 'high',
      totalSpent: 750.00,
      lastActive: '30 minutes ago'
    }
  ];

  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch = sub.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || sub.tier === filter;
    return matchesSearch && matchesFilter;
  });

  const getTierColor = (tier) => {
    switch (tier) {
      case 'vip': return 'bg-purple-100 text-purple-800';
      case 'premium': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEngagementColor = (engagement) => {
    switch (engagement) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-red-600';
    }
  };

  const handleSendMessage = (subscriber) => {
    toast.success(`Message composer opened for ${subscriber.username}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscribers</h1>
          <p className="text-gray-600">{subscribers.length} total subscribers</p>
        </div>
        <Users className="text-primary-600" size={24} />
      </div>

      {/* Search and Filter */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-4 space-y-4"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search subscribers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input text-sm"
          >
            <option value="all">All Tiers</option>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
            <option value="vip">VIP</option>
          </select>
        </div>
      </motion.div>

      {/* Subscribers List */}
      <div className="space-y-3">
        {filteredSubscribers.map((subscriber, index) => (
          <motion.div
            key={subscriber.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-medium">
                    {subscriber.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {subscriber.username}
                  </div>
                  <div className="text-sm text-gray-500">
                    {subscriber.lastActive}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleSendMessage(subscriber)}
                className="btn-ghost p-2"
              >
                <MessageCircle size={20} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`status-badge ${getTierColor(subscriber.tier)}`}>
                  {subscriber.tier}
                </span>
                <div className="flex items-center space-x-1">
                  <Star size={14} className={getEngagementColor(subscriber.engagement)} />
                  <span className={`text-sm ${getEngagementColor(subscriber.engagement)}`}>
                    {subscriber.engagement}
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-medium text-gray-900">
                  ${subscriber.totalSpent.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">
                  total spent
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredSubscribers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Users size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No subscribers found</p>
          <p className="text-sm">Try adjusting your search or filter</p>
        </div>
      )}
    </div>
  );
}
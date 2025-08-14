import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Clock, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Scheduler() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPost, setNewPost] = useState({ text: '', time: '12:00' });

  const handleSchedulePost = (e) => {
    e.preventDefault();
    if (!newPost.text.trim()) {
      toast.error('Please enter content for your post');
      return;
    }
    
    toast.success('Post scheduled successfully!');
    setNewPost({ text: '', time: '12:00' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Scheduler</h1>
          <p className="text-gray-600">Schedule your OnlyFans content</p>
        </div>
        <Calendar className="text-primary-600" size={24} />
      </div>

      {/* Schedule Form */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Schedule New Post
        </h2>
        
        <form onSubmit={handleSchedulePost} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Time</label>
            <input
              type="time"
              value={newPost.time}
              onChange={(e) => setNewPost({ ...newPost, time: e.target.value })}
              className="input"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Content</label>
            <textarea
              value={newPost.text}
              onChange={(e) => setNewPost({ ...newPost, text: e.target.value })}
              placeholder="What's on your mind?"
              className="input"
              rows={4}
            />
          </div>
          
          <button type="submit" className="btn-primary w-full">
            <Send size={20} className="mr-2" />
            Schedule Post
          </button>
        </form>
      </motion.div>

      {/* Upcoming Posts */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Upcoming Posts
        </h2>
        
        <div className="text-center py-12 text-gray-500">
          <Clock size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No scheduled posts yet</p>
          <p className="text-sm">Schedule your first post above</p>
        </div>
      </motion.div>
    </div>
  );
}
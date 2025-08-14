import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Hash, 
  Clock, 
  Send, 
  RefreshCw, 
  Eye,
  Calendar,
  TrendingUp,
  Target,
  Zap,
  CheckCircle,
  X,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [media, setMedia] = useState(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [suggestedHashtags, setSuggestedHashtags] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState({});
  const [selectedSchedule, setSelectedSchedule] = useState('now');
  const [customSchedule, setCustomSchedule] = useState({
    date: '',
    time: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Load captured media
  useEffect(() => {
    const loadMedia = () => {
      const mediaData = localStorage.getItem(`captured-media-${id}`);
      if (mediaData) {
        const parsedMedia = JSON.parse(mediaData);
        setMedia(parsedMedia);
        generateAIContent(parsedMedia);
      } else {
        toast.error('Media not found');
        navigate('/camera');
      }
    };

    loadMedia();
  }, [id, navigate]);

  // Generate AI content (captions, hashtags, optimization)
  const generateAIContent = async (mediaData) => {
    setIsGenerating(true);
    try {
      // Simulate AI API call (replace with actual OpenAI/API integration)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Mock AI-generated content
      const aiContent = {
        captions: [
          "✨ Feeling absolutely radiant today! This lighting is everything 💫 What's making you shine this week? Drop it in the comments! 👇",
          "Good vibes only ✌️ Sometimes you just gotta capture the moment when you're feeling yourself 💕 #SelfLove #GoodEnergy",
          "Natural beauty hits different when the lighting is just right 🌟 Who else is obsessed with golden hour? 🌅"
        ],
        hashtags: [
          '#selflove', '#confidence', '#naturalbeauty', '#goldenhour', 
          '#positivevibes', '#selfcare', '#beauty', '#radiant', '#glowing',
          '#feelingmyself', '#goodenergy', '#beautiful', '#authentic',
          '#selfexpression', '#empowered', '#mindfulness', '#wellness'
        ],
        optimization: {
          bestTime: '7:00 PM',
          expectedReach: '2.3K - 4.1K',
          engagementBoost: '+23%',
          optimalLength: '85-120 characters'
        }
      };

      setAiSuggestions(aiContent);
      setCaption(aiContent.captions[0]);
      setSuggestedHashtags(aiContent.hashtags);
      setHashtags(aiContent.hashtags.slice(0, 8)); // Pre-select first 8

      toast.success('AI optimization complete!');
    } catch (error) {
      toast.error('Failed to generate AI content');
      console.error('AI generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Regenerate AI suggestions
  const regenerateAI = () => {
    generateAIContent(media);
  };

  // Toggle hashtag selection
  const toggleHashtag = (hashtag) => {
    setHashtags(prev => {
      if (prev.includes(hashtag)) {
        return prev.filter(h => h !== hashtag);
      } else if (prev.length < 15) {
        return [...prev, hashtag];
      } else {
        toast.error('Maximum 15 hashtags allowed');
        return prev;
      }
    });
  };

  // Add custom hashtag
  const addCustomHashtag = (customTag) => {
    if (customTag && !hashtags.includes(customTag) && hashtags.length < 15) {
      setHashtags(prev => [...prev, customTag]);
    }
  };

  // Publish content
  const publishContent = async () => {
    if (!caption.trim()) {
      toast.error('Please add a caption');
      return;
    }

    setIsPublishing(true);
    try {
      // Prepare content data
      const contentData = {
        media: media,
        caption: caption,
        hashtags: hashtags,
        schedule: selectedSchedule === 'custom' ? customSchedule : selectedSchedule,
        aiOptimization: aiSuggestions.optimization
      };

      // Simulate API call to OFEM backend
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Clean up stored media
      localStorage.removeItem(`captured-media-${id}`);
      
      toast.success('Content published successfully!');
      navigate('/content');
      
    } catch (error) {
      toast.error('Failed to publish content');
      console.error('Publishing error:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  // Optimal time slots
  const timeSlots = [
    { time: '9:00 AM', label: 'Morning', boost: '+15%', type: 'good' },
    { time: '12:00 PM', label: 'Lunch', boost: '+8%', type: 'neutral' },
    { time: '3:00 PM', label: 'Afternoon', boost: '+5%', type: 'neutral' },
    { time: '7:00 PM', label: 'Prime Time', boost: '+23%', type: 'optimal' },
    { time: '9:00 PM', label: 'Evening', boost: '+18%', type: 'good' },
    { time: '11:00 PM', label: 'Late Night', boost: '+12%', type: 'good' }
  ];

  if (!media) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Media Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="content-preview bg-gray-100"
      >
        {media.type === 'image' ? (
          <img
            src={media.data}
            alt="Content preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            src={media.data}
            controls
            className="w-full h-full object-cover"
          />
        )}
      </motion.div>

      {/* AI Enhancement Status */}
      {isGenerating ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="ai-suggestion"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <div>
              <h4 className="font-semibold text-purple-800">AI is analyzing your content...</h4>
              <p className="text-sm text-purple-600">Generating captions, hashtags, and optimization tips</p>
            </div>
          </div>
        </motion.div>
      ) : aiSuggestions.optimization && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="ai-suggestion"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-purple-800">AI Optimization Complete</h4>
            </div>
            <button
              onClick={regenerateAI}
              className="p-1 rounded-lg hover:bg-purple-200 transition-colors"
            >
              <RefreshCw size={16} className="text-purple-600" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-purple-600" />
              <span>Expected reach: {aiSuggestions.optimization.expectedReach}</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span>Engagement: {aiSuggestions.optimization.engagementBoost}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Caption Editor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="editing-panel"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Caption</h3>
          <span className="text-sm text-gray-500">
            {caption.length}/500
          </span>
        </div>
        
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write your caption..."
          className="creator-textarea w-full"
          maxLength={500}
        />

        {/* AI Caption Suggestions */}
        {aiSuggestions.captions && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">AI Suggestions</h4>
            <div className="space-y-2">
              {aiSuggestions.captions.slice(1).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setCaption(suggestion)}
                  className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Hashtag Editor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="editing-panel"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Hashtags</h3>
          <span className="text-sm text-gray-500">
            {hashtags.length}/15
          </span>
        </div>

        {/* Selected Hashtags */}
        <div className="hashtag-cloud mb-4">
          {hashtags.map((hashtag, index) => (
            <span
              key={index}
              className="hashtag-tag selected"
              onClick={() => toggleHashtag(hashtag)}
            >
              {hashtag}
              <X size={12} className="ml-1" />
            </span>
          ))}
        </div>

        {/* Suggested Hashtags */}
        {suggestedHashtags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested</h4>
            <div className="hashtag-cloud">
              {suggestedHashtags
                .filter(tag => !hashtags.includes(tag))
                .map((hashtag, index) => (
                  <span
                    key={index}
                    className="hashtag-tag"
                    onClick={() => toggleHashtag(hashtag)}
                  >
                    <Plus size={12} className="mr-1" />
                    {hashtag}
                  </span>
                ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Scheduling */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="schedule-picker"
      >
        <h3 className="font-semibold text-gray-900 mb-4">When to Post</h3>
        
        <div className="space-y-3 mb-4">
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              name="schedule"
              value="now"
              checked={selectedSchedule === 'now'}
              onChange={(e) => setSelectedSchedule(e.target.value)}
              className="w-4 h-4 text-primary-600"
            />
            <span>Post now</span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              name="schedule"
              value="optimal"
              checked={selectedSchedule === 'optimal'}
              onChange={(e) => setSelectedSchedule(e.target.value)}
              className="w-4 h-4 text-primary-600"
            />
            <span className="flex items-center space-x-2">
              <span>Optimal time</span>
              <span className="text-sm text-green-600 font-medium">
                ({aiSuggestions.optimization?.bestTime})
              </span>
              <Target size={14} className="text-green-600" />
            </span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              name="schedule"
              value="custom"
              checked={selectedSchedule === 'custom'}
              onChange={(e) => setSelectedSchedule(e.target.value)}
              className="w-4 h-4 text-primary-600"
            />
            <span>Custom time</span>
          </label>
        </div>

        {/* Time Slots Grid */}
        <div className="time-slots">
          {timeSlots.map(({ time, label, boost, type }) => (
            <button
              key={time}
              onClick={() => setSelectedSchedule(time)}
              className={`time-slot ${type === 'optimal' ? 'optimal' : ''} ${
                selectedSchedule === time ? 'selected' : ''
              }`}
            >
              <div className="font-medium">{time}</div>
              <div className="text-xs opacity-75">{label}</div>
              <div className={`text-xs font-medium ${
                type === 'optimal' ? 'text-green-700' :
                type === 'good' ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {boost}
              </div>
            </button>
          ))}
        </div>

        {/* Custom Schedule Inputs */}
        {selectedSchedule === 'custom' && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            <input
              type="date"
              value={customSchedule.date}
              onChange={(e) => setCustomSchedule(prev => ({ ...prev, date: e.target.value }))}
              className="creator-input"
              min={new Date().toISOString().split('T')[0]}
            />
            <input
              type="time"
              value={customSchedule.time}
              onChange={(e) => setCustomSchedule(prev => ({ ...prev, time: e.target.value }))}
              className="creator-input"
            />
          </div>
        )}
      </motion.div>

      {/* Publish Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <button
          onClick={publishContent}
          disabled={isPublishing || !caption.trim()}
          className="creator-btn-primary w-full flex items-center justify-center space-x-2"
        >
          {isPublishing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Publishing...</span>
            </>
          ) : selectedSchedule === 'now' ? (
            <>
              <Send size={20} />
              <span>Publish Now</span>
            </>
          ) : (
            <>
              <Calendar size={20} />
              <span>Schedule Post</span>
            </>
          )}
        </button>
        
        <button
          onClick={() => navigate('/camera')}
          className="creator-btn-secondary w-full"
        >
          Back to Camera
        </button>
      </motion.div>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  Link
} from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Camera, 
  Image, 
  BarChart3, 
  User, 
  Sparkles,
  Heart,
  Zap
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

// Import pages
import CameraCapture from "./pages/CameraCapture";
import ContentLibrary from "./pages/ContentLibrary";
import CreatorAnalytics from "./pages/CreatorAnalytics";
import CreatorProfile from "./pages/CreatorProfile";
import ContentEditor from "./pages/ContentEditor";
import Login from "./pages/Login";

// Creator Navigation Component
const CreatorNav = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/camera', icon: Camera, label: 'Camera', color: 'text-blue-500' },
    { path: '/content', icon: Image, label: 'Content', color: 'text-purple-500' },
    { path: '/analytics', icon: BarChart3, label: 'Stats', color: 'text-green-500' },
    { path: '/profile', icon: User, label: 'Profile', color: 'text-orange-500' },
  ];

  return (
    <nav className="creator-nav md:hidden">
      {navItems.map(({ path, icon: Icon, label, color }) => (
        <Link
          key={path}
          to={path}
          className={`creator-nav-item ${location.pathname === path ? 'active' : ''}`}
        >
          <Icon size={24} className={`mb-1 ${location.pathname === path ? 'text-primary-600' : color}`} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
};

// Header Component with creator branding
const CreatorHeader = ({ showBack = false, title = "OFEM Creator" }) => {
  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 px-4 py-3 header-safe sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {showBack ? (
            <button 
              onClick={() => window.history.back()}
              className="p-2 rounded-xl hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900">{title}</h1>
                <p className="text-xs text-gray-500">AI Content Studio</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full">
            <Heart className="w-4 h-4 text-pink-500" />
            <span className="text-sm font-medium text-pink-700">Pro</span>
          </div>
        </div>
      </div>
    </header>
  );
};

// Page Layout Wrapper with creator styling
const CreatorPageLayout = ({ children, showBack = false, title }) => {
  return (
    <div className="min-h-screen">
      <CreatorHeader showBack={showBack} title={title} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 content-safe"
      >
        {children}
      </motion.div>
    </div>
  );
};

// Welcome/Onboarding Component
const Welcome = () => {
  const [currentTip, setCurrentTip] = useState(0);
  
  const tips = [
    {
      icon: Camera,
      title: "Capture with AI",
      description: "Take photos or videos and let AI optimize them automatically",
      color: "from-blue-400 to-blue-600"
    },
    {
      icon: Sparkles,
      title: "Smart Captions",
      description: "Get AI-generated captions and hashtags that boost engagement",
      color: "from-purple-400 to-purple-600"
    },
    {
      icon: Zap,
      title: "Auto Schedule",
      description: "Post at optimal times based on your audience analytics",
      color: "from-green-400 to-green-600"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl mb-6 flex items-center justify-center shadow-2xl"
      >
        <Sparkles className="w-12 h-12 text-white" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-bold text-gray-900 mb-2"
      >
        Welcome to OFEM Creator
      </motion.h1>
      
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-gray-600 mb-8 max-w-sm"
      >
        Your AI-powered content creation studio for OnlyFans success
      </motion.p>

      {/* Rotating Tips */}
      <motion.div
        key={currentTip}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="creator-card p-6 max-w-sm mb-8"
      >
        <div className={`w-12 h-12 bg-gradient-to-br ${tips[currentTip].color} rounded-xl mb-4 flex items-center justify-center mx-auto`}>
          <tips[currentTip].icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">{tips[currentTip].title}</h3>
        <p className="text-sm text-gray-600">{tips[currentTip].description}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-3 w-full max-w-sm"
      >
        <Link to="/camera" className="creator-btn-primary w-full block text-center">
          <Camera className="inline w-5 h-5 mr-2" />
          Start Creating
        </Link>
        <Link to="/content" className="creator-btn-secondary w-full block text-center">
          View My Content
        </Link>
      </motion.div>

      {/* Tip Indicators */}
      <div className="flex space-x-2 mt-6">
        {tips.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              index === currentTip ? 'bg-primary-500' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Main App Component
export default function CreatorApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('creator-token');
      setIsAuthenticated(!!token);
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  // PWA Install Prompt
  useEffect(() => {
    let deferredPrompt;
    
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      setTimeout(() => {
        if (deferredPrompt) {
          toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} 
              max-w-md w-full bg-white shadow-lg rounded-2xl pointer-events-auto 
              flex ring-1 ring-black ring-opacity-5 overflow-hidden`}>
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Install OFEM Creator
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Add to home screen for instant access to your content studio
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200">
                <button
                  onClick={() => {
                    deferredPrompt.prompt();
                    deferredPrompt = null;
                    toast.dismiss(t.id);
                  }}
                  className="w-full border border-transparent rounded-none rounded-r-2xl 
                    p-4 flex items-center justify-center text-sm font-medium 
                    text-primary-600 hover:text-primary-500 bg-primary-50"
                >
                  Install
                </button>
              </div>
            </div>
          ), { duration: 8000 });
        }
      }, 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mx-auto mb-4 flex items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading OFEM Creator...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        {isAuthenticated ? (
          <>
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route 
                path="/camera" 
                element={
                  <CreatorPageLayout title="Camera">
                    <CameraCapture />
                  </CreatorPageLayout>
                } 
              />
              <Route 
                path="/content" 
                element={
                  <CreatorPageLayout title="My Content">
                    <ContentLibrary />
                  </CreatorPageLayout>
                } 
              />
              <Route 
                path="/content/edit/:id" 
                element={
                  <CreatorPageLayout showBack title="Edit Content">
                    <ContentEditor />
                  </CreatorPageLayout>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <CreatorPageLayout title="Analytics">
                    <CreatorAnalytics />
                  </CreatorPageLayout>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <CreatorPageLayout title="Profile">
                    <CreatorProfile />
                  </CreatorPageLayout>
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            {/* Creator Navigation */}
            <CreatorNav />
          </>
        ) : (
          <Routes>
            <Route path="/login" element={<Login onLogin={setIsAuthenticated} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </div>
      
      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            borderRadius: '16px',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#ec4899',
              secondary: '#fff',
            },
          },
        }}
      />
    </Router>
  );
}
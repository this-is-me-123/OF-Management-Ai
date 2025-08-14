/**
 * Mobile Layout Component
 * Bottom navigation optimized for mobile touch interfaces
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Image,
  Calendar,
  BarChart3,
  DollarSign,
  Users,
  Settings,
  Plus,
  Bell,
  Menu,
} from 'lucide-react';

interface MobileLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showFAB, setShowFAB] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [notifications, setNotifications] = useState(3); // Mock notification count

  const navItems: NavItem[] = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/content', icon: Image, label: 'Content' },
    { path: '/scheduler', icon: Calendar, label: 'Schedule' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/revenue', icon: DollarSign, label: 'Revenue' },
  ];

  // Hide/show FAB based on scroll direction
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setShowFAB(currentScrollY < lastScrollY || currentScrollY < 10);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const isActiveRoute = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    
    // Haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleFABClick = () => {
    navigate('/content/create');
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 50, 100]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              OFEM
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Bell size={20} className="text-gray-600" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications > 9 ? '9+' : notifications}
                </span>
              )}
            </button>

            {/* Menu */}
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Menu size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Action Button */}
      <AnimatePresence>
        {showFAB && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleFABClick}
            className="fixed bottom-24 right-4 z-50 bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <Plus size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'text-pink-600 bg-pink-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Icon 
                    size={20} 
                    className={isActive ? 'text-pink-600' : 'text-gray-600'} 
                  />
                </motion.div>
                <span 
                  className={`text-xs mt-1 font-medium ${
                    isActive ? 'text-pink-600' : 'text-gray-600'
                  }`}
                >
                  {item.label}
                </span>
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-1 w-1 h-1 bg-pink-600 rounded-full"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Safe area for devices with notches */}
      <style>{`
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .pb-20 {
            padding-bottom: calc(5rem + env(safe-area-inset-bottom));
          }
          nav {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }
      `}</style>
    </div>
  );
};
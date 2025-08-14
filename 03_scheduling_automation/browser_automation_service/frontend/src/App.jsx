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
  Home, 
  Calendar, 
  Users, 
  BarChart3, 
  Settings, 
  Menu,
  X,
  Smartphone
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

// Import pages
import Dashboard from "./pages/Dashboard";
import Scheduler from "./pages/Scheduler";
import Subscribers from "./pages/Subscribers";
import Analytics from "./pages/Analytics";
import Settings_Page from "./pages/Settings";
import Login from "./pages/Login";

// Mobile Navigation Component
const MobileNav = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/scheduler', icon: Calendar, label: 'Schedule' },
    { path: '/subscribers', icon: Users, label: 'Subscribers' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="mobile-nav md:hidden">
      {navItems.map(({ path, icon: Icon, label }) => (
        <Link
          key={path}
          to={path}
          className={`mobile-nav-item ${location.pathname === path ? 'active' : ''}`}
        >
          <Icon size={20} className="mb-1" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
};

// Desktop Sidebar Component
const DesktopSidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  
  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/scheduler', icon: Calendar, label: 'Scheduler' },
    { path: '/subscribers', icon: Users, label: 'Subscribers' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-0 left-0 z-50 w-64 h-full bg-white border-r border-gray-200 lg:translate-x-0 lg:static lg:block"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">OFEM</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="p-4 space-y-2">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                location.pathname === path
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{label}</span>
            </Link>
          ))}
        </nav>
      </motion.aside>
    </>
  );
};

// Header Component
const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 lg:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
          >
            <Menu size={20} />
          </button>
          
          <div className="hidden lg:block">
            <h1 className="text-xl font-semibold text-gray-900">
              OnlyFans Enterprise Management
            </h1>
          </div>
          
          <div className="lg:hidden flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">OFEM</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {!isOnline && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Offline</span>
            </div>
          )}
          
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">U</span>
          </div>
        </div>
      </div>
    </header>
  );
};

// Page Layout Wrapper
const PageLayout = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 pb-20 md:pb-4 max-w-7xl mx-auto"
    >
      {children}
    </motion.div>
  );
};

// Main App Component
export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // PWA Install Prompt
  useEffect(() => {
    let deferredPrompt;
    
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Show install prompt after a delay
      setTimeout(() => {
        if (deferredPrompt) {
          toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} 
              max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto 
              flex ring-1 ring-black ring-opacity-5`}>
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Smartphone className="h-10 w-10 text-primary-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Install OFEM App
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Add to home screen for quick access
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
                  className="w-full border border-transparent rounded-none rounded-r-lg 
                    p-4 flex items-center justify-center text-sm font-medium 
                    text-primary-600 hover:text-primary-500"
                >
                  Install
                </button>
              </div>
            </div>
          ), { duration: 8000 });
        }
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Desktop Sidebar */}
        <DesktopSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:ml-0">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route 
                path="/dashboard" 
                element={
                  <PageLayout>
                    <Dashboard />
                  </PageLayout>
                } 
              />
              <Route 
                path="/scheduler" 
                element={
                  <PageLayout>
                    <Scheduler />
                  </PageLayout>
                } 
              />
              <Route 
                path="/subscribers" 
                element={
                  <PageLayout>
                    <Subscribers />
                  </PageLayout>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <PageLayout>
                    <Analytics />
                  </PageLayout>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <PageLayout>
                    <Settings_Page />
                  </PageLayout>
                } 
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
          
          {/* Mobile Navigation */}
          <MobileNav />
        </div>
      </div>
      
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          },
        }}
      />
    </Router>
  );
}
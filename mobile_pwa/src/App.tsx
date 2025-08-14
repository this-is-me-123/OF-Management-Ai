/**
 * OFEM Mobile PWA - Main Application
 * Progressive Web App optimized for mobile browsers
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Hooks & Services
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { useOfflineStatus } from './hooks/useOfflineStatus';
import { useNotifications } from './hooks/useNotifications';
import { useSwUpdates } from './hooks/useSwUpdates';

// Layout Components
import { MobileLayout } from './components/layout/MobileLayout';
import { InstallPrompt } from './components/InstallPrompt';
import { OfflineBanner } from './components/OfflineBanner';
import { UpdateBanner } from './components/UpdateBanner';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { ContentPage } from './pages/ContentPage';
import { SchedulerPage } from './pages/SchedulerPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { RevenuePage } from './pages/RevenuePage';
import { CRMPage } from './pages/CRMPage';
import { SettingsPage } from './pages/SettingsPage';
import { ContentCreatorPage } from './pages/ContentCreatorPage';
import { LoginPage } from './pages/LoginPage';

// Store
import { useAuthStore } from './store/authStore';

// Styles
import './App.css';

// React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  const { isAuthenticated, initialize } = useAuthStore();
  const { showInstallPrompt, installApp, dismissPrompt } = useInstallPrompt();
  const isOffline = useOfflineStatus();
  const { requestPermission } = useNotifications();
  const { updateAvailable, updateApp } = useSwUpdates();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize auth state
        await initialize();
        
        // Request notification permission if authenticated
        if (isAuthenticated) {
          await requestPermission();
        }

        // Register service worker events
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'CACHE_UPDATED') {
              console.log('App data updated in background');
            }
          });
        }

        setIsLoading(false);
      } catch (error) {
        console.error('App initialization failed:', error);
        setIsLoading(false);
      }
    };

    initApp();
  }, [initialize, isAuthenticated, requestPermission]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-500 to-purple-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-white mb-2">OFEM</h1>
          <p className="text-white/80">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          {/* Offline Banner */}
          {isOffline && <OfflineBanner />}
          
          {/* Update Banner */}
          {updateAvailable && (
            <UpdateBanner onUpdate={updateApp} onDismiss={() => {}} />
          )}

          {/* Install Prompt */}
          {showInstallPrompt && (
            <InstallPrompt 
              onInstall={installApp}
              onDismiss={dismissPrompt}
            />
          )}

          {/* Main App */}
          {isAuthenticated ? (
            <MobileLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/content" element={<ContentPage />} />
                <Route path="/content/create" element={<ContentCreatorPage />} />
                <Route path="/scheduler" element={<SchedulerPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/revenue" element={<RevenuePage />} />
                <Route path="/crm" element={<CRMPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </MobileLayout>
          ) : (
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          )}

          {/* Toast Notifications */}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#fff',
                borderRadius: '12px',
                padding: '16px',
                maxWidth: '90vw',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
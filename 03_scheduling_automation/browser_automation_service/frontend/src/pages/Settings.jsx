import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Smartphone,
  Moon,
  Download,
  LogOut,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);

  const handleLogout = () => {
    toast.success('Logged out successfully');
    // In real implementation, clear auth tokens and redirect
  };

  const handleExportData = () => {
    toast.success('Data export started');
    // In real implementation, trigger data export
  };

  const SettingSection = ({ title, children }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6 space-y-4"
    >
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {children}
    </motion.div>
  );

  const SettingItem = ({ icon: Icon, title, subtitle, children, onClick }) => (
    <div 
      className={`flex items-center justify-between py-3 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gray-100 rounded-lg">
          <Icon size={20} className="text-gray-600" />
        </div>
        <div>
          <div className="font-medium text-gray-900">{title}</div>
          {subtitle && (
            <div className="text-sm text-gray-500">{subtitle}</div>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {children}
        {onClick && <ChevronRight size={20} className="text-gray-400" />}
      </div>
    </div>
  );

  const Toggle = ({ enabled, onChange }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-primary-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your OFEM preferences</p>
        </div>
        <SettingsIcon className="text-primary-600" size={24} />
      </div>

      {/* Profile Section */}
      <SettingSection title="Profile">
        <SettingItem
          icon={User}
          title="Account Information"
          subtitle="Update your profile details"
          onClick={() => toast.info('Profile settings coming soon')}
        />
      </SettingSection>

      {/* Notifications Section */}
      <SettingSection title="Notifications">
        <SettingItem
          icon={Bell}
          title="Push Notifications"
          subtitle="Receive alerts for important events"
        >
          <Toggle 
            enabled={notifications} 
            onChange={setNotifications}
          />
        </SettingItem>
      </SettingSection>

      {/* Appearance Section */}
      <SettingSection title="Appearance">
        <SettingItem
          icon={Moon}
          title="Dark Mode"
          subtitle="Switch to dark theme"
        >
          <Toggle 
            enabled={darkMode} 
            onChange={setDarkMode}
          />
        </SettingItem>
        
        <SettingItem
          icon={Smartphone}
          title="App Display"
          subtitle="Customize mobile experience"
          onClick={() => toast.info('Display settings coming soon')}
        />
      </SettingSection>

      {/* Security Section */}
      <SettingSection title="Security & Privacy">
        <SettingItem
          icon={Shield}
          title="Privacy Settings"
          subtitle="Control your data and privacy"
          onClick={() => toast.info('Privacy settings coming soon')}
        />
        
        <SettingItem
          icon={Download}
          title="Auto Backup"
          subtitle="Automatically backup your data"
        >
          <Toggle 
            enabled={autoBackup} 
            onChange={setAutoBackup}
          />
        </SettingItem>
      </SettingSection>

      {/* Data Section */}
      <SettingSection title="Data Management">
        <SettingItem
          icon={Download}
          title="Export Data"
          subtitle="Download your OFEM data"
          onClick={handleExportData}
        />
      </SettingSection>

      {/* Account Section */}
      <SettingSection title="Account">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 py-3 text-red-600 hover:text-red-700 transition-colors w-full text-left"
        >
          <div className="p-2 bg-red-100 rounded-lg">
            <LogOut size={20} />
          </div>
          <div>
            <div className="font-medium">Sign Out</div>
            <div className="text-sm text-red-500">Sign out of your account</div>
          </div>
        </button>
      </SettingSection>

      {/* App Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-6 text-gray-500"
      >
        <div className="text-sm">
          OFEM Mobile App v1.0.0
        </div>
        <div className="text-xs mt-1">
          OnlyFans Enterprise Management
        </div>
      </motion.div>
    </div>
  );
}
/**
 * OFEM Mobile App - Main Application Component
 * OnlyFans Enhancement Management Mobile Platform
 */

import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FlashMessage from 'react-native-flash-message';
import NetInfo from '@react-native-community/netinfo';

// Screens
import DashboardScreen from './src/screens/DashboardScreen';
import ContentScreen from './src/screens/ContentScreen';
import SchedulerScreen from './src/screens/SchedulerScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import RevenueScreen from './src/screens/RevenueScreen';
import CRMScreen from './src/screens/CRMScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ContentCreatorScreen from './src/screens/ContentCreatorScreen';
import CameraScreen from './src/screens/CameraScreen';
import LoginScreen from './src/screens/LoginScreen';

// Services
import { APIService } from './src/services/APIService';
import { NotificationService } from './src/services/NotificationService';
import { AuthService } from './src/services/AuthService';

// Store
import { useAppStore } from './src/store/AppStore';

// Types
export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  ContentCreator: undefined;
  Camera: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Content: undefined;
  Scheduler: undefined;
  Analytics: undefined;
  Revenue: undefined;
  CRM: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// Tab Navigator Component
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Content':
              iconName = 'photo-library';
              break;
            case 'Scheduler':
              iconName = 'schedule';
              break;
            case 'Analytics':
              iconName = 'analytics';
              break;
            case 'Revenue':
              iconName = 'monetization-on';
              break;
            case 'CRM':
              iconName = 'people';
              break;
            case 'Settings':
              iconName = 'settings';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF1493',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          height: Platform.OS === 'ios' ? 85 : 65,
        },
        headerStyle: {
          backgroundColor: '#FF1493',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Content" 
        component={ContentScreen}
        options={{ title: 'Content' }}
      />
      <Tab.Screen 
        name="Scheduler" 
        component={SchedulerScreen}
        options={{ title: 'Schedule' }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
      <Tab.Screen 
        name="Revenue" 
        component={RevenueScreen}
        options={{ title: 'Revenue' }}
      />
      <Tab.Screen 
        name="CRM" 
        component={CRMScreen}
        options={{ title: 'Subscribers' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

// Main App Component
const App: React.FC = () => {
  const { isAuthenticated, setNetworkStatus, initializeApp } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
    setupApp();
  }, []);

  const setupApp = async () => {
    try {
      // Initialize services
      await NotificationService.initialize();
      await APIService.initialize();
      
      // Setup network monitoring
      const unsubscribe = NetInfo.addEventListener(state => {
        setNetworkStatus(state.isConnected || false);
        
        if (!state.isConnected) {
          Alert.alert(
            'No Internet Connection',
            'Please check your internet connection and try again.',
            [{ text: 'OK' }]
          );
        }
      });

      // Setup deep linking
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink(initialUrl);
      }

      Linking.addEventListener('url', ({ url }) => {
        handleDeepLink(url);
      });

      setIsLoading(false);

      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up app:', error);
      setIsLoading(false);
    }
  };

  const handleDeepLink = (url: string) => {
    console.log('Deep link received:', url);
    // Handle deep link navigation here
    // Example: ofem://content/create, ofem://analytics
  };

  if (isLoading) {
    return null; // Show splash screen component here
  }

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#FF1493"
        translucent={false}
      />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          {isAuthenticated ? (
            <>
              <Stack.Screen name="Main" component={MainTabNavigator} />
              <Stack.Screen 
                name="ContentCreator" 
                component={ContentCreatorScreen}
                options={{
                  headerShown: true,
                  title: 'Create Content',
                  headerStyle: { backgroundColor: '#FF1493' },
                  headerTintColor: '#fff',
                }}
              />
              <Stack.Screen 
                name="Camera" 
                component={CameraScreen}
                options={{
                  headerShown: true,
                  title: 'Camera',
                  headerStyle: { backgroundColor: '#000' },
                  headerTintColor: '#fff',
                }}
              />
            </>
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <FlashMessage position="top" />
    </SafeAreaProvider>
  );
};

export default App;
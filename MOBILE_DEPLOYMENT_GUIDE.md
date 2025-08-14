# 📱 OFEM Mobile Apps Deployment Guide

## Overview
OFEM now includes comprehensive mobile solutions:
- **React Native App** - Native iOS/Android app with camera integration
- **Progressive Web App (PWA)** - Mobile-optimized web app with offline capabilities

---

## 🔧 **Prerequisites**

### For React Native App:
- Node.js 16+ and npm/yarn
- React Native CLI (`npm install -g react-native-cli`)
- **Android Development:**
  - Android Studio
  - Android SDK (API 21+)
  - Java Development Kit (JDK) 11
- **iOS Development (macOS only):**
  - Xcode 12+
  - iOS SDK
  - CocoaPods (`sudo gem install cocoapods`)

### For PWA:
- Node.js 16+ and npm/yarn
- Web server (nginx, Apache, or hosting platform)

---

## 🚀 **React Native App Deployment**

### **1. Environment Setup**

```bash
# Navigate to mobile app directory
cd /workspace/mobile_app

# Install dependencies
npm install

# iOS specific setup (macOS only)
cd ios && pod install && cd ..
```

### **2. Configuration**

Create `.env` file:
```env
# OFEM Backend URLs
OFEM_MASTER_URL=http://your-server.com:3000
OFEM_SCHEDULER_URL=http://your-server.com:3001
OFEM_CRM_URL=http://your-server.com:3002
OFEM_ANALYTICS_URL=http://your-server.com:3003
OFEM_CONTENT_URL=http://your-server.com:3004
OFEM_REVENUE_URL=http://your-server.com:3005

# OpenAI API (for content generation)
OPENAI_API_KEY=your_openai_api_key

# Optional: Push notification keys
FCM_SENDER_ID=your_fcm_sender_id
```

### **3. Android Deployment**

```bash
# Debug build
npm run android

# Release build
npm run build:android

# Generated APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

**Play Store Deployment:**
1. Sign the APK with your keystore
2. Upload to Google Play Console
3. Complete store listing with screenshots
4. Submit for review

### **4. iOS Deployment**

```bash
# Debug build
npm run ios

# Release build (Xcode required)
npm run build:ios
```

**App Store Deployment:**
1. Open `ios/OFEMMobile.xcworkspace` in Xcode
2. Configure signing & capabilities
3. Archive for distribution
4. Upload to App Store Connect
5. Complete app metadata and submit

---

## 🌐 **Progressive Web App (PWA) Deployment**

### **1. Build PWA**

```bash
# Navigate to PWA directory
cd /workspace/mobile_pwa

# Install dependencies
npm install

# Build for production
npm run build

# Preview build
npm run preview
```

### **2. PWA Configuration**

Create `.env.production`:
```env
# Production API URLs
VITE_API_BASE_URL=https://api.your-domain.com
VITE_MASTER_URL=https://api.your-domain.com:3000
VITE_SCHEDULER_URL=https://api.your-domain.com:3001
VITE_CRM_URL=https://api.your-domain.com:3002
VITE_ANALYTICS_URL=https://api.your-domain.com:3003
VITE_CONTENT_URL=https://api.your-domain.com:3004
VITE_REVENUE_URL=https://api.your-domain.com:3005

# Push notifications (optional)
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
```

### **3. Deploy PWA**

**Option A: Static Hosting (Recommended)**
```bash
# Deploy to Netlify
npm run deploy

# Or upload dist/ folder to:
# - Vercel
# - GitHub Pages  
# - Firebase Hosting
# - AWS S3 + CloudFront
```

**Option B: Server Deployment**
```bash
# Upload dist/ folder to your web server
scp -r dist/ user@server:/var/www/ofem-mobile/

# Configure nginx
sudo nano /etc/nginx/sites-available/ofem-mobile
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name mobile.your-domain.com;
    
    location / {
        root /var/www/ofem-mobile;
        try_files $uri $uri/ /index.html;
        
        # PWA headers
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # Service Worker
    location /sw.js {
        root /var/www/ofem-mobile;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    # Manifest
    location /manifest.json {
        root /var/www/ofem-mobile;
        add_header Content-Type "application/json";
    }
}
```

---

## 📱 **Mobile Features Configuration**

### **Camera Integration**
- **React Native**: Uses `react-native-image-picker` and `react-native-camera`
- **PWA**: Uses Web API `navigator.mediaDevices.getUserMedia()`

**Permissions needed:**
- Camera access
- Photo library access
- Storage write permissions

### **Push Notifications**
- **React Native**: Firebase Cloud Messaging (FCM)
- **PWA**: Web Push Protocol with VAPID keys

**Setup:**
1. Create Firebase project
2. Generate VAPID keys for PWA
3. Configure FCM for React Native
4. Update environment variables

### **Offline Support**
- **React Native**: AsyncStorage + offline queue
- **PWA**: Service Worker + IndexedDB caching

**Features:**
- Offline content creation
- Sync when online
- Cached analytics data
- Background updates

---

## 🔐 **Security Configuration**

### **API Security**
```typescript
// Add API authentication
const apiClient = axios.create({
  baseURL: process.env.OFEM_API_URL,
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'X-API-Key': process.env.OFEM_API_KEY,
  },
});
```

### **Content Security Policy (PWA)**
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  connect-src 'self' https://api.your-domain.com;
  img-src 'self' data: blob:;
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
">
```

---

## 📊 **Analytics & Monitoring**

### **Performance Monitoring**
```javascript
// Add to both apps
import { performance } from './utils/performance';

// Track app startup
performance.mark('app-start');

// Track navigation
performance.measure('navigation', 'nav-start', 'nav-end');
```

### **Error Tracking**
```javascript
// Sentry integration (optional)
import * as Sentry from '@sentry/react-native'; // or @sentry/react

Sentry.init({
  dsn: 'your-sentry-dsn',
});
```

### **Usage Analytics**
```javascript
// Google Analytics 4 (PWA)
import { gtag } from 'ga-gtag';

gtag('config', 'GA_TRACKING_ID');
gtag('event', 'content_created', {
  content_type: 'image',
  engagement_time: 120,
});
```

---

## 🧪 **Testing**

### **React Native Testing**
```bash
# Unit tests
npm test

# E2E testing with Detox
npm run e2e:ios
npm run e2e:android
```

### **PWA Testing**
```bash
# Unit tests
npm test

# PWA audit
npx lighthouse https://your-pwa-url --view

# Performance testing
npm run test:performance
```

---

## 🚀 **Quick Start Commands**

### **Development**
```bash
# Start backend services
cd /workspace && node ofem_master_orchestrator.js

# Start React Native app
cd mobile_app && npm run android

# Start PWA
cd mobile_pwa && npm run dev
```

### **Production**
```bash
# Build and deploy everything
./scripts/deploy-mobile.sh

# Or individual deployment:
cd mobile_app && npm run build:android
cd mobile_pwa && npm run build && npm run deploy
```

---

## 📋 **Mobile App Features**

### **✅ Completed Features**
- 📱 Native mobile apps (iOS/Android)
- 🌐 Progressive Web App with offline support
- 📸 Camera integration and photo capture
- 🤖 AI content generation on mobile
- 📊 Real-time analytics dashboard
- 💰 Revenue tracking and optimization
- 👥 Subscriber management (CRM)
- 📅 Content scheduling
- 🔔 Push notifications
- 📱 Touch-optimized UI/UX
- 🚀 App installation prompts
- 📴 Offline functionality
- 🔄 Background sync

### **🎯 Mobile-Specific Benefits**
- Create content anywhere with phone camera
- Instant notifications for new subscribers/revenue
- Quick responses to subscriber messages
- Mobile-optimized analytics charts
- Voice-to-text for captions
- Location-based content scheduling
- Biometric authentication
- Haptic feedback for interactions

---

## 🆘 **Troubleshooting**

### **Common Issues**

**React Native Build Errors:**
```bash
# Clear cache
npx react-native start --reset-cache

# Clean build
cd android && ./gradlew clean && cd ..
cd ios && xcodebuild clean && cd ..
```

**PWA Not Installing:**
- Check HTTPS requirement
- Verify manifest.json
- Ensure service worker is registered
- Check browser console for errors

**API Connection Issues:**
- Verify backend services are running
- Check network permissions
- Update API endpoints in .env
- Test with curl/Postman first

### **Performance Optimization**
- Enable Hermes (React Native)
- Optimize bundle size (PWA)
- Implement lazy loading
- Use image compression
- Cache API responses

---

## 🎉 **Success!**

Your OFEM mobile apps are now ready for deployment! Users can:

1. **Download native apps** from app stores
2. **Install PWA** directly from browsers  
3. **Create content** on-the-go with AI assistance
4. **Monitor performance** with real-time mobile analytics
5. **Manage subscribers** and revenue from anywhere

**Next Steps:**
- Submit apps to stores
- Configure push notifications
- Set up analytics tracking
- Monitor user feedback
- Plan feature updates

---

*For technical support, check the troubleshooting section or review individual component documentation.*
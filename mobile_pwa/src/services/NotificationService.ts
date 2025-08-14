/**
 * Mobile Notification Service
 * Handles push notifications, local notifications, and mobile-specific alerts
 */

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

class NotificationServiceClass {
  private registration: ServiceWorkerRegistration | null = null;
  private permission: NotificationPermission = 'default';

  async initialize(): Promise<void> {
    try {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        console.warn('Notifications not supported');
        return;
      }

      // Get current permission
      this.permission = Notification.permission;

      // Register service worker if available
      if ('serviceWorker' in navigator) {
        this.registration = await navigator.serviceWorker.ready;
        this.setupMessageHandlers();
      }

      console.log('✅ Notification Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Notification Service:', error);
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        return false;
      }

      if (this.permission === 'granted') {
        return true;
      }

      const permission = await Notification.requestPermission();
      this.permission = permission;

      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        
        // Subscribe to push notifications
        await this.subscribeToPush();
        
        // Show welcome notification
        this.showLocalNotification({
          title: 'OFEM Notifications Enabled',
          body: 'You\'ll now receive updates about your content and earnings',
          icon: '/pwa-192x192.png',
        });

        return true;
      } else {
        console.warn('❌ Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  private async subscribeToPush(): Promise<PushSubscription | null> {
    try {
      if (!this.registration) {
        console.warn('Service worker not available for push subscription');
        return null;
      }

      // Check if already subscribed
      const existingSubscription = await this.registration.pushManager.getSubscription();
      if (existingSubscription) {
        return existingSubscription;
      }

      // Create new subscription
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.VITE_VAPID_PUBLIC_KEY || 'YOUR_VAPID_PUBLIC_KEY'
        ),
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);

      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      // In a real app, send this to your backend
      console.log('Push subscription:', JSON.stringify(subscription));
      
      // Example API call:
      // await fetch('/api/notifications/subscribe', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(subscription),
      // });
    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
  }

  showLocalNotification(payload: NotificationPayload): void {
    if (this.permission !== 'granted') {
      console.warn('Notifications not permitted');
      return;
    }

    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/pwa-192x192.png',
      badge: payload.badge || '/badge-72x72.png',
      image: payload.image,
      data: payload.data,
      actions: payload.actions,
      requireInteraction: payload.requireInteraction || false,
      silent: payload.silent || false,
      vibrate: payload.vibrate || [200, 100, 200],
      tag: payload.data?.tag || 'ofem-notification',
    };

    if (this.registration) {
      // Use service worker for background notifications
      this.registration.showNotification(payload.title, options);
    } else {
      // Fallback to regular notification
      new Notification(payload.title, options);
    }
  }

  private setupMessageHandlers(): void {
    if (!this.registration) return;

    // Handle notification clicks
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        const { action, data } = event.data;
        this.handleNotificationAction(action, data);
      }
    });
  }

  private handleNotificationAction(action: string, data: any): void {
    switch (action) {
      case 'view_analytics':
        window.location.href = '/analytics';
        break;
      case 'create_content':
        window.location.href = '/content/create';
        break;
      case 'view_revenue':
        window.location.href = '/revenue';
        break;
      case 'check_subscribers':
        window.location.href = '/crm';
        break;
      default:
        window.location.href = '/dashboard';
    }
  }

  // Pre-defined notification templates
  showContentPublished(contentTitle: string): void {
    this.showLocalNotification({
      title: '📸 Content Published!',
      body: `"${contentTitle}" is now live`,
      icon: '/icons/content.png',
      actions: [
        { action: 'view_analytics', title: 'View Analytics' },
        { action: 'create_content', title: 'Create More' },
      ],
      data: { type: 'content_published', contentTitle },
      vibrate: [200, 100, 200, 100, 200],
    });
  }

  showNewSubscriber(subscriberName: string): void {
    this.showLocalNotification({
      title: '🎉 New Subscriber!',
      body: `${subscriberName} just subscribed`,
      icon: '/icons/subscriber.png',
      actions: [
        { action: 'check_subscribers', title: 'View Profile' },
        { action: 'create_content', title: 'Create Content' },
      ],
      data: { type: 'new_subscriber', subscriberName },
      vibrate: [100, 50, 100, 50, 300],
    });
  }

  showRevenueUpdate(amount: number, type: string): void {
    this.showLocalNotification({
      title: '💰 Revenue Update',
      body: `You earned $${amount.toFixed(2)} from ${type}`,
      icon: '/icons/revenue.png',
      actions: [
        { action: 'view_revenue', title: 'View Details' },
        { action: 'view_analytics', title: 'See Analytics' },
      ],
      data: { type: 'revenue_update', amount, revenueType: type },
      vibrate: [300, 100, 300],
    });
  }

  showScheduleReminder(postTitle: string, timeUntil: string): void {
    this.showLocalNotification({
      title: '⏰ Content Reminder',
      body: `"${postTitle}" scheduled in ${timeUntil}`,
      icon: '/icons/schedule.png',
      actions: [
        { action: 'create_content', title: 'Edit Content' },
        { action: 'view_analytics', title: 'View Schedule' },
      ],
      data: { type: 'schedule_reminder', postTitle },
      requireInteraction: true,
    });
  }

  showEngagementAlert(metric: string, value: number): void {
    this.showLocalNotification({
      title: '📈 Engagement Alert',
      body: `Your ${metric} increased by ${value}%`,
      icon: '/icons/analytics.png',
      actions: [
        { action: 'view_analytics', title: 'View Details' },
        { action: 'create_content', title: 'Capitalize' },
      ],
      data: { type: 'engagement_alert', metric, value },
    });
  }

  showGoalAchieved(goal: string, achievement: string): void {
    this.showLocalNotification({
      title: '🏆 Goal Achieved!',
      body: `${goal}: ${achievement}`,
      icon: '/icons/achievement.png',
      actions: [
        { action: 'view_analytics', title: 'Celebrate' },
        { action: 'view_revenue', title: 'See Earnings' },
      ],
      data: { type: 'goal_achieved', goal, achievement },
      vibrate: [100, 50, 100, 50, 100, 50, 300],
      requireInteraction: true,
    });
  }

  // Utility methods
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async clearAllNotifications(): Promise<void> {
    if (this.registration) {
      const notifications = await this.registration.getNotifications();
      notifications.forEach(notification => notification.close());
    }
  }

  async getNotificationCount(): Promise<number> {
    if (this.registration) {
      const notifications = await this.registration.getNotifications();
      return notifications.length;
    }
    return 0;
  }

  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }
}

export const NotificationService = new NotificationServiceClass();
import { Notification, NotificationStats } from '@/features/admin/models/NotificationModel';
import { notificationService } from '@/Services/notificationService';

class NotificationController {
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];

  constructor() {
    // Subscribe to real-time notifications
    notificationService.subscribeToNotifications((notifications) => {
      this.notifications = notifications;
      this.notifyListeners();
    });
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  // Subscribe to notifications updates
  subscribe(callback: (notifications: Notification[]) => void) {
    this.listeners.push(callback);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  getAllNotifications(): Notification[] {
    return this.notifications;
  }

  getNotificationById(id: string): Notification | undefined {
    return this.notifications.find(notification => notification.id === id);
  }

  getNotificationStats(): NotificationStats {
    return {
      totalNotifications: this.notifications.length,
      unreadNotifications: this.notifications.filter(n => !n.read).length,
      systemNotifications: this.notifications.filter(n => n.recipientId === 'all').length,
      userNotifications: this.notifications.filter(n => n.recipientId !== 'all' && n.recipientId !== 'admin').length
    };
  }

  async markAsRead(id: string): Promise<boolean> {
    try {
      await notificationService.markAsRead(id);
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(id: string): Promise<boolean> {
    try {
      await notificationService.deleteNotification(id);
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  async createNotification(notification: Omit<Notification, 'id' | 'createdDate'>): Promise<Notification | null> {
    try {
      const id = await notificationService.createNotification(notification);
      // The notification will be added via the real-time subscription
      return null; // Will be handled by subscription
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  getNotificationsByRecipient(recipientId: string): Notification[] {
    return this.notifications.filter(notification =>
      notification.recipientId === recipientId || notification.recipientId === 'all'
    );
  }

  getUnreadNotifications(): Notification[] {
    return this.notifications.filter(notification => !notification.read);
  }

  searchNotifications(query: string): Notification[] {
    const lowercaseQuery = query.toLowerCase();
    return this.notifications.filter(notification =>
      notification.message.toLowerCase().includes(lowercaseQuery) ||
      (notification.recipientName && notification.recipientName.toLowerCase().includes(lowercaseQuery))
    );
  }
}

export const notificationController = new NotificationController();
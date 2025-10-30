import { db, auth } from '@/firebaseConfig';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { Notification } from '@/features/admin/models/NotificationModel';

export class NotificationService {
  private notificationsCollection = collection(db, 'notifications');

  // Get all notifications for the current admin user
  async getNotifications(): Promise<Notification[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const q = query(
        this.notificationsCollection,
        where('recipientId', 'in', ['all', 'admin', currentUser.uid]),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const notifications: Notification[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          message: data.message,
          recipientId: data.recipientId,
          recipientName: data.recipientName,
          type: data.type,
          read: data.read || false,
          createdDate: data.createdAt?.toDate?.()?.toISOString()?.split('T')[0] || new Date().toISOString().split('T')[0],
          priority: data.priority || 'medium',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });

      return notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Get unread notifications count
  async getUnreadCount(): Promise<number> {
    try {
      const notifications = await this.getNotifications();
      return notifications.filter(notification => !notification.read).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(this.notificationsCollection, notificationId);
      await updateDoc(notificationRef, {
        read: true,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const unreadNotifications = notifications.filter(n => !n.read);

      const updatePromises = unreadNotifications.map(notification =>
        this.markAsRead(notification.id)
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Create a new notification
  async createNotification(notification: Omit<Notification, 'id' | 'createdDate' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(this.notificationsCollection, {
        ...notification,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Delete a notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(this.notificationsCollection, notificationId);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Subscribe to real-time notifications updates
  subscribeToNotifications(callback: (notifications: Notification[]) => void) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.debug('User not authenticated for notifications subscription - skipping');
      return () => {};
    }

    const q = query(
      this.notificationsCollection,
      where('recipientId', 'in', ['all', 'admin', currentUser.uid]),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notifications: Notification[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          message: data.message,
          recipientId: data.recipientId,
          recipientName: data.recipientName,
          type: data.type,
          read: data.read || false,
          createdDate: data.createdAt?.toDate?.()?.toISOString()?.split('T')[0] || new Date().toISOString().split('T')[0],
          priority: data.priority || 'medium',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });
      callback(notifications);
    });

    return unsubscribe;
  }
}

export const notificationService = new NotificationService();
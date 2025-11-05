import { Timestamp } from 'firebase/firestore';

export interface Notification {
  id: string;
  message: string;
  recipientId: string | 'all'; // 'all' for system-wide notifications or specific user ID
  recipientName?: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdDate: string;
  priority: 'low' | 'medium' | 'high';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface NotificationStats {
  totalNotifications: number;
  unreadNotifications: number;
  systemNotifications: number;
  userNotifications: number;
}
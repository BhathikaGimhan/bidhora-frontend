export interface Notification {
  id: string;
  message: string;
  recipientId: string | 'all'; // 'all' for system-wide notifications
  recipientName?: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdDate: string;
  priority: 'low' | 'medium' | 'high';
}

export interface NotificationStats {
  totalNotifications: number;
  unreadNotifications: number;
  systemNotifications: number;
  userNotifications: number;
}
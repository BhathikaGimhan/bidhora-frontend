import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Check, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { notificationService } from '@/Services/notificationService';
import { Notification } from '@/features/admin/models/NotificationModel';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export function EmployeeNotificationsView() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
    
    // Subscribe to real-time updates
    const unsubscribe = notificationService.subscribeToNotifications((notifs) => {
      setNotifications(notifs);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const notifs = await notificationService.getNotifications();
      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      toast({
        title: 'Success',
        description: 'Notification marked as read',
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notification',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notifications',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      toast({
        title: 'Success',
        description: 'Notification deleted',
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'default';
      case 'warning':
        return 'outline';
      case 'error':
        return 'destructive';
      case 'info':
      default:
        return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300';
    }
  };

  const getTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return date;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with important messages from administrators
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline">
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Bell className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{unreadCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Read</CardTitle>
            <CheckCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {notifications.length - unreadCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
              <p className="text-muted-foreground text-center">
                You'll see notifications from administrators here
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all ${getTypeStyles(notification.type)} ${
                !notification.read ? 'border-l-4' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getTypeColor(notification.type)}>
                        {notification.type}
                      </Badge>
                      <Badge className={getPriorityColor(notification.priority)}>
                        {notification.priority} priority
                      </Badge>
                      {!notification.read && (
                        <Badge variant="destructive" className="animate-pulse">
                          New
                        </Badge>
                      )}
                      {notification.recipientId === 'all' && (
                        <Badge variant="outline">Broadcast</Badge>
                      )}
                    </div>
                    <p className={`text-base ${!notification.read ? 'font-semibold' : ''}`}>
                      {notification.message}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getTimeAgo(notification.createdDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(notification.id)}
                      className="text-destructive hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

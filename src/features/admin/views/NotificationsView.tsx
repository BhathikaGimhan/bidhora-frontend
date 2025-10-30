import { useState } from 'react';
import { DataTable } from '@/features/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Check, Trash2, Send } from 'lucide-react';
import { notificationController } from '@/features/admin/controllers/notificationController';
import { Notification } from '@/features/admin/models/NotificationModel';
import { useToast } from '@/hooks/use-toast';

export function NotificationsView() {
  const [notifications, setNotifications] = useState(notificationController.getAllNotifications());
  const [newNotification, setNewNotification] = useState({
    message: '',
    recipientId: 'all',
    type: 'info' as const,
    priority: 'medium' as const,
  });
  const { toast } = useToast();

  const handleSearch = (query: string) => {
    if (query.trim() === '') {
      setNotifications(notificationController.getAllNotifications());
    } else {
      setNotifications(notificationController.searchNotifications(query));
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    const success = notificationController.markAsRead(notificationId);
    if (success) {
      setNotifications(notificationController.getAllNotifications());
      toast({
        title: 'Notification Updated',
        description: 'Notification marked as read',
      });
    }
  };

  const handleDeleteNotification = (notificationId: string) => {
    const success = notificationController.deleteNotification(notificationId);
    if (success) {
      setNotifications(notificationController.getAllNotifications());
      toast({
        title: 'Notification Deleted',
        description: 'Notification has been permanently deleted',
        variant: 'destructive',
      });
    }
  };

  const handleSendNotification = () => {
    if (!newNotification.message.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message',
        variant: 'destructive',
      });
      return;
    }

    const notification = notificationController.createNotification({
      ...newNotification,
      read: false,
    });

    setNotifications(notificationController.getAllNotifications());
    setNewNotification({
      message: '',
      recipientId: 'all',
      type: 'info',
      priority: 'medium',
    });

    toast({
      title: 'Notification Sent',
      description: 'Notification has been sent successfully',
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'default';
      case 'warning':
        return 'destructive';
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
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const columns = [
    {
      key: 'message',
      title: 'Message',
      sortable: false,
      render: (value: string, notification: Notification) => (
        <div className={`${!notification.read ? 'font-medium' : ''}`}>
          <div className="max-w-md truncate" title={value}>
            {value}
          </div>
          {notification.recipientName && (
            <div className="text-sm text-muted-foreground">
              To: {notification.recipientName}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'recipientId',
      title: 'Recipient',
      sortable: true,
      render: (value: string) => (
        <Badge variant="outline">
          {value === 'all' ? 'All Users' : value === 'admin' ? 'Admin' : 'User'}
        </Badge>
      ),
    },
    {
      key: 'type',
      title: 'Type',
      sortable: true,
      render: (value: string) => (
        <Badge variant={getTypeColor(value)}>
          {value}
        </Badge>
      ),
    },
    {
      key: 'priority',
      title: 'Priority',
      sortable: true,
      render: (value: string) => (
        <Badge className={getPriorityColor(value)}>
          {value}
        </Badge>
      ),
    },
    {
      key: 'read',
      title: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Read' : 'Unread'}
        </Badge>
      ),
    },
    {
      key: 'createdDate',
      title: 'Date',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  const actions = (notification: Notification) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => console.log('View notification', notification.id)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        {!notification.read && (
          <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id)}>
            <Check className="mr-2 h-4 w-4" />
            Mark as Read
          </DropdownMenuItem>
        )}
        <DropdownMenuItem 
          onClick={() => handleDeleteNotification(notification.id)}
          className="text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      {/* Send New Notification */}
      <Card>
        <CardHeader>
          <CardTitle>Send New Notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient</Label>
              <Select
                value={newNotification.recipientId}
                onValueChange={(value) => setNewNotification(prev => ({ ...prev, recipientId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="admin">Admin Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={newNotification.type}
                onValueChange={(value: any) => setNewNotification(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={newNotification.priority}
                onValueChange={(value: any) => setNewNotification(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter notification message..."
              value={newNotification.message}
              onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
              rows={3}
            />
          </div>
          <Button onClick={handleSendNotification} className="w-full md:w-auto">
            <Send className="mr-2 h-4 w-4" />
            Send Notification
          </Button>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <DataTable
        title="Notifications Management"
        data={notifications}
        columns={columns}
        searchPlaceholder="Search notifications by message or recipient..."
        onSearch={handleSearch}
        actions={actions}
      />
    </div>
  );
}
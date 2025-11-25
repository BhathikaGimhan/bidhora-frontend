import { useState, useEffect } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { MoreHorizontal, Eye, Check, Trash2, Send, Loader2 } from 'lucide-react';
import { Notification } from '@/features/admin/models/NotificationModel';
import { useToast } from '@/hooks/use-toast';
import { adminActivityService } from '@/Services/adminActivityService';
import { notificationService } from '@/Services/notificationService';
import { userController } from '@/features/admin/controllers/userController';

export function NotificationsView() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newNotification, setNewNotification] = useState<{
    message: string;
    recipientId: string;
    type: 'info' | 'success' | 'warning' | 'error';
    priority: 'low' | 'medium' | 'high';
  }>({
    message: '',
    recipientId: 'all',
    type: 'info',
    priority: 'medium',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    
    // Subscribe to real-time notifications updates
    const unsubscribeNotifications = notificationService.subscribeToAdminNotifications((notifs) => {
      setNotifications(notifs);
    });
    
    return () => {
      unsubscribeNotifications();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load notifications
      const notifs = await notificationService.getAdminNotifications();
      setNotifications(notifs);

      // Load employees
      const users = await userController.getAllUsers();
      const employeeUsers = users
        .filter(user => user.role === 'employee')
        .map(user => ({
          id: user.id,
          name: user.name,
          email: user.email
        }));
      setEmployees(employeeUsers);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    if (query.trim() === '') {
      loadData();
    } else {
      const filtered = notifications.filter(n => 
        n.message.toLowerCase().includes(query.toLowerCase()) ||
        n.recipientName?.toLowerCase().includes(query.toLowerCase())
      );
      setNotifications(filtered);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      await loadData();
      toast({
        title: 'Notification Updated',
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

  const handleDeleteNotification = async (notificationId: string) => {
    const notificationToDelete = notifications.find(n => n.id === notificationId);
    try {
      await notificationService.deleteNotification(notificationId);
      
      // Log activity
      if (notificationToDelete) {
        await adminActivityService.logNotificationAction(
          'Deleted Notification',
          notificationId,
          `Deleted ${notificationToDelete.type} notification`
        );
      }
      
      await loadData();
      toast({
        title: 'Notification Deleted',
        description: 'Notification has been permanently deleted',
        variant: 'destructive',
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

  const handleSendNotification = async () => {
    if (!newNotification.message.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      // Get recipient name if specific employee
      let recipientName = 'All Employees';
      if (newNotification.recipientId !== 'all') {
        const employee = employees.find(e => e.id === newNotification.recipientId);
        recipientName = employee?.name || 'Unknown';
      }

      const notificationId = await notificationService.createNotification({
        ...newNotification,
        recipientName,
        read: false,
      });

      // Log activity
      const recipientText = newNotification.recipientId === 'all' ? 'all employees' : `employee ${recipientName}`;
      await adminActivityService.logNotificationAction(
        'Sent Notification',
        notificationId,
        `Sent ${newNotification.type} notification to ${recipientText}: "${newNotification.message.substring(0, 50)}${newNotification.message.length > 50 ? '...' : ''}"`
      );

      await loadData();
      setNewNotification({
        message: '',
        recipientId: 'all',
        type: 'info',
        priority: 'medium',
      });

      toast({
        title: 'Notification Sent',
        description: `Notification sent successfully to ${recipientText}`,
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to send notification',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
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
        <DropdownMenuItem onClick={() => {
          setSelectedNotification(notification);
          setIsDialogOpen(true);
        }}>
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
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Loading employees..." : "Select recipient"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {!loading && employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} ({employee.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={newNotification.type}
                onValueChange={(value: 'info' | 'success' | 'warning' | 'error') => setNewNotification(prev => ({ ...prev, type: value }))}
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
                onValueChange={(value: 'low' | 'medium' | 'high') => setNewNotification(prev => ({ ...prev, priority: value }))}
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
          <Button onClick={handleSendNotification} className="w-full md:w-auto" disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Notification
              </>
            )}
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

      {/* Notification Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-semibold">Notification Details</DialogTitle>
            <DialogDescription className="text-base">
              View complete notification information
            </DialogDescription>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-6 pt-4">
              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</Label>
                  <div>
                    <Badge variant={getTypeColor(selectedNotification.type)} className="px-3 py-1 text-sm rounded-md">
                      {selectedNotification.type.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Priority</Label>
                  <div>
                    <Badge className={getPriorityColor(selectedNotification.priority) + " px-3 py-1 text-sm rounded-md"}>
                      {selectedNotification.priority.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</Label>
                  <div>
                    <Badge 
                      variant={selectedNotification.read ? 'default' : 'secondary'} 
                      className="px-3 py-1 text-sm rounded-md"
                    >
                      {selectedNotification.read ? 'READ' : 'UNREAD'}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recipient</Label>
                  <p className="text-sm font-medium">
                    {selectedNotification.recipientId === 'all' 
                      ? 'All Users' 
                      : selectedNotification.recipientName || 'User'}
                  </p>
                </div>
              </div>
              
              {/* Message Section */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Message</Label>
                <div className="mt-2 p-4 bg-muted/50 border border-border rounded-md">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedNotification.message}</p>
                </div>
              </div>
              
              {/* Dates Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Created Date</Label>
                  <p className="text-sm font-medium">
                    {new Date(selectedNotification.createdDate).toLocaleString()}
                  </p>
                </div>
                {selectedNotification.read && selectedNotification.readDate && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Read Date</Label>
                    <p className="text-sm font-medium">
                      {new Date(selectedNotification.readDate).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-6 border-t">
                {!selectedNotification.read && (
                  <Button 
                    onClick={() => {
                      handleMarkAsRead(selectedNotification.id);
                      setIsDialogOpen(false);
                    }}
                    variant="outline"
                    className="rounded-md"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Mark as Read
                  </Button>
                )}
                <Button 
                  onClick={() => {
                    handleDeleteNotification(selectedNotification.id);
                    setIsDialogOpen(false);
                  }}
                  variant="destructive"
                  className="rounded-md"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Notification
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
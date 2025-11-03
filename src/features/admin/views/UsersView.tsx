import { useState, useEffect } from 'react';
import { DataTable } from '@/features/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Ban, Trash2, CheckCircle, AlertCircle, UserCog, RefreshCw } from 'lucide-react';
import { User } from '@/features/admin/models/UserModel';
import { useToast } from '@/hooks/use-toast';
import { getAllUsers, banUser, unbanUser, deleteUser, updateUserRole } from '@/Services/authService';
import  LoadingSpinner  from '@/components/ui/loading-spinner';
import { auth } from '@/firebaseConfig';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type ActionType = 'ban' | 'unban' | 'delete' | null;

export function UsersView() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [authError, setAuthError] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setAuthError(false);
      
      // Wait a bit for auth to initialize if needed
      const user = auth.currentUser;
      if (!user) {
        // Wait a moment for auth to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        const retryUser = auth.currentUser;
        if (!retryUser) {
          setAuthError(true);
          setLoading(false);
          return;
        }
      }
      
      const response = await getAllUsers();
      setUsers(response.users);
      setFilteredUsers(response.users);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
      
      if (errorMessage.includes('No authenticated user')) {
        setAuthError(true);
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    toast({
      title: 'Refreshed',
      description: 'Users list updated successfully',
    });
  };

  useEffect(() => {
    // Wait for auth to initialize
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchUsers();
      } else {
        setAuthError(true);
        setLoading(false);
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (query: string) => {
    if (query.trim() === '') {
      setFilteredUsers(users);
    } else {
      const lowercaseQuery = query.toLowerCase();
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(lowercaseQuery) ||
        user.email.toLowerCase().includes(lowercaseQuery) ||
        user.role.toLowerCase().includes(lowercaseQuery)
      );
      setFilteredUsers(filtered);
    }
  };

  const openConfirmDialog = (user: User, action: ActionType) => {
    setSelectedUser(user);
    setActionType(action);
  };

  const closeConfirmDialog = () => {
    setSelectedUser(null);
    setActionType(null);
  };

  const handleChangeRole = async (user: User, newRole: 'buyer' | 'employee' | 'admin') => {
    try {
      setActionLoading(true);
      await updateUserRole({ role: newRole, targetUserId: user.uid });
      toast({
        title: 'Role Updated',
        description: `${user.name}'s role has been changed to ${newRole}`,
      });
      await fetchUsers(); // Refresh the data
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user role',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedUser || !actionType) return;

    setActionLoading(true);
    try {
      switch (actionType) {
        case 'ban':
          await banUser(selectedUser.id);
          toast({
            title: 'User Banned',
            description: `${selectedUser.name} has been banned from the platform`,
            variant: 'destructive',
          });
          break;
        case 'unban':
          await unbanUser(selectedUser.id);
          toast({
            title: 'User Unbanned',
            description: `${selectedUser.name} has been unbanned and can access the platform`,
          });
          break;
        case 'delete':
          await deleteUser(selectedUser.id);
          toast({
            title: 'User Deleted',
            description: `${selectedUser.name} has been permanently deleted`,
            variant: 'destructive',
          });
          break;
      }
      await fetchUsers(); // Refresh the data
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${actionType} user`,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
      closeConfirmDialog();
    }
  };

  const getDialogContent = () => {
    if (!selectedUser) return { title: '', description: '' };

    switch (actionType) {
      case 'ban':
        return {
          title: 'Ban User',
          description: `Are you sure you want to ban ${selectedUser.name}? This will prevent them from accessing the platform. You can unban them later if needed.`,
        };
      case 'unban':
        return {
          title: 'Unban User',
          description: `Are you sure you want to unban ${selectedUser.name}? They will regain access to the platform immediately.`,
        };
      case 'delete':
        return {
          title: 'Delete User',
          description: `Are you sure you want to permanently delete ${selectedUser.name}? This action cannot be undone. All their data will be permanently removed from the system.`,
        };
      default:
        return { title: '', description: '' };
    }
  };

  const columns = [
    {
      key: 'name',
      title: 'User',
      sortable: true,
      render: (value: string, user: User) => (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      title: 'Role',
      sortable: true,
      render: (value: string) => (
        <Badge 
          variant={
            value === 'admin' ? 'default' : 
            value === 'employee' ? 'outline' : 
            'secondary'
          }
          className={
            value === 'employee' 
              ? 'bg-blue-50 text-blue-700 border-blue-200' 
              : ''
          }
        >
          {value}
        </Badge>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value: string) => (
        <Badge 
          variant={value === 'active' ? 'default' : value === 'banned' ? 'destructive' : 'secondary'}
        >
          {value}
        </Badge>
      ),
    },
    {
      key: 'totalProjects',
      title: 'Projects',
      sortable: true,
    },
    {
      key: 'totalEarnings',
      title: 'Earnings (LKR)',
      sortable: true,
      render: (value: number) => `LKR ${value.toLocaleString()}`,
    },
    {
      key: 'rating',
      title: 'Rating',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center space-x-1">
          <span>{value.toFixed(1)}</span>
          <span className="text-yellow-500">★</span>
        </div>
      ),
    },
    {
      key: 'joinedDate',
      title: 'Joined',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  const actions = (user: User) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Change Role Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <UserCog className="mr-2 h-4 w-4" />
            Change Role
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              onClick={() => handleChangeRole(user, 'buyer')}
              disabled={user.role === 'buyer' || actionLoading}
            >
              Set as Buyer
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleChangeRole(user, 'employee')}
              disabled={user.role === 'employee' || actionLoading}
            >
              Set as Employee
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleChangeRole(user, 'admin')}
              disabled={user.role === 'admin' || actionLoading}
            >
              Set as Admin
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {user.status === 'active' ? (
          <DropdownMenuItem 
            onClick={() => openConfirmDialog(user, 'ban')}
            className="text-orange-600 focus:text-orange-600"
          >
            <Ban className="mr-2 h-4 w-4" />
            Ban User
          </DropdownMenuItem>
        ) : user.status === 'banned' ? (
          <DropdownMenuItem 
            onClick={() => openConfirmDialog(user, 'unban')}
            className="text-green-600 focus:text-green-600"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Unban User
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => openConfirmDialog(user, 'delete')}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const dialogContent = getDialogContent();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            You need to be logged in as an admin to access this page. Please log in and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Users Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage user accounts, roles, and permissions
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        
        <DataTable
          title=""
          data={filteredUsers}
          columns={columns}
          searchPlaceholder="Search users by name, email, or role..."
          onSearch={handleSearch}
          actions={actions}
        />
      </div>

      <AlertDialog open={!!selectedUser && !!actionType} onOpenChange={closeConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogContent.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={actionLoading}
              className={
                actionType === 'delete' || actionType === 'ban'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
            >
              {actionLoading ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
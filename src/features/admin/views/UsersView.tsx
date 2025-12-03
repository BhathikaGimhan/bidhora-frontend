import { useState, useEffect, useCallback } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MoreHorizontal, Ban, Trash2, CheckCircle, AlertCircle, UserCog, RefreshCw, Briefcase, Check, ChevronsUpDown } from 'lucide-react';
import { User } from '@/features/admin/models/UserModel';
import { useToast } from '@/hooks/use-toast';
import { getAllUsers, banUser, unbanUser, deleteUser, updateUserRole, updateUserDesignation } from '@/Services/authService';
import  LoadingSpinner  from '@/components/ui/loading-spinner';
import { auth } from '@/firebaseConfig';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { adminActivityService } from '@/Services/adminActivityService';
import { EMPLOYEE_DESIGNATIONS } from '@/constants/employeeDesignations';
import { cn } from '@/lib/utils';

type ActionType = 'ban' | 'unban' | 'delete' | null;

export function UsersView() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [authError, setAuthError] = useState(false);
  const [designationDialogOpen, setDesignationDialogOpen] = useState(false);
  const [selectedDesignation, setSelectedDesignation] = useState<string>('');
  const [designationPopoverOpen, setDesignationPopoverOpen] = useState(false);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
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
  }, [toast]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    toast({
      title: 'Refreshed',
      description: 'Users list updated successfully',
    });
  };

  const applyFilters = useCallback(() => {
    let filtered = users;

    // Apply role filter
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(lowercaseQuery) ||
        user.email.toLowerCase().includes(lowercaseQuery) ||
        user.role.toLowerCase().includes(lowercaseQuery)
      );
    }

    setFilteredUsers(filtered);
  }, [users, selectedRole, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleRoleFilter = (role: string) => {
    setSelectedRole(role);
  };

  useEffect(() => {
    applyFilters();
  }, [users, selectedRole, searchQuery, applyFilters]);

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
  }, [fetchUsers]);

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
      
      // Log activity
      await adminActivityService.logUserAction(
        'Changed User Role',
        user.uid,
        user.name,
        `Changed ${user.name}'s role from ${user.role} to ${newRole}`
      );
      
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

  const openDesignationDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedDesignation(user.designation || '');
    setDesignationDialogOpen(true);
  };

  const handleUpdateDesignation = async () => {
    if (!selectedUser || !selectedDesignation) {
      toast({
        title: 'Error',
        description: 'Please select a designation',
        variant: 'destructive',
      });
      return;
    }

    try {
      setActionLoading(true);
      await updateUserDesignation({ 
        designation: selectedDesignation, 
        targetUserId: selectedUser.uid || selectedUser.id 
      });
      
      // Log activity
      await adminActivityService.logUserAction(
        'Updated Employee Designation',
        selectedUser.uid || selectedUser.id,
        selectedUser.name,
        `Set ${selectedUser.name}'s designation to ${selectedDesignation}`
      );
      
      toast({
        title: 'Designation Updated',
        description: `${selectedUser.name}'s designation has been set to ${selectedDesignation}`,
      });
      
      setDesignationDialogOpen(false);
      setSelectedUser(null);
      setSelectedDesignation('');
      await fetchUsers(); // Refresh the data
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update designation',
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
          
          // Log activity
          await adminActivityService.logUserAction(
            'Banned User',
            selectedUser.uid,
            selectedUser.name,
            `Banned user ${selectedUser.name} (${selectedUser.email}) from the platform`
          );
          
          toast({
            title: 'User Banned',
            description: `${selectedUser.name} has been banned from the platform`,
            variant: 'destructive',
          });
          break;
        case 'unban':
          await unbanUser(selectedUser.id);
          
          // Log activity
          await adminActivityService.logUserAction(
            'Unbanned User',
            selectedUser.uid,
            selectedUser.name,
            `Unbanned user ${selectedUser.name} (${selectedUser.email}), restored platform access`
          );
          
          toast({
            title: 'User Unbanned',
            description: `${selectedUser.name} has been unbanned and can access the platform`,
          });
          break;
        case 'delete':
          await deleteUser(selectedUser.id);
          
          // Log activity
          await adminActivityService.logUserAction(
            'Deleted User',
            selectedUser.uid,
            selectedUser.name,
            `Permanently deleted user ${selectedUser.name} (${selectedUser.email}) from the system`
          );
          
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
      render: (value: string, user: User) => (
        <div className="space-y-1">
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
          {value === 'employee' && user.designation && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {user.designation}
            </div>
          )}
        </div>
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

        {/* Set Designation for Employees */}
        {user.role === 'employee' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => openDesignationDialog(user)}
              disabled={actionLoading}
            >
              <Briefcase className="mr-2 h-4 w-4" />
              {user.designation ? 'Change Designation' : 'Set Designation'}
            </DropdownMenuItem>
          </>
        )}

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

        {/* Role Filter */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-medium">Filter by Role:</span>
          <div className="flex gap-1">
            <Button
              variant={selectedRole === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRoleFilter('all')}
            >
              All
            </Button>
            <Button
              variant={selectedRole === 'buyer' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRoleFilter('buyer')}
            >
              Buyer
            </Button>
            <Button
              variant={selectedRole === 'employee' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRoleFilter('employee')}
            >
              Employee
            </Button>
            <Button
              variant={selectedRole === 'admin' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRoleFilter('admin')}
            >
              Admin
            </Button>
          </div>
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

      {/* Designation Dialog */}
      <Dialog open={designationDialogOpen} onOpenChange={setDesignationDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Set Employee Designation</DialogTitle>
            <DialogDescription>
              Choose a job designation for {selectedUser?.name}. This will help identify their area of expertise.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Popover open={designationPopoverOpen} onOpenChange={setDesignationPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={designationPopoverOpen}
                  className="w-full justify-between"
                >
                  {selectedDesignation || "Select designation..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[--radix-popover-trigger-width] p-0" 
                align="start"
                side="bottom"
                sideOffset={4}
                collisionPadding={10}
                onWheel={(e) => {
                  e.stopPropagation();
                }}
              >
                <Command>
                  <CommandInput placeholder="Search designations..." />
                  <CommandEmpty>No designation found.</CommandEmpty>
                  <CommandList 
                    className="max-h-[40vh] overflow-y-auto"
                    onWheel={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    {EMPLOYEE_DESIGNATIONS.map((designationGroup) => (
                      <CommandGroup 
                        key={designationGroup.category} 
                        heading={designationGroup.category}
                        className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-primary"
                      >
                        {designationGroup.levels.map((level) => (
                          <CommandItem
                            key={level}
                            value={level}
                            onSelect={(currentValue) => {
                              setSelectedDesignation(currentValue === selectedDesignation ? '' : level);
                              setDesignationPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedDesignation === level ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {level}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDesignationDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateDesignation}
              disabled={actionLoading || !selectedDesignation}
            >
              {actionLoading ? 'Updating...' : 'Update Designation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
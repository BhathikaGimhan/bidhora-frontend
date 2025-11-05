import { useState, useEffect } from 'react';
import { Bell, User as UserIcon, LogOut, Settings, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import ThemeToggle from '@/layouts/ThemeToggle';
import { auth } from '@/firebaseConfig';
import { userProfileService } from '@/Services/userProfileService';
import { UserProfile } from '@/features/profile/types/profile';
import { User } from 'firebase/auth';
import { notificationService } from '@/Services/notificationService';

interface TopbarProps {
  onMobileMenuToggle: () => void;
}

export function EmployeeTopbar({ onMobileMenuToggle }: TopbarProps) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let unsubscribeNotifications: (() => void) | null = null;

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Fetch user profile from database
          const profileResponse = await userProfileService.getProfile();
          setUserProfile(profileResponse.user);
          
          // Subscribe to real-time notifications updates
          unsubscribeNotifications = notificationService.subscribeToNotifications((notifs) => {
            const unread = notifs.filter(n => !n.read).length;
            setUnreadCount(unread);
          });
        } catch (error) {
          console.error('Error fetching employee profile:', error);
          // Fallback to basic user info if profile fetch fails
          setUserProfile({
            uid: user.uid,
            name: user.displayName || '',
            email: user.email || '',
            displayName: user.displayName || '',
            profileUrl: user.photoURL || '',
            photoURL: user.photoURL || '',
            role: 'employee'
          } as UserProfile);
        }
      } else {
        // User logged out, cleanup notifications subscription
        if (unsubscribeNotifications) {
          unsubscribeNotifications();
          unsubscribeNotifications = null;
        }
        setUnreadCount(0);
      }
      
      setLoading(false);
    });
    
    return () => {
      unsubscribe();
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
      }
    };
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getUserInitials = () => {
    if (userProfile?.displayName) {
      return userProfile.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return userProfile?.email?.charAt(0).toUpperCase() || 'E';
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card/80 backdrop-blur-sm px-4 sm:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMobileMenuToggle}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page title or breadcrumb */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-foreground hidden sm:block">
          Employee Dashboard
        </h1>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => navigate('/employee/notifications')}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={userProfile?.photoURL || currentUser?.photoURL || undefined}
                  alt={userProfile?.displayName || 'Employee'}
                />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {userProfile?.displayName || currentUser?.displayName || 'Employee'}
                </p>
                <p className="text-xs leading-none text-muted-foreground line-clamp-1">
                  {userProfile?.email || currentUser?.email || 'employee@bidhora.com'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(`/profile/${currentUser?.uid}`)}>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/employee/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

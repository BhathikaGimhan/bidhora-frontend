import { useState, useEffect } from 'react';
import { LogOut, Menu, ArrowLeft } from 'lucide-react';
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
import ThemeToggle from '@/layouts/ThemeToggle';
import { auth } from '@/firebaseConfig';
import { userProfileService } from '@/Services/userProfileService';
import { UserProfile } from '@/features/profile/types/profile';
import { User } from 'firebase/auth';

interface TopbarProps {
  onMobileMenuToggle: () => void;
}

export function AdminTopbar({ onMobileMenuToggle }: TopbarProps) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Fetch user profile from database
          const profileResponse = await userProfileService.getProfile();
          setUserProfile(profileResponse.user);
        } catch (error) {
          console.error('Error fetching admin profile:', error);
          // Fallback to basic user info if profile fetch fails
          setUserProfile({
            uid: user.uid,
            name: user.displayName || '',
            email: user.email || '',
            displayName: user.displayName || '',
            profileUrl: user.photoURL || '',
            photoURL: user.photoURL || '',
            role: 'admin'
          } as UserProfile);
        }
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleBackToProfile = () => {
    if (currentUser) {
      navigate(`/profile/${currentUser.uid}`);
    }
  };

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 h-full">
        {/* Left side - Mobile menu button and title */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileMenuToggle}
            className="lg:hidden h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">
            <span className="hidden sm:inline">Admin Panel</span>
            <span className="sm:hidden">Admin</span>
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                  <AvatarImage 
                    src={userProfile?.photoURL || userProfile?.profileUrl || currentUser?.photoURL} 
                    alt={userProfile?.displayName || currentUser?.displayName || "Admin"} 
                  />
                  <AvatarFallback className="text-xs sm:text-sm">
                    {userProfile?.displayName?.charAt(0)?.toUpperCase() || 
                     currentUser?.displayName?.charAt(0)?.toUpperCase() || 
                     currentUser?.email?.charAt(0)?.toUpperCase() || 
                     'A'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {userProfile?.displayName || currentUser?.displayName || 'Admin User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userProfile?.email || currentUser?.email || 'admin@bidhora.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleBackToProfile}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span>Back to Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
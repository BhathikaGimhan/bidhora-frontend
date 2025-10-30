import { useEffect, useState } from 'react';
import { getUserProfile, logout, isAuthenticated } from '@/Services/authService';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface UserProfile {
  message: string;
  user: {
    username: string;
  };
}

const Dashboard = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      toast({
        title: 'Unauthorized',
        description: 'Please log in to access the dashboard.',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    const fetchProfile = async () => {
      try {
        const data = await getUserProfile();
        setProfile(data);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    logout();
    toast({
      title: 'Logged Out',
      description: 'You have been logged out successfully.',
    });
    navigate('/');
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Welcome, {profile.user.username}!</h1>
        <p>{profile.message}</p>
        <Button onClick={handleLogout} variant="destructive">
          Log Out
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
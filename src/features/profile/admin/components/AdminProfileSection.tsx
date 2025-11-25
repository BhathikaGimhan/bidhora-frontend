import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  User,
  Calendar,
  Loader2,
  Users,
  FileText,
  MessageCircle,
  Bell,
  CreditCard,
  Settings,
  HelpCircle,
} from "lucide-react";
import { UserProfile } from "../../types/profile";
import { useState, useEffect } from "react";
import { adminActivityService, AdminActivity } from "@/Services/adminActivityService";

interface AdminProfileSectionProps {
  profile: UserProfile;
}

export const AdminProfileSection = ({ profile }: AdminProfileSectionProps) => {
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.uid]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const recentActivities = await adminActivityService.getAdminActivities(profile.uid, 10);
      setActivities(recentActivities);
    } catch (error) {
      console.error("Error fetching admin activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (actionType: AdminActivity['actionType']) => {
    switch (actionType) {
      case 'user':
        return <Users className="w-4 h-4" />;
      case 'project':
        return <FileText className="w-4 h-4" />;
      case 'faq':
        return <HelpCircle className="w-4 h-4" />;
      case 'review':
        return <MessageCircle className="w-4 h-4" />;
      case 'notification':
        return <Bell className="w-4 h-4" />;
      case 'transaction':
        return <CreditCard className="w-4 h-4" />;
      case 'system':
        return <Settings className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getActivityColor = (actionType: AdminActivity['actionType']) => {
    switch (actionType) {
      case 'user':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'project':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'faq':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'review':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'notification':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'transaction':
        return 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300';
      case 'system':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Admin Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Details */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Full Name</span>
              <span className="font-medium">{profile.displayName || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="font-medium text-sm">{profile.email}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Role</span>
              <Badge variant="default" className="bg-purple-600">
                {profile.role?.toUpperCase()}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">User ID</span>
              <span className="font-mono text-xs">{profile.uid}</span>
            </div>
          </CardContent>
        </Card>

        {/* Admin Privileges */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              Admin Privileges
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">User Management</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Active</Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Project Oversight</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Active</Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">System Analytics</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Active</Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Full Access</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Granted</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            Recent Admin Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-purple-600" />
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${getActivityColor(activity.actionType)}`}>
                    {getActivityIcon(activity.actionType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs sm:text-sm break-words">{activity.action}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                          {activity.description}
                        </p>
                        {activity.targetName && (
                          <p className="text-xs text-muted-foreground mt-1 break-words">
                            Target: <span className="font-medium">{activity.targetName}</span>
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap self-start">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 sm:mt-2">
                      <Badge variant="outline" className="text-xs">
                        {activity.actionType}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium text-sm sm:text-base">No recent activity</p>
              <p className="text-xs sm:text-sm mt-2">Your admin activities will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

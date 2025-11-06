import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  User,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  Activity,
} from "lucide-react";
import { UserProfile } from "../../types/profile";
import { collection, query, where, getFirestore, onSnapshot } from 'firebase/firestore';

interface EmployeeProfileSectionProps {
  profile: UserProfile;
}

export const EmployeeProfileSection = ({ profile }: EmployeeProfileSectionProps) => {
  const [recentActivity, setRecentActivity] = useState<Array<{ 
    id: string; 
    type: string; 
    message: string; 
    timestamp: Date; 
    color: string 
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [workStats, setWorkStats] = useState({
    completed: 0,
    inProgress: 0,
    totalSubmissions: 0,
    needsRevision: 0,
  });

  useEffect(() => {
    if (!profile.uid) return;

    const db = getFirestore();
    const projectsRef = collection(db, 'projects');
    
    // Query projects assigned to this employee
    const q = query(
      projectsRef,
      where('assignedEmployeeId', '==', profile.uid)
    );
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activityLog: Array<{ id: string; type: string; message: string; timestamp: Date; color: string }> = [];
      
      let completed = 0;
      let inProgress = 0;
      let totalSubmissions = 0;
      let needsRevision = 0;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const projectTitle = data.title || '';
        const status = data.status || 'assigned';
        
        // Count project statuses
        if (status === 'completed' || status === 'completed_by_employee') {
          completed++;
          totalSubmissions++;
        } else if (status === 'in_progress' || status === 'assigned') {
          inProgress++;
        } else if (status === 'needs_revision') {
          needsRevision++;
          inProgress++; // Count as in progress too
        }
        
        // Count submitted work
        if (data.submittedToAdminAt) {
          totalSubmissions++;
        }
        
        // Generate activity log
        if (data.assignedAt) {
          const assignedDate = data.assignedAt.toDate();
          if (Date.now() - assignedDate.getTime() < 7 * 24 * 60 * 60 * 1000) { // Last 7 days
            activityLog.push({
              id: `${doc.id}-assigned`,
              type: 'assigned',
              message: `New project assigned: ${projectTitle}`,
              timestamp: assignedDate,
              color: 'green'
            });
          }
        }
        
        if (data.submittedToAdminAt) {
          const submittedDate = data.submittedToAdminAt.toDate();
          if (Date.now() - submittedDate.getTime() < 7 * 24 * 60 * 60 * 1000) { // Last 7 days
            activityLog.push({
              id: `${doc.id}-submitted`,
              type: 'submitted',
              message: `Work submitted: ${projectTitle}`,
              timestamp: submittedDate,
              color: 'blue'
            });
          }
        }
        
        if (status === 'completed') {
          const createdDate = data.createdAt?.toDate();
          if (createdDate && Date.now() - createdDate.getTime() < 7 * 24 * 60 * 60 * 1000) { // Last 7 days
            activityLog.push({
              id: `${doc.id}-completed`,
              type: 'completed',
              message: `Project approved: ${projectTitle}`,
              timestamp: createdDate,
              color: 'yellow'
            });
          }
        }
      });
      
      // Update work statistics
      setWorkStats({
        completed,
        inProgress,
        totalSubmissions,
        needsRevision,
      });
      
      // Sort activity log by timestamp (most recent first)
      activityLog.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setRecentActivity(activityLog.slice(0, 5));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile.uid]);

  const getTimeAgo = (timestamp: Date) => {
    const now = Date.now();
    const diff = now - timestamp.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return timestamp.toLocaleDateString();
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Employee Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Details */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
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
              <Badge variant="default" className="bg-blue-600">
                {profile.role?.toUpperCase()}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">User ID</span>
              <span className="font-mono text-xs">{profile.uid}</span>
            </div>
          </CardContent>
        </Card>

        {/* Work Statistics */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Work Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Completed Projects
              </span>
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                {workStats.completed}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Active Projects
              </span>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                {workStats.inProgress}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                Total Submissions
              </span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {workStats.totalSubmissions}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Loading activities...</p>
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                    activity.color === 'green' ? 'bg-green-500' :
                    activity.color === 'blue' ? 'bg-blue-500' :
                    activity.color === 'yellow' ? 'bg-yellow-500' :
                    'bg-gray-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      {activity.message}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {getTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No recent activity</p>
              <p className="text-sm mt-2">Your work activities from the last 7 days will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

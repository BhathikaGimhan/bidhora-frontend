import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  RefreshCw,
  Calendar,
  Target,
} from 'lucide-react';
import { StatCard } from '@/features/employee/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { AssignedProject, EmployeeStats } from '@/features/employee/models/AssignedProjectModel';
import { auth } from '@/firebaseConfig';
import { collection, query, where, getFirestore, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, Area, AreaChart } from 'recharts';

export function DashboardView() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<EmployeeStats>({
    totalAssigned: 0,
    inProgress: 0,
    completed: 0,
    needsRevision: 0,
  });
  const [recentProjects, setRecentProjects] = useState<AssignedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [performanceData, setPerformanceData] = useState<Array<{ month: string; completed: number; assigned: number }>>([]);
  const [recentActivity, setRecentActivity] = useState<Array<{ id: string; type: string; message: string; timestamp: Date; color: string }>>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [avgCompletionTime, setAvgCompletionTime] = useState(0);

  const loadDashboardData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.warn('No authenticated user found');
        return;
      }

      const db = getFirestore();
      const projectsRef = collection(db, 'projects');
      
      // Query projects assigned to this employee
      const q = query(
        projectsRef,
        where('assignedEmployeeId', '==', user.uid)
      );
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(q,
        (snapshot) => {
          const projects: AssignedProject[] = [];
          
          let inProgress = 0;
          let completed = 0;
          let needsRevision = 0;
          let earnings = 0;
          let totalCompletionDays = 0;
          let completedCount = 0;
          const activityLog: Array<{ id: string; type: string; message: string; timestamp: Date; color: string }> = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            const project: AssignedProject = {
              id: doc.id,
              title: data.title || '',
              description: data.description || '',
              status: data.status || 'assigned',
              clientId: data.createdBy || '',
              clientName: data.buyerEmail || '',
              budget: {
                min: data.budgetMin || 0,
                max: data.budgetMax || 0,
              },
              adminPrice: data.adminPrice,
              adminDuration: data.adminDuration,
              adminDurationUnit: data.adminDurationUnit,
              deadline: data.deadline?.toDate?.().toISOString().split('T')[0] || '',
              createdDate: data.createdAt?.toDate?.().toISOString().split('T')[0] || '',
              assignedDate: data.assignedAt?.toDate?.().toISOString().split('T')[0] || '',
              category: data.category || '',
              skillsRequired: data.skills || [],
              assignedEmployeeId: data.assignedEmployeeId || '',
              assignedEmployeeName: data.assignedEmployeeName || '',
              assignedEmployeeEmail: data.assignedEmployeeEmail || '',
              adminNotes: data.adminNotes,
              submittedToAdminAt: data.submittedToAdminAt?.toDate?.().toISOString(),
              adminReviewStatus: data.adminReviewStatus,
              adminReviewNotes: data.adminReviewNotes,
              downloadUrl: data.downloadUrl,
              documents: data.documents,
            };
            
            projects.push(project);
            
            // Count by status
            if (project.status === 'in_progress' || project.status === 'assigned') {
              inProgress++;
            } else if (project.status === 'completed' || project.status === 'completed_by_employee') {
              completed++;
              completedCount++;
              
              // Calculate earnings
              if (project.adminPrice) {
                earnings += project.adminPrice;
              }
              
              // Calculate completion time
              if (project.assignedDate && project.submittedToAdminAt) {
                const assignedTime = new Date(project.assignedDate).getTime();
                const submittedTime = new Date(project.submittedToAdminAt).getTime();
                const days = Math.floor((submittedTime - assignedTime) / (1000 * 60 * 60 * 24));
                totalCompletionDays += days;
              }
            } else if (project.status === 'needs_revision') {
              needsRevision++;
            }
            
            // Generate activity log
            if (project.assignedDate) {
              const assignedDate = new Date(project.assignedDate);
              if (Date.now() - assignedDate.getTime() < 7 * 24 * 60 * 60 * 1000) { // Last 7 days
                activityLog.push({
                  id: `${project.id}-assigned`,
                  type: 'assigned',
                  message: `New project assigned: ${project.title}`,
                  timestamp: assignedDate,
                  color: 'green'
                });
              }
            }
            
            if (project.submittedToAdminAt) {
              const submittedDate = new Date(project.submittedToAdminAt);
              if (Date.now() - submittedDate.getTime() < 7 * 24 * 60 * 60 * 1000) { // Last 7 days
                activityLog.push({
                  id: `${project.id}-submitted`,
                  type: 'submitted',
                  message: `Work submitted: ${project.title}`,
                  timestamp: submittedDate,
                  color: 'blue'
                });
              }
            }
            
            if (project.status === 'completed') {
              const createdDate = new Date(project.createdDate);
              if (Date.now() - createdDate.getTime() < 7 * 24 * 60 * 60 * 1000) { // Last 7 days
                activityLog.push({
                  id: `${project.id}-completed`,
                  type: 'completed',
                  message: `Project approved: ${project.title}`,
                  timestamp: createdDate,
                  color: 'yellow'
                });
              }
            }
          });
          
          // Sort activity log by timestamp (most recent first)
          activityLog.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          setRecentActivity(activityLog.slice(0, 5));
          
          setStats({
            totalAssigned: projects.length,
            inProgress,
            completed,
            needsRevision,
          });
          
          setTotalEarnings(earnings);
          setAvgCompletionTime(completedCount > 0 ? Math.round(totalCompletionDays / completedCount) : 0);
          
          // Calculate performance data by month (last 6 months)
          const performanceMap = new Map<string, { completed: number; assigned: number }>();
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          
          // Initialize last 6 months
          for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            performanceMap.set(key, { completed: 0, assigned: 0 });
          }
          
          // Count projects by month
          projects.forEach(project => {
            if (project.assignedDate) {
              const assignedDate = new Date(project.assignedDate);
              const key = `${monthNames[assignedDate.getMonth()]} ${assignedDate.getFullYear()}`;
              const data = performanceMap.get(key);
              if (data) {
                data.assigned += 1;
                if (project.status === 'completed' || project.status === 'completed_by_employee') {
                  data.completed += 1;
                }
              }
            }
          });
          
          const chartData = Array.from(performanceMap.entries()).map(([month, data]) => ({
            month,
            completed: data.completed,
            assigned: data.assigned
          }));
          
          setPerformanceData(chartData);
          
          // Get recent 5 projects (sorted by assigned date)
          const sortedProjects = [...projects].sort((a, b) => {
            const dateA = new Date(a.assignedDate).getTime();
            const dateB = new Date(b.assignedDate).getTime();
            return dateB - dateA;
          });
          setRecentProjects(sortedProjects.slice(0, 5));
          setLoading(false);
          setRefreshing(false);
        },
        (error) => {
          console.error('Error loading dashboard data:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load dashboard data. Please try again.',
          });
          setLoading(false);
          setRefreshing(false);
        }
      );
      
      // Return cleanup function
      return unsubscribe;
      
    } catch (error) {
      console.error('Error setting up dashboard listener:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load dashboard data. Please try again.',
      });
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const setupListener = async () => {
      unsubscribe = await loadDashboardData();
    };
    
    setupListener();
    
    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    // The real-time listener will automatically update the data
    // Just show a toast to indicate refresh
    setTimeout(() => {
      setRefreshing(false);
      toast({
        title: 'Refreshed',
        description: 'Dashboard data is up to date',
      });
    }, 500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'secondary';
      case 'in_progress':
        return 'default';
      case 'completed_by_employee':
        return 'outline';
      case 'completed':
        return 'default';
      case 'needs_revision':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'Assigned';
      case 'in_progress':
        return 'In Progress';
      case 'completed_by_employee':
        return 'Submitted';
      case 'completed':
        return 'Completed';
      case 'needs_revision':
        return 'Needs Revision';
      default:
        return status;
    }
  };

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

  const getEffectiveDeadline = (project: AssignedProject) => {
    // Use admin deadline if available, otherwise fall back to buyer deadline
    if (project.adminDuration && project.adminDurationUnit && project.assignedDate) {
      const durationInDays = project.adminDurationUnit === 'weeks' 
        ? project.adminDuration * 7 
        : project.adminDuration;
      const adminDeadline = new Date(project.assignedDate);
      adminDeadline.setDate(adminDeadline.getDate() + durationInDays);
      return adminDeadline.toISOString().split('T')[0];
    }
    return project.deadline;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Your work overview and statistics
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

      {/* Stats Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Assigned"
          value={stats.totalAssigned}
          description="Projects assigned to you"
          icon={FolderOpen}
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          description="Currently working on"
          icon={Clock}
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          description="Successfully finished"
          icon={CheckCircle}
        />
        <StatCard
          title="Needs Revision"
          value={stats.needsRevision}
          description="Requires changes"
          icon={AlertCircle}
        />
        
        
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Performance Overview</span>
            </CardTitle>
            <CardDescription>
              Projects assigned vs completed over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <defs>
                    <linearGradient id="colorAssigned" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="50%" stopColor="#1d4ed8" stopOpacity={0.6}/>
                      <stop offset="100%" stopColor="#1e40af" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="50%" stopColor="#059669" stopOpacity={0.6}/>
                      <stop offset="100%" stopColor="#047857" stopOpacity={0.1}/>
                    </linearGradient>
                    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.1"/>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="month" 
                    fontSize={12}
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <YAxis 
                    fontSize={12}
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      padding: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      paddingTop: '20px',
                      fontSize: '14px'
                    }}
                  />
                  <Area 
                    type="monotone"
                    dataKey="assigned" 
                    stroke="#1d4ed8"
                    strokeWidth={3}
                    fill="url(#colorAssigned)"
                    filter="url(#shadow)"
                    dot={{ fill: '#1d4ed8', strokeWidth: 2, r: 5, stroke: '#ffffff' }}
                    activeDot={{ r: 7, stroke: '#1d4ed8', strokeWidth: 3, fill: '#ffffff' }}
                    name="Assigned"
                  />
                  <Area 
                    type="monotone"
                    dataKey="completed" 
                    stroke="#059669"
                    strokeWidth={3}
                    fill="url(#colorCompleted)"
                    filter="url(#shadow)"
                    dot={{ fill: '#059669', strokeWidth: 2, r: 5, stroke: '#ffffff' }}
                    activeDot={{ r: 7, stroke: '#059669', strokeWidth: 3, fill: '#ffffff' }}
                    name="Completed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No performance data yet</p>
                  <p className="text-sm">Complete projects to see your performance</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>
              Latest updates from the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                      activity.color === 'green' ? 'bg-green-500' :
                      activity.color === 'blue' ? 'bg-blue-500' :
                      activity.color === 'yellow' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm truncate">
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
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No recent activity</p>
                  <p className="text-sm">Your activity will appear here</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Projects</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/employee/completed')}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentProjects.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No projects assigned yet
            </p>
          ) : (
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/employee/projects/${project.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{project.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {project.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={getStatusColor(project.status)}>
                        {getStatusLabel(project.status)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Due: {new Date(getEffectiveDeadline(project)).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

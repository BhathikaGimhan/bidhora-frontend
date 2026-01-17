import { useEffect, useState } from "react";
import {
  Users,
  FolderOpen,
  CreditCard,
  TrendingUp,
  Activity,
  FileCheck,
  Loader2,
  Calendar,
  FileText,
  MessageCircle,
  Bell,
  Settings,
  HelpCircle,
} from "lucide-react";
import { StatCard } from "@/features/admin/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { userController } from "@/features/admin/controllers/userController";
import { projectController } from "@/features/admin/controllers/projectController";
import { transactionController } from "@/features/admin/controllers/transactionController";
import { getAllWorkSubmissions } from "@/Services/workSubmissionService";
import { Project, ProjectStats } from "@/features/admin/models/ProjectModel";
import { User } from "@/features/admin/models/UserModel";
import { UserStats } from "@/features/admin/models/UserModel";
import { TransactionStats } from "@/features/admin/models/TransactionModel";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useNavigate } from "react-router-dom";
import { db } from "@/firebaseConfig";
import { collection, query, orderBy, limit, getDocs, Timestamp, where } from "firebase/firestore";
import { adminActivityService, AdminActivity } from "@/Services/adminActivityService";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface GrowthData {
  month: string;
  users: number;
  projects: number;
  revenue: number;
}

export function DashboardView() {
  const [projectStats, setProjectStats] = useState<ProjectStats>({
    totalProjects: 0,
    activeProjects: 0,
    pendingApproval: 0,
    completedProjects: 0,
  });
  const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState(0);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    bannedUsers: 0,
  });
  const [transactionStats, setTransactionStats] = useState<TransactionStats>({
    totalRevenue: 0,
    pendingTransactions: 0,
    completedTransactions: 0,
    failedTransactions: 0,
  });
  const [recentActivities, setRecentActivities] = useState<AdminActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchGrowthData = async (): Promise<GrowthData[]> => {
    try {
      const now = new Date();
      const monthsData: GrowthData[] = [];
      
      // Fetch all data once to avoid multiple queries per month
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);
      
      const projectsRef = collection(db, "projects");
      const projectsSnapshot = await getDocs(projectsRef);
      
      const submissionsRef = collection(db, "projectSubmissions");
      const submissionsSnapshot = await getDocs(submissionsRef);
      
      // Get last 6 months of data
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
        
        // Count users created in this month
        let usersCount = 0;
        usersSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.createdAt) {
            const createdDate = data.createdAt.toDate();
            if (createdDate >= monthDate && createdDate < nextMonthDate) {
              usersCount++;
            }
          }
        });
        
        // Count projects created in this month
        let projectsCount = 0;
        projectsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.createdAt) {
            const createdDate = data.createdAt.toDate();
            if (createdDate >= monthDate && createdDate < nextMonthDate) {
              projectsCount++;
            }
          }
        });
        
        // Calculate revenue for this month (from ALL projects that had payments in this month)
        let monthRevenue = 0;
        projectsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          // Check deposit/initial payments made in this month
          if (data.initialPaymentStatus === "paid") {
            if (data.initialPaymentDate) {
              try {
                const paymentDate = data.initialPaymentDate.toDate();
                if (paymentDate >= monthDate && paymentDate < nextMonthDate) {
                  monthRevenue += data.initialPaymentAmount || 0;
                }
              } catch (e) {
                // If date conversion fails and this is current month, count it
                if (i === 0) {
                  monthRevenue += data.initialPaymentAmount || 0;
                }
              }
            } else if (i === 0) {
              // No date but paid - count in current month
              monthRevenue += data.initialPaymentAmount || 0;
            }
          }
          // Check final payments made in this month
          if (data.finalPaymentStatus === "paid") {
            if (data.finalPaymentDate) {
              try {
                const paymentDate = data.finalPaymentDate.toDate();
                if (paymentDate >= monthDate && paymentDate < nextMonthDate) {
                  monthRevenue += data.finalPaymentAmount || 0;
                }
              } catch (e) {
                // If date conversion fails and this is current month, count it
                if (i === 0) {
                  monthRevenue += data.finalPaymentAmount || 0;
                }
              }
            } else if (i === 0) {
              // No date but paid - count in current month
              monthRevenue += data.finalPaymentAmount || 0;
            }
          }
        });
        
        // Include part payments from projectSubmissions collection
        submissionsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.paymentStatus === "paid" && data.adminPrice > 0) {
            try {
              // Try to use paidAt date first, then fall back to submittedAt or approvedAt
              let paidDate = null;
              if (data.paidAt) {
                paidDate = data.paidAt.toDate();
              } else if (data.approvedAt) {
                paidDate = data.approvedAt.toDate();
              } else if (data.submittedAt) {
                paidDate = data.submittedAt.toDate();
              }
              
              if (paidDate) {
                if (paidDate >= monthDate && paidDate < nextMonthDate) {
                  monthRevenue += data.adminPrice;
                }
              } else if (i === 0) {
                // If no date available and this is the current month, count it here
                monthRevenue += data.adminPrice;
              }
            } catch (e) {
              // If date conversion fails and this is current month, still count it
              if (i === 0) {
                monthRevenue += data.adminPrice;
              }
            }
          }
        });
        
        monthsData.push({
          month: monthName,
          users: usersCount,
          projects: projectsCount,
          revenue: monthRevenue,
        });
      }
      
      return monthsData;
    } catch (error) {
      console.error("Error fetching growth data:", error);
      // Return default data for demo
      return [
        { month: 'Aug', users: 0, projects: 0, revenue: 0 },
        { month: 'Sep', users: 0, projects: 0, revenue: 0 },
        { month: 'Oct', users: 0, projects: 0, revenue: 0 },
        { month: 'Nov', users: 0, projects: 0, revenue: 0 },
        { month: 'Dec', users: 0, projects: 0, revenue: 0 },
        { month: 'Jan', users: 0, projects: 0, revenue: 0 },
      ];
    }
  };

  const fetchRecentActivities = async (): Promise<AdminActivity[]> => {
    setActivitiesLoading(true);
    try {
      const activities = await adminActivityService.getAllRecentActivities(10);
      return activities;
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      return [];
    } finally {
      setActivitiesLoading(false);
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

  const formatTimeAgo = (date: Date): string => {
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

  // Calculate growth percentages
  const calculateGrowthPercentage = (data: GrowthData[], key: 'users' | 'projects' | 'revenue'): number => {
    if (data.length < 2) return 0;
    const lastMonth = data[data.length - 1]?.[key] || 0;
    const previousMonth = data[data.length - 2]?.[key] || 0;
    if (previousMonth === 0) return lastMonth > 0 ? 100 : 0;
    return Math.round(((lastMonth - previousMonth) / previousMonth) * 100);
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [stats, projects, submissions, users, uStats, tStats, activities, growth] = await Promise.all([
          projectController.getProjectStats(),
          projectController.getProjectsByStatus("pending"),
          getAllWorkSubmissions(),
          userController.getRecentUsers(5),
          userController.getUserStats(),
          transactionController.getTransactionStats(),
          fetchRecentActivities(),
          fetchGrowthData(),
        ]);
        
        setProjectStats(stats);
        setPendingProjects(projects.slice(0, 3));
        setPendingSubmissions(
          submissions.filter((s) => s.status === "pending_review").length
        );
        setRecentUsers(users);
        setUserStats(uStats);
        setTransactionStats(tStats);
        setRecentActivities(activities);
        setGrowthData(growth);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    padding: '8px',
    color: 'hsl(var(--popover-foreground))',
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={userStats.totalUsers}
          description={`${userStats.activeUsers} active`}
          icon={Users}
          trend={
            growthData.length > 0
              ? {
                  value: Math.abs(calculateGrowthPercentage(growthData, 'users')),
                  isPositive: calculateGrowthPercentage(growthData, 'users') >= 0,
                }
              : undefined
          }
        />
        <StatCard
          title="Active Projects"
          value={projectStats.activeProjects}
          description={`${projectStats.pendingApproval} pending approval`}
          icon={FolderOpen}
          trend={
            growthData.length > 0
              ? {
                  value: Math.abs(calculateGrowthPercentage(growthData, 'projects')),
                  isPositive: calculateGrowthPercentage(growthData, 'projects') >= 0,
                }
              : undefined
          }
        />
        <StatCard
          title="Revenue"
          value={`LKR ${transactionStats.totalRevenue.toLocaleString()}`}
          description={`${transactionStats.pendingTransactions} pending`}
          icon={CreditCard}
          trend={
            growthData.length > 0
              ? {
                  value: Math.abs(calculateGrowthPercentage(growthData, 'revenue')),
                  isPositive: calculateGrowthPercentage(growthData, 'revenue') >= 0,
                }
              : undefined
          }
        />
        <div
          className="cursor-pointer"
          onClick={() => navigate("/admin/work-submissions")}
        >
          <StatCard
            title="Work Submissions"
            value={pendingSubmissions}
            description="Awaiting review"
            icon={FileCheck}
            trend={
              pendingSubmissions > 0
                ? { value: pendingSubmissions, isPositive: false }
                : undefined
            }
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Platform Growth (Last 6 Months)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={growthData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    iconType="line"
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                    name="New Users"
                  />
                  <Area
                    type="monotone"
                    dataKey="projects"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProjects)"
                    name="New Projects"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Revenue Trend (Last 6 Months)</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              6-Month Total: LKR {growthData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={growthData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `LKR ${value}`}
                  />
                                    <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number) => [`LKR ${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Summary Stats Below Chart */}
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="text-sm font-semibold text-emerald-600">
                  LKR {growthData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Avg/Month</div>
                <div className="text-sm font-semibold text-blue-600">
                  LKR {Math.round(growthData.reduce((sum, d) => sum + d.revenue, 0) / growthData.length).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">This Month</div>
                <div className="text-sm font-semibold text-amber-600">
                  LKR {growthData[growthData.length - 1]?.revenue.toLocaleString() || '0'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and User Tables Row */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Recent Admin Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto">
                <ul className="space-y-2">
                  {recentActivities.map((activity) => (
                    <li
                      key={activity.id}
                      className="flex items-start gap-2 py-2 border-b last:border-b-0 hover:bg-accent/30 px-2 -mx-2 rounded transition-colors"
                    >
                      <div className={`p-1.5 rounded-md mt-0.5 flex-shrink-0 ${getActivityColor(activity.actionType)}`}>
                        {getActivityIcon(activity.actionType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm leading-tight">{activity.action}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {activity.description}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {formatTimeAgo(activity.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs py-0 h-5">
                            {activity.actionType}
                          </Badge>
                          {activity.targetName && (
                            <span className="text-xs text-muted-foreground truncate">
                              {activity.targetName}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No recent activity</p>
                <p className="text-sm mt-2">Admin activities will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No users found
                </div>
              ) : (
                recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {user.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </div>
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                        user.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {user.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingProjects.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No pending approvals
                </div>
              ) : (
                pendingProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-start justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {project.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        by {project.clientName} • ${project.budget.min}-$
                        {project.budget.max}
                      </div>
                    </div>
                    <div className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full flex-shrink-0">
                      Pending
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

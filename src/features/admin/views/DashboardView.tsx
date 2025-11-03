import { useEffect, useState } from "react";
import {
  Users,
  FolderOpen,
  CreditCard,
  TrendingUp,
  Activity,
  FileCheck,
} from "lucide-react";
import { StatCard } from "@/features/admin/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface RecentActivity {
  id: string;
  type: 'user' | 'project' | 'payment' | 'submission';
  message: string;
  timestamp: Date;
  color: string;
}

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
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchGrowthData = async (): Promise<GrowthData[]> => {
    try {
      const now = new Date();
      const monthsData: GrowthData[] = [];
      
      // Get last 6 months of data
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
        
        // Fetch users created in this month
        const usersRef = collection(db, "users");
        const usersQuery = query(
          usersRef,
          where("createdAt", ">=", Timestamp.fromDate(monthDate)),
          where("createdAt", "<", Timestamp.fromDate(nextMonthDate))
        );
        const usersSnapshot = await getDocs(usersQuery);
        
        // Fetch projects created in this month
        const projectsRef = collection(db, "projects");
        const projectsQuery = query(
          projectsRef,
          where("createdAt", ">=", Timestamp.fromDate(monthDate)),
          where("createdAt", "<", Timestamp.fromDate(nextMonthDate))
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        
        // Calculate revenue for this month
        let monthRevenue = 0;
        projectsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.initialPaymentStatus === "paid" && data.initialPaymentDate) {
            const paymentDate = data.initialPaymentDate.toDate();
            if (paymentDate >= monthDate && paymentDate < nextMonthDate) {
              monthRevenue += data.initialPaymentAmount || 0;
            }
          }
          if (data.finalPaymentStatus === "paid" && data.finalPaymentDate) {
            const paymentDate = data.finalPaymentDate.toDate();
            if (paymentDate >= monthDate && paymentDate < nextMonthDate) {
              monthRevenue += data.finalPaymentAmount || 0;
            }
          }
        });
        
        monthsData.push({
          month: monthName,
          users: usersSnapshot.size,
          projects: projectsSnapshot.size,
          revenue: monthRevenue,
        });
      }
      
      return monthsData;
    } catch (error) {
      console.error("Error fetching growth data:", error);
      // Return default data for demo
      return [
        { month: 'Jun', users: 0, projects: 0, revenue: 0 },
        { month: 'Jul', users: 0, projects: 0, revenue: 0 },
        { month: 'Aug', users: 0, projects: 0, revenue: 0 },
        { month: 'Sep', users: 0, projects: 0, revenue: 0 },
        { month: 'Oct', users: 0, projects: 0, revenue: 0 },
        { month: 'Nov', users: 0, projects: 0, revenue: 0 },
      ];
    }
  };

  const fetchRecentActivities = async (): Promise<RecentActivity[]> => {
    try {
      const activities: RecentActivity[] = [];

      // Fetch recent users
      const usersRef = collection(db, "users");
      const usersQuery = query(usersRef, orderBy("createdAt", "desc"), limit(3));
      const usersSnapshot = await getDocs(usersQuery);
      
      usersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: `user-${doc.id}`,
          type: 'user',
          message: `New user registered: ${data.displayName || data.name || 'Unknown User'}`,
          timestamp: data.createdAt ? data.createdAt.toDate() : new Date(),
          color: 'green'
        });
      });

      // Fetch recent projects
      const projectsRef = collection(db, "projects");
      const projectsQuery = query(projectsRef, orderBy("createdAt", "desc"), limit(3));
      const projectsSnapshot = await getDocs(projectsQuery);
      
      projectsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === "approved") {
          activities.push({
            id: `project-${doc.id}`,
            type: 'project',
            message: `Project approved: ${data.title}`,
            timestamp: data.approvedAt ? data.approvedAt.toDate() : data.createdAt.toDate(),
            color: 'blue'
          });
        }
      });

      // Fetch recent high-value payments
      const paymentsQuery = query(projectsRef, orderBy("finalPaymentDate", "desc"), limit(2));
      const paymentsSnapshot = await getDocs(paymentsQuery);
      
      paymentsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.finalPaymentAmount && data.finalPaymentAmount >= 1000 && data.finalPaymentStatus === "pending") {
          activities.push({
            id: `payment-${doc.id}`,
            type: 'payment',
            message: `High-value payment pending: LKR ${data.finalPaymentAmount}`,
            timestamp: data.finalPaymentDate ? data.finalPaymentDate.toDate() : new Date(),
            color: 'yellow'
          });
        }
      });

      // Sort by timestamp (most recent first)
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      return [];
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
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
              <span>Platform Growth</span>
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
              <span>Revenue Trend</span>
            </CardTitle>
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
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {recentActivities.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No recent activities
                </div>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <div 
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        activity.color === 'green' ? 'bg-green-500' :
                        activity.color === 'blue' ? 'bg-blue-500' :
                        activity.color === 'yellow' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`}
                    ></div>
                    <span className="text-xs sm:text-sm flex-1 min-w-0 truncate">
                      {activity.message}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                ))
              )}
            </div>
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

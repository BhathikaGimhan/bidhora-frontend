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
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useNavigate } from "react-router-dom";

export function DashboardView() {
  const [projectStats, setProjectStats] = useState<ProjectStats>({
    totalProjects: 0,
    activeProjects: 0,
    pendingApproval: 0,
    completedProjects: 0,
  });
  const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [stats, projects, submissions] = await Promise.all([
          projectController.getProjectStats(),
          projectController.getProjectsByStatus("pending"),
          getAllWorkSubmissions(),
        ]);
        setProjectStats(stats);
        setPendingProjects(projects.slice(0, 3));
        setPendingSubmissions(
          submissions.filter((s) => s.status === "pending_review").length
        );
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const userStats = userController.getUserStats();
  const transactionStats = transactionController.getTransactionStats();
  const recentUsers = userController.getAllUsers().slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={userStats.totalUsers}
          description={`${userStats.activeUsers} active`}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Active Projects"
          value={projectStats.activeProjects}
          description={`${projectStats.pendingApproval} pending approval`}
          icon={FolderOpen}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Revenue"
          value={`$${transactionStats.totalRevenue.toLocaleString()}`}
          description={`${transactionStats.pendingTransactions} pending`}
          icon={CreditCard}
          trend={{ value: 23, isPositive: true }}
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
            <div className="h-48 sm:h-64 flex items-center justify-center text-muted-foreground">
              Growth Chart Placeholder
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm flex-1 min-w-0 truncate">
                  New user registered: Sarah Johnson
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  2h ago
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm flex-1 min-w-0 truncate">
                  Project approved: E-commerce Website
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  4h ago
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm flex-1 min-w-0 truncate">
                  High-value transaction pending
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  6h ago
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.map((user) => (
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
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingProjects.map((project) => (
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

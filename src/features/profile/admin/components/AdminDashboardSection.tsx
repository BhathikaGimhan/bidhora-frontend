import { Card, CardContent } from "@/components/ui/card";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  BarChart3,
  Settings as SettingsIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { adminStatsService, AdminStats } from "@/Services/adminStatsService";
import LoadingSpinner from "@/components/ui/loading-spinner";

export const AdminDashboardSection = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const adminStats = await adminStatsService.getAdminStats();
        setStats(adminStats);
      } catch (err) {
        console.error("Error fetching admin stats:", err);
        setError("Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const dashboardLinks = [
    {
      title: "Dashboard Overview",
      description: "View system statistics and analytics",
      icon: LayoutDashboard,
      href: "/admin",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "User Management",
      description: "Manage all users and their roles",
      icon: Users,
      href: "/admin/users",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Project Management",
      description: "Oversee all projects and ProjectX",
      icon: FolderOpen,
      href: "/admin/projects",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "Analytics",
      description: "View detailed system analytics",
      icon: BarChart3,
      href: "/admin/analytics",
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      title: "System Settings",
      description: "Configure system settings",
      icon: SettingsIcon,
      href: "/admin/settings",
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/20",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Admin Dashboard
        </h2>
        <p className="text-muted-foreground">
          Access administrative tools and system management features
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardLinks.map((link) => (
          <Link key={link.href} to={link.href}>
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-lg ${link.bgColor} group-hover:scale-110 transition-transform duration-300`}
                  >
                    <link.icon className={`w-6 h-6 ${link.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                      {link.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {link.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Stats */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {stats?.totalUsers || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Total Users</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {stats?.activeProjects || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Active Projects
                </p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {stats?.totalProjects || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Total Projects</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">
                  LKR {(stats?.totalRevenue || 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Total Revenue
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

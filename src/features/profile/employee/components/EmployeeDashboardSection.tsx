import { Card, CardContent } from "@/components/ui/card";
import {
  Award,
  TrendingUp,
  Star,
  DollarSign,
  CheckCircle,
  Clock,
  Target,
  Calendar,
  LayoutDashboard,
  FolderOpen,
  Bell,
  Settings as SettingsIcon,
} from "lucide-react";
import { UserProfile } from "../../types/profile";
import { useState, useEffect } from "react";
import { getEmployeeProjects } from "@/Services/projectService";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Link } from "react-router-dom";

interface EmployeeDashboardSectionProps {
  profile: UserProfile;
}

export const EmployeeDashboardSection = ({
  profile,
}: EmployeeDashboardSectionProps) => {
  const [loading, setLoading] = useState(true);
  const [activeProjectsCount, setActiveProjectsCount] = useState(0);
  const [completedProjectsCount, setCompletedProjectsCount] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [successRate, setSuccessRate] = useState(0);

  useEffect(() => {
    const fetchEmployeeStats = async () => {
      try {
        setLoading(true);
        console.log("🔍 Fetching employee projects for:", profile.uid);

        // Fetch employee projects from Firestore
        const { active, completed } = await getEmployeeProjects(profile.uid);

        console.log("📊 Active projects:", active.length);
        console.log("📊 Completed projects:", completed.length);

        // Calculate statistics
        const completedCount = completed.length;
        const activeCount = active.length;
        
        // Calculate total earnings from completed projects
        const earnings = completed.reduce((sum, project) => {
          return sum + (project.budget || 0);
        }, 0);

        // Calculate average rating from completed projects with ratings
        const projectsWithRatings = completed.filter(p => p.rating && p.rating > 0);
        const avgRating = projectsWithRatings.length > 0
          ? projectsWithRatings.reduce((sum, project) => sum + (project.rating || 0), 0) / projectsWithRatings.length
          : profile.rating || 0;

        // Calculate total hours
        const hours = completed.reduce((sum, project) => {
          const hours = project.duration ? parseFloat(project.duration.split(' ')[0]) : 40;
          return sum + hours;
        }, 0);

        // Calculate success rate
        const totalProjects = completedCount + activeCount;
        const successPct = totalProjects > 0 ? Math.round((completedCount / totalProjects) * 100) : 0;

        // Update state
        setActiveProjectsCount(activeCount);
        setCompletedProjectsCount(completedCount);
        setTotalEarnings(earnings);
        setAverageRating(avgRating);
        setTotalHours(hours);
        setSuccessRate(successPct);

        console.log("✅ Statistics calculated:", {
          activeCount,
          completedCount,
          earnings,
          avgRating,
          hours,
          successPct
        });

      } catch (error) {
        console.error("Error fetching employee statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeStats();
  }, [profile.uid, profile.rating]);

  const dashboardLinks = [
    {
      title: "Dashboard Overview",
      description: "View your performance and statistics",
      icon: LayoutDashboard,
      href: "/employee",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Active Projects",
      description: "Manage your assigned projects",
      icon: FolderOpen,
      href: "/employee/projects",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Completed Projects",
      description: "View your completed work history",
      icon: CheckCircle,
      href: "/employee/completed",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "Notifications",
      description: "Check your notifications",
      icon: Bell,
      href: "/employee/notifications",
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      title: "Settings",
      description: "Manage your account settings",
      icon: SettingsIcon,
      href: "/employee/settings",
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/20",
    },
  ];

  const stats = [
    {
      label: "Completed Projects",
      value: completedProjectsCount,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      label: "Active Projects",
      value: activeProjectsCount,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      label: "Average Rating",
      value: averageRating.toFixed(1),
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
    },
   
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Employee Dashboard
        </h2>
        <p className="text-muted-foreground">
          Access your workspace and manage your projects
        </p>
      </div>

      {/* Quick Access Links */}
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

      {/* Work Statistics Title */}
      <div className="pt-4">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Work Statistics
        </h2>
        <p className="text-muted-foreground">
          Your performance metrics and work history overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="shadow-sm hover:shadow-md transition-all duration-300"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {stat.label}
                  </p>
                  <p className={`text-3xl font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`p-3 ${stat.bgColor} rounded-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Info */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Award className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member Status</p>
                <p className="font-semibold">Active Employee</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-semibold">
                  {profile.createdAt
                    ? (typeof profile.createdAt === 'object' && 'toDate' in profile.createdAt
                        ? profile.createdAt.toDate().toLocaleDateString()
                        : new Date(profile.createdAt as Date).toLocaleDateString())
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

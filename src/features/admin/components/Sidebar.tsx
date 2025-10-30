import { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  MessageSquare,
  CreditCard,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  Home,
  ArrowLeft,
  Package,
  HelpCircle,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { auth } from "@/firebaseConfig";

const sidebarItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Work Submissions", url: "/admin/work-submissions", icon: Package },
  { title: "Urgent Projects", url: "/admin/projects", icon: AlertCircle },
  { title: "Project Review", url: "/admin/project-review", icon: DollarSign },
  { title: "Bids", url: "/admin/bids", icon: MessageSquare },
  { title: "Transactions", url: "/admin/transactions", icon: CreditCard },
  { title: "FAQ Management", url: "/admin/faq", icon: HelpCircle },
  { title: "Notifications", url: "/admin/notifications", icon: Bell },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileToggle: () => void;
}

export function AdminSidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileToggle,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Get current user info
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const isActive = (path: string) => {
    if (path === "/admin") {
      return currentPath === "/admin";
    }
    return currentPath.startsWith(path);
  };

  const handleNavClick = () => {
    // Close mobile menu when navigating
    if (mobileOpen) {
      onMobileToggle();
    }
  };

  const handleLogoClick = () => {
    navigate("/");
    if (mobileOpen) {
      onMobileToggle();
    }
  };

  const handleBackToProfile = () => {
    if (currentUser) {
      navigate(`/profile/${currentUser.uid}`);
      if (mobileOpen) {
        onMobileToggle();
      }
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden lg:flex h-screen bg-card border-r border-border transition-all duration-300 flex-col",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          {!collapsed && (
            <button
              onClick={handleLogoClick}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-semibold text-foreground">
                Bidhora Admin
              </span>
            </button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 hover:bg-muted"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Back to Profile Button */}
        {!collapsed && currentUser && (
          <div className="p-2">
            <Button
              variant="outline"
              onClick={handleBackToProfile}
              className="w-full justify-start space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Profile</span>
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto admin-scrollbar">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.title}
              to={item.url}
              className={({ isActive: navIsActive }) =>
                cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  "hover:bg-muted/50 group",
                  (navIsActive || isActive(item.url)) &&
                    "bg-primary/10 text-primary font-medium border-l-4 border-primary"
                )
              }
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive(item.url)
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {!collapsed && (
                <span className="transition-colors">{item.title}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-border">
            <div className="text-xs text-muted-foreground">Version 1.0.0</div>
          </div>
        )}
      </div>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <button
            onClick={handleLogoClick}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-semibold text-foreground">Bidhora Admin</span>
          </button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileToggle}
            className="h-8 w-8 hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Back to Profile Button */}
        {currentUser && (
          <div className="p-2">
            <Button
              variant="outline"
              onClick={handleBackToProfile}
              className="w-full justify-start space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Profile</span>
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto admin-scrollbar">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.title}
              to={item.url}
              onClick={handleNavClick}
              className={({ isActive: navIsActive }) =>
                cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  "hover:bg-muted/50 group",
                  (navIsActive || isActive(item.url)) &&
                    "bg-primary/10 text-primary font-medium border-l-4 border-primary"
                )
              }
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive(item.url)
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span className="transition-colors">{item.title}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground">Version 1.0.0</div>
        </div>
      </div>
    </>
  );
}

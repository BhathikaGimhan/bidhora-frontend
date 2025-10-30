import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminSidebar } from "@/features/admin/components/Sidebar";
import { AdminTopbar } from "@/features/admin/components/Topbar";
import { DashboardView } from "@/features/admin/views/DashboardView";
import { UsersView } from "@/features/admin/views/UsersView";
import { UrgentProjectsView } from "@/features/admin/views/UrgentProjectsView";
import { ProjectReviewView } from "@/features/admin/views/ProjectReviewView";
import { TransactionsView } from "@/features/admin/views/TransactionsView";
import { NotificationsView } from "@/features/admin/views/NotificationsView";
import { SettingsView } from "@/features/admin/views/SettingsView";
import WorkSubmissionsView from "@/features/admin/views/WorkSubmissionsView";
import FAQView from "@/features/admin/views/FAQView";

export default function AdminPanel() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("admin-sidebar-collapsed");
    return saved ? JSON.parse(saved) : false;
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      "admin-sidebar-collapsed",
      JSON.stringify(sidebarCollapsed)
    );
  }, [sidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="h-screen w-full flex overflow-hidden">
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (fixed height, not scrollable) */}
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        mobileOpen={mobileMenuOpen}
        onMobileToggle={toggleMobileMenu}
      />

      {/* Right content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar (optional sticky) */}
        <AdminTopbar onMobileMenuToggle={toggleMobileMenu} />

        {/* Main content area - scrollable */}
        <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 admin-scrollbar">
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/users" element={<UsersView />} />
            <Route path="/work-submissions" element={<WorkSubmissionsView />} />
            <Route path="/projects" element={<UrgentProjectsView />} />
            <Route path="/project-review" element={<ProjectReviewView />} />
            <Route path="/transactions" element={<TransactionsView />} />
            <Route path="/notifications" element={<NotificationsView />} />
            <Route path="/faq" element={<FAQView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

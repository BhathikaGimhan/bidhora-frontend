import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { EmployeeSidebar } from "@/features/employee/components/Sidebar";
import { EmployeeTopbar } from "@/features/employee/components/Topbar";
import { DashboardView } from "@/features/employee/views/DashboardView";
import { ProjectsView } from "@/features/employee/views/ProjectsView";
import { ProjectDetailsView } from "@/features/employee/views/ProjectDetailsView";
import { CompletedView } from "@/features/employee/views/CompletedView";

export default function EmployeePanel() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("employee-sidebar-collapsed");
    return saved ? JSON.parse(saved) : false;
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      "employee-sidebar-collapsed",
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
      <EmployeeSidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        mobileOpen={mobileMenuOpen}
        onMobileToggle={toggleMobileMenu}
      />

      {/* Right content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <EmployeeTopbar onMobileMenuToggle={toggleMobileMenu} />

        {/* Main content area - scrollable */}
        <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 admin-scrollbar">
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/projects" element={<ProjectsView />} />
            <Route path="/projects/:projectId" element={<ProjectDetailsView />} />
            <Route path="/completed" element={<CompletedView />} />
            <Route path="/notifications" element={<div>Notifications View (Coming Soon)</div>} />
            <Route path="/settings" element={<div>Settings View (Coming Soon)</div>} />
            <Route path="*" element={<Navigate to="/employee" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

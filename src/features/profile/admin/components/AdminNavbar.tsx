import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, LayoutDashboard } from "lucide-react";

interface AdminNavbarProps {
  activeTab: "profile" | "dashboard";
  onTabChange: (tab: "profile" | "dashboard") => void;
}

export const AdminNavbar = ({ activeTab, onTabChange }: AdminNavbarProps) => {
  const tabs = [
    {
      id: "profile" as const,
      label: "Profile",
      icon: User,
      description: "View and manage your profile",
    },
    {
      id: "dashboard" as const,
      label: "Dashboard",
      icon: LayoutDashboard,
      description: "View and manage admin dashboard",
    },
  ];

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <nav className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <Button
                key={tab.id}
                variant={isActive ? "default" : "ghost"}
                onClick={() => onTabChange(tab.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </Button>
            );
          })}
        </nav>
      </CardContent>
    </Card>
  );
};

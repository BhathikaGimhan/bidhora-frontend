import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, LayoutDashboard } from "lucide-react";

interface EmployeeNavbarProps {
  activeTab: "profile" | "dashboard";
  onTabChange: (tab: "profile" | "dashboard") => void;
}

export const EmployeeNavbar = ({ activeTab, onTabChange }: EmployeeNavbarProps) => {
  const tabs = [
    {
      id: "profile" as const,
      label: "Profile",
      icon: User,
      description: "View and edit your profile information",
    },
    {
      id: "dashboard" as const,
      label: "Dashboard",
      icon: LayoutDashboard,
      description: "View your work statistics",
    },
  ];

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() => onTabChange(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
            >
              <tab.icon className="w-4 h-4" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{tab.label}</span>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

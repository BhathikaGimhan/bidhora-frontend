import { useState, useEffect } from "react";
import { Project } from "@/features/admin/models/ProjectModel";
import { projectController } from "@/features/admin/controllers/projectController";
import { DataTable } from "@/features/admin/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProjectDetailsModal } from "@/features/admin/components/ProjectDetailsModal";
import LoadingSpinner from "@/components/ui/loading-spinner";

export function UrgentProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [adminPrice, setAdminPrice] = useState("");
  const [adminDuration, setAdminDuration] = useState("");
  const [adminDurationUnit, setAdminDurationUnit] = useState<"days" | "weeks">("days");
  const [adminNotes, setAdminNotes] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchUrgentProjects();
  }, []);

  const fetchUrgentProjects = async () => {
    try {
      setLoading(true);
      const allProjects = await projectController.getAllProjects();
      
      // 🔍 DEBUGGING: Log all projects
      console.log('📊 ALL PROJECTS (UrgentProjectsView):', allProjects.length);
      console.log('📋 All Projects Details:', allProjects.map(p => ({
        id: p.id,
        title: p.title,
        isUrgent: p.isUrgent,
        status: p.status
      })));
      
      // Filter only urgent projects
      const urgentProjects = allProjects.filter(
        (project) => project.isUrgent === true
      );
      
      // 🔍 DEBUGGING: Log filtered results
      console.log('⚠️  URGENT PROJECTS (filtered):', urgentProjects.length);
      console.log('⚠️  Urgent Projects Details:', urgentProjects.map(p => ({
        id: p.id,
        title: p.title,
        isUrgent: p.isUrgent,
        status: p.status
      })));
      
      setProjects(urgentProjects);
    } catch (error) {
      console.error("Error fetching urgent projects:", error);
      toast({
        title: "Error",
        description: "Failed to load urgent projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    try {
      setRefreshing(true);
      // Force cache clear
      (projectController as any)["isLoaded"] = false;
      await fetchUrgentProjects();
      toast({
        title: "Refreshed",
        description: "Urgent projects list updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh urgent projects",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedProject(null);
  };

  const handleOpenPricingModal = (project: Project) => {
    setSelectedProject(project);
    setAdminPrice("");
    setAdminDuration("");
    setAdminDurationUnit("days");
    setAdminNotes("");
    setIsPricingModalOpen(true);
  };

  const handleClosePricingModal = () => {
    setIsPricingModalOpen(false);
    setSelectedProject(null);
    setAdminPrice("");
    setAdminDuration("");
    setAdminDurationUnit("days");
    setAdminNotes("");
  };

  const handleSubmitPricing = async () => {
    if (!selectedProject) return;

    const price = parseFloat(adminPrice);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price greater than 0",
        variant: "destructive",
      });
      return;
    }

    const duration = adminDuration ? parseInt(adminDuration) : undefined;
    if (adminDuration && (isNaN(duration!) || duration! <= 0)) {
      toast({
        title: "Invalid Duration",
        description: "Please enter a valid duration greater than 0",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await projectController.adminReviewProject(
        selectedProject.id,
        price,
        duration,
        adminDurationUnit,
        adminNotes.trim() || undefined
      );

      if (result.success) {
        toast({
          title: "Project Reviewed",
          description: result.message,
        });
        handleClosePricingModal();
        await fetchUrgentProjects();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to review project";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "admin_review":
        return "secondary";
      case "priced":
        return "default";
      case "ready_to_assign":
        return "outline";
      case "customer_approved":
        return "outline";
      case "approved":
        return "outline";
      case "assigned":
        return "default";
      case "completed_by_employee":
        return "default";
      case "completed":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const columns = [
    {
      key: "title",
      title: "Project",
      sortable: true,
      render: (value: string, project: Project) => (
        <div className="max-w-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span className="font-medium truncate">{value}</span>
          </div>
          <div className="text-sm text-muted-foreground line-clamp-2 ml-6">
            {project.description}
          </div>
        </div>
      ),
    },
    {
      key: "clientName",
      title: "Client",
      sortable: true,
    },
    {
      key: "category",
      title: "Category",
      sortable: true,
      render: (value: string) => <Badge variant="outline">{value}</Badge>,
    },
    {
      key: "budget",
      title: "Client Budget",
      sortable: false,
      render: (value: { min: number; max: number }) =>
        `$${value.min.toLocaleString()} - $${value.max.toLocaleString()}`,
    },
    {
      key: "adminPrice",
      title: "Admin Price",
      sortable: true,
      render: (value: number) => (value ? `$${value.toLocaleString()}` : "-"),
    },
    {
      key: "status",
      title: "Status",
      sortable: true,
      render: (value: string) => (
        <Badge variant={getStatusColor(value)}>{value.replace("_", " ")}</Badge>
      ),
    },
    {
      key: "deadline",
      title: "Deadline",
      sortable: true,
      render: (value: string) => {
        const deadline = new Date(value);
        const now = new Date();
        const isOverdue = deadline < now;
        return (
          <span className={isOverdue ? "text-red-500 font-medium" : ""}>
            {deadline.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      key: "createdDate",
      title: "Created",
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  const actions = (project: Project) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleViewDetails(project)}>
          View Details
        </DropdownMenuItem>
        {(project.status === "pending" || project.status === "admin_review") && (
          <DropdownMenuItem onClick={() => handleOpenPricingModal(project)}>
            Set Price
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            Urgent Projects
          </h2>
          <p className="text-muted-foreground">
            High-priority projects requiring immediate attention
          </p>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="font-medium">
            {projects.length > 0
              ? `${projects.length} urgent project${projects.length > 1 ? "s" : ""} need${projects.length === 1 ? "s" : ""} your attention`
              : "No urgent projects at the moment"}
          </p>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Urgent Projects Table */}
      <DataTable
        title=""
        data={projects}
        columns={columns}
        searchPlaceholder="Search urgent projects..."
        actions={actions}
      />

      {/* Project Details Modal */}
      <ProjectDetailsModal
        project={selectedProject}
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
      />

      {/* Set Price Modal */}
      <Dialog open={isPricingModalOpen} onOpenChange={handleClosePricingModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set Project Price</DialogTitle>
            <DialogDescription>
              Review the project details and set an appropriate price for{" "}
              {selectedProject?.title}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price ($)
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={adminPrice}
                onChange={(e) => setAdminPrice(e.target.value)}
                className="col-span-3"
                placeholder="Enter price"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                Duration
              </Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={adminDuration}
                  onChange={(e) => setAdminDuration(e.target.value)}
                  placeholder="Enter duration"
                  className="flex-1"
                />
                <select
                  value={adminDurationUnit}
                  onChange={(e) =>
                    setAdminDurationUnit(e.target.value as "days" | "weeks")
                  }
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right pt-2">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="col-span-3"
                placeholder="Optional notes for the customer..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClosePricingModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmitPricing} disabled={!adminPrice.trim()}>
              Set Price
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

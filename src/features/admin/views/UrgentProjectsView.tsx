import { useState, useEffect } from "react";
import { Project } from "@/features/admin/models/ProjectModel";
import { projectController } from "@/features/admin/controllers/projectController";
import { DataTable } from "@/features/admin/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MoreHorizontal, RefreshCw, AlertCircle, UserCheck, Eye, DollarSign, CheckCircle, FolderOpen, Clock, CheckCircle2, Loader2, ChevronDown, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProjectDetailsModal } from "@/features/admin/components/ProjectDetailsModal";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { getAllUsers } from "@/Services/authService";
import { assignEmployeeToProject } from "@/Services/projectService";
import { emailService } from "@/Services/emailService";
import { getApprovedPartsTotalsForProjects, ApprovedPartsInfo } from "@/Services/partSubmissionService";

export function UrgentProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Store approved parts totals for each project (total amount and count of parts)
  const [approvedPartsTotals, setApprovedPartsTotals] = useState<Map<string, ApprovedPartsInfo>>(new Map());
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  // adminPrice removed as part of simplified flow - parts are priced individually
  const [adminDuration, setAdminDuration] = useState<number>(0);
  const [adminDurationUnit, setAdminDurationUnit] = useState<string>("days");
  const [adminNotes, setAdminNotes] = useState("");
  const [employees, setEmployees] = useState<Array<{
    uid: string;
    name: string;
    email: string;
    role: string;
    designation?: string;
  }>>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [assigningEmployee, setAssigningEmployee] = useState(false);
  const [submittingPrice, setSubmittingPrice] = useState(false);
  const [employeePopoverOpen, setEmployeePopoverOpen] = useState(false);
  const { toast } = useToast();

  const fetchEmployees = async () => {
    try {
      const response = await getAllUsers();
      const employeeUsers = response.users.filter(
        (user) => user.role === "employee"
      );
      setEmployees(employeeUsers);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    }
  };

  const getSelectedEmployeeDisplay = () => {
    const selectedEmployee = employees.find(emp => emp.uid === selectedEmployeeId);
    if (selectedEmployee) {
      return `${selectedEmployee.name}${selectedEmployee.designation ? ` (${selectedEmployee.designation})` : ''}`;
    }
    return "Select an employee";
  };

  useEffect(() => {
    fetchUrgentProjects();
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Fetch approved parts totals for all urgent projects
      if (urgentProjects.length > 0) {
        const projectIds = urgentProjects.map(p => p.id);
        const totals = await getApprovedPartsTotalsForProjects(projectIds);
        setApprovedPartsTotals(totals);
      }
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    setAdminDuration(0);
    setAdminDurationUnit("days");
    setAdminNotes("");
    setIsPricingModalOpen(true);
  };

  const handleClosePricingModal = () => {
    setIsPricingModalOpen(false);
    setSelectedProject(null);
    setAdminDuration(0);
    setAdminDurationUnit("days");
    setAdminNotes("");
  };

  const handleSubmitPricing = async () => {
    if (!selectedProject) return;

    // Note: Price is no longer required for initial approval
    // The simplified flow uses a fixed 1500 RS deposit
    // Parts will be priced individually later when employee submits work

    try {
      setSubmittingPrice(true);
      const result = await projectController.adminReviewProject(
        selectedProject.id,
        undefined, // adminPrice is now optional - parts are priced individually
        adminDuration > 0 ? adminDuration : undefined, // duration is optional but encouraged
        adminDuration > 0 ? (adminDurationUnit as "days" | "weeks") : undefined,
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
          description: result.message || "Failed to set price. Please ensure the project is in pending or admin review status.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to review project. Please ensure the project is in the correct status.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmittingPrice(false);
    }
  };

  const handleOpenAssignModal = (project: Project) => {
    setSelectedProject(project);
    setSelectedEmployeeId("");
    setIsAssignModalOpen(true);
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedProject(null);
    setSelectedEmployeeId("");
    setEmployeePopoverOpen(false);
  };

  const handleAssignEmployee = async () => {
    if (!selectedProject || !selectedEmployeeId) {
      toast({
        title: "Error",
        description: "Please select an employee",
        variant: "destructive",
      });
      return;
    }

    const selectedEmployee = employees.find(
      (emp) => emp.uid === selectedEmployeeId
    );
    
    if (!selectedEmployee) {
      toast({
        title: "Error",
        description: "Employee not found",
        variant: "destructive",
      });
      return;
    }

    try {
      setAssigningEmployee(true);
      await assignEmployeeToProject(
        selectedProject.id, 
        selectedEmployeeId,
        selectedEmployee.name,
        selectedEmployee.email
      );
      
      // Send email notification to employee with URGENT flag
      const emailResult = await emailService.sendEmployeeAssignmentNotification({
        employeeEmail: selectedEmployee.email,
        employeeName: selectedEmployee.name,
        projectTitle: `🚨 URGENT: ${selectedProject.title}`,
        projectDescription: selectedProject.description || "",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        projectPrice: (selectedProject as any).adminPrice || 0,
        projectId: selectedProject.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        buyerEmail: (selectedProject as any).buyerEmail || "",
        isUrgent: true,
      });

      if (!emailResult.success) {
        console.error("Email notification failed:", emailResult.message);
        toast({
          title: "⚠️ Partial Success",
          description: `Employee assigned but email notification failed: ${emailResult.message}`,
          variant: "default",
        });
      } else {
        toast({
          title: "Success",
          description: "Employee assigned to urgent project and notified via email.",
        });
      }
      
      handleCloseAssignModal();
      await fetchUrgentProjects();
    } catch (error) {
      console.error("Error assigning employee:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign employee",
        variant: "destructive",
      });
    } finally {
      setAssigningEmployee(false);
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
      case "in_progress":
        return "default";
      case "completed_by_employee":
        return "default";
      case "awaiting_final_payment":
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
      key: "id",
      title: "Project ID",
      sortable: true,
      render: (value: string) => (
        <span className="font-mono text-xs text-muted-foreground">{value}</span>
      ),
    },
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
        `LKR ${value.min.toLocaleString()} - LKR ${value.max.toLocaleString()}`,
    },
    {
      key: "adminPrice",
      title: "Price (LKR)",
      sortable: true,
      render: (value: number, project: Project) => {
        const partsInfo = approvedPartsTotals.get(project.id);
        const hasLegacyPrice = value && value > 0;
        const hasPartsTotal = partsInfo && partsInfo.total > 0;
        
        if (hasPartsTotal && hasLegacyPrice) {
          // Show both legacy admin price and parts total
          return (
            <div className="flex flex-col gap-1">
              <div className="flex flex-col">
                <span className="font-semibold text-green-600">LKR {partsInfo.total.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">{partsInfo.count} approved part{partsInfo.count > 1 ? 's' : ''}</span>
              </div>
              <div className="flex flex-col border-t pt-1">
                <span className="text-sm text-blue-600">LKR {value.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">Legacy price</span>
              </div>
            </div>
          );
        } else if (hasPartsTotal) {
          // Only parts total
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-green-600">LKR {partsInfo.total.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">{partsInfo.count} approved part{partsInfo.count > 1 ? 's' : ''}</span>
            </div>
          );
        } else if (hasLegacyPrice) {
          // Only legacy admin price
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-blue-600">LKR {value.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">Admin price</span>
            </div>
          );
        }
        return <span className="text-muted-foreground">-</span>;
      },
    },
    {
      key: "assignedEmployeeName",
      title: "Assigned Employee",
      sortable: true,
      render: (value: string) => value || <span className="text-muted-foreground">Not assigned</span>,
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
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        {(project.status === "pending" || project.status === "admin_review") && (
          <DropdownMenuItem onClick={() => handleOpenPricingModal(project)}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Approve Project
          </DropdownMenuItem>
        )}
        {(project.status === "ready_to_assign" || project.status === "customer_approved") && (
          <DropdownMenuItem onClick={() => handleOpenAssignModal(project)}>
            <UserCheck className="mr-2 h-4 w-4" />
            Assign Employee
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

  // Filter projects by status for tabs
  const pendingProjects = projects.filter(
    (p) => p.status === "pending" || p.status === "admin_review"
  );
  const pricedProjects = projects.filter(
    (p) => p.status === "priced"
  );
  const readyToAssignProjects = projects.filter(
    (p) => p.status === "ready_to_assign" || p.status === "customer_approved"
  );
  const assignedProjects = projects.filter(
    (p) => p.status === "assigned"
  );
  // In progress includes both 'in_progress' (employee working) and 'completed_by_employee' (submitted for review)
  const inProgressProjects = projects.filter(
    (p) => p.status === "in_progress" || p.status === "completed_by_employee"
  );
  // Awaiting final payment (admin approved, waiting for buyer to pay)
  const awaitingPaymentProjects = projects.filter(
    (p) => p.status === "awaiting_final_payment"
  );
  const completedProjects = projects.filter(
    (p) => p.status === "completed"
  );

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

      {/* Tabbed View for Different Statuses */}
      <Tabs defaultValue="pending" className="space-y-4">
        <div className="w-full overflow-x-auto pb-2">
          <TabsList className="inline-flex w-auto min-w-full">
          <TabsTrigger value="pending" className="flex items-center gap-2 whitespace-nowrap">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Pending Review</span>
            <span className="sm:hidden">Pending</span>
            {pendingProjects.length > 0 && (
              <Badge variant="default" className="ml-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md hover:from-orange-600 hover:to-orange-700 transition-all">
                {pendingProjects.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="priced" className="flex items-center gap-2 whitespace-nowrap">
            <DollarSign className="h-4 w-4" />
            <span>Priced</span>
            {pricedProjects.length > 0 && (
              <Badge variant="default" className="ml-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:from-blue-600 hover:to-blue-700 transition-all">
                {pricedProjects.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ready_to_assign" className="flex items-center gap-2 whitespace-nowrap">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Ready to Assign</span>
            <span className="sm:hidden">Ready</span>
            {readyToAssignProjects.length > 0 && (
              <Badge variant="default" className="ml-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md hover:from-emerald-600 hover:to-emerald-700 transition-all">
                {readyToAssignProjects.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="assigned" className="flex items-center gap-2 whitespace-nowrap">
            <UserCheck className="h-4 w-4" />
            <span>Assigned</span>
            {assignedProjects.length > 0 && (
              <Badge variant="default" className="ml-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md hover:from-purple-600 hover:to-purple-700 transition-all">
                {assignedProjects.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="flex items-center gap-2 whitespace-nowrap">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">In Progress</span>
            <span className="sm:hidden">Progress</span>
            {inProgressProjects.length > 0 && (
              <Badge variant="default" className="ml-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-md hover:from-yellow-600 hover:to-yellow-700 transition-all">
                {inProgressProjects.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="awaiting_payment" className="flex items-center gap-2 whitespace-nowrap">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Awaiting Payment</span>
            <span className="sm:hidden">Payment</span>
            {awaitingPaymentProjects.length > 0 && (
              <Badge variant="default" className="ml-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md hover:from-amber-600 hover:to-amber-700 transition-all">
                {awaitingPaymentProjects.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2 whitespace-nowrap">
            <CheckCircle2 className="h-4 w-4" />
            <span>Completed</span>
            {completedProjects.length > 0 && (
              <Badge variant="default" className="ml-1 bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md hover:from-green-600 hover:to-green-700 transition-all">
                {completedProjects.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        </div>

        {/* Pending Review Tab */}
        <TabsContent value="pending" className="space-y-4">
          <DataTable
            title="Pending Review"
            data={pendingProjects}
            columns={columns}
            searchPlaceholder="Search pending urgent projects..."
            actions={actions}
          />
        </TabsContent>

        {/* Priced Tab */}
        <TabsContent value="priced" className="space-y-4">
          <DataTable
            title="Priced - Awaiting Customer Payment"
            data={pricedProjects}
            columns={columns}
            searchPlaceholder="Search priced urgent projects..."
            actions={actions}
          />
        </TabsContent>

        {/* Ready to Assign Tab */}
        <TabsContent value="ready_to_assign" className="space-y-4">
          <DataTable
            title="Ready to Assign Employee"
            data={readyToAssignProjects}
            columns={columns}
            searchPlaceholder="Search projects ready to assign..."
            actions={actions}
          />
        </TabsContent>

        {/* Assigned Tab */}
        <TabsContent value="assigned" className="space-y-4">
          <DataTable
            title="Assigned to Employee"
            data={assignedProjects}
            columns={columns}
            searchPlaceholder="Search assigned urgent projects..."
            actions={actions}
          />
        </TabsContent>

        {/* In Progress Tab */}
        <TabsContent value="in_progress" className="space-y-4">
          <DataTable
            title="In Progress - Employee Working / Submitted for Review"
            data={inProgressProjects}
            columns={columns}
            searchPlaceholder="Search in-progress urgent projects..."
            actions={actions}
          />
        </TabsContent>

        {/* Awaiting Payment Tab */}
        <TabsContent value="awaiting_payment" className="space-y-4">
          <DataTable
            title="Awaiting Final Payment - Approved, Waiting for Buyer Payment"
            data={awaitingPaymentProjects}
            columns={columns}
            searchPlaceholder="Search projects awaiting payment..."
            actions={actions}
          />
        </TabsContent>

        {/* Completed Tab */}
        <TabsContent value="completed" className="space-y-4">
          <DataTable
            title="Completed Urgent Projects"
            data={completedProjects}
            columns={columns}
            searchPlaceholder="Search completed urgent projects..."
            actions={actions}
          />
        </TabsContent>
      </Tabs>

      {/* Project Details Modal */}
      <ProjectDetailsModal
        project={selectedProject}
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
      />

      {/* Approve & Set Duration Modal - Simplified flow with fixed 1500 RS deposit */}
      <Dialog open={isPricingModalOpen} onOpenChange={handleClosePricingModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Approve Urgent Project
            </DialogTitle>
            <DialogDescription className="text-sm">
              Approve this urgent project for{" "}
              <span className="font-semibold">{selectedProject?.title}</span>.
              A fixed deposit of <strong>LKR 1,500</strong> will be charged to the customer.
              Parts will be priced individually when the employee submits work.
            </DialogDescription>
          </DialogHeader>
          
          {/* Info Box about the new flow */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>🚨 Priority Flow:</strong> Urgent projects follow the part-based payment system.
              The customer pays a fixed <strong>LKR 1,500</strong> deposit first.
              Each part submission will be priced and paid separately when approved.
            </p>
          </div>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
              <Label htmlFor="duration" className="sm:text-right">
                Duration
              </Label>
              <div className="sm:col-span-3 flex gap-2">
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={adminDuration || ""}
                  onChange={(e) => setAdminDuration(parseInt(e.target.value) || 0)}
                  placeholder="Enter estimated duration"
                  className="flex-1"
                />
                <select
                  value={adminDurationUnit}
                  onChange={(e) => setAdminDurationUnit(e.target.value)}
                  className="px-2 sm:px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
              <Label htmlFor="notes" className="sm:text-right sm:pt-2">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="sm:col-span-3"
                placeholder="Optional notes for the customer..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleClosePricingModal} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitPricing} 
              disabled={submittingPrice}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
            >
              {submittingPrice ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                "Approve Urgent Project"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Employee Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={handleCloseAssignModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
              <span className="line-clamp-2">Assign Employee to Urgent Project</span>
            </DialogTitle>
            <DialogDescription className="text-sm">
              This is a high-priority urgent project. Select an employee to assign to{" "}
              <span className="font-semibold">{selectedProject?.title}</span>.
              The employee will be notified via email immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="employee" className="text-sm sm:text-base">
                Select Employee
              </Label>
              <Popover open={employeePopoverOpen} onOpenChange={setEmployeePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={employeePopoverOpen}
                    className="w-full justify-between text-sm h-auto min-h-[40px]"
                  >
                    <span className="truncate text-left flex-1 mr-2">{getSelectedEmployeeDisplay()}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[--radix-popover-trigger-width] max-w-[90vw] p-0" 
                  align="start"
                  side="bottom"
                  sideOffset={4}
                  collisionPadding={10}
                  onWheel={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Command>
                    <CommandInput placeholder="Search employees..." className="text-sm" />
                    <CommandEmpty className="text-sm">No employees found.</CommandEmpty>
                    <CommandGroup 
                      className="max-h-[40vh] overflow-y-auto"
                      onWheel={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      {employees.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          No employees available
                        </div>
                      ) : (
                        employees.map((employee) => (
                          <CommandItem
                            key={employee.uid}
                            value={`${employee.name} ${employee.email} ${employee.designation || ''}`}
                            onSelect={() => {
                              setSelectedEmployeeId(employee.uid);
                              setEmployeePopoverOpen(false);
                            }}
                            className="cursor-pointer"
                          >
                            <div className="flex flex-col w-full gap-1 py-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm break-words">{employee.name}</span>
                                {employee.designation && (
                                  <Badge variant="secondary" className="text-xs shrink-0">
                                    {employee.designation}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground break-all">{employee.email}</span>
                            </div>
                          </CommandItem>
                        ))
                      )}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {selectedProject && (
              <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-xs sm:text-sm text-red-700 dark:text-red-400">
                  <strong>⚠️ Priority Notice:</strong> This urgent project requires immediate attention. 
                  The assigned employee will receive an email marked as URGENT.
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleCloseAssignModal}
              disabled={assigningEmployee}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignEmployee}
              disabled={!selectedEmployeeId || assigningEmployee}
              className="w-full sm:w-auto"
            >
              {assigningEmployee ? "Assigning..." : "Assign Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

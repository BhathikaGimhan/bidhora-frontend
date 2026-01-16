import { useState, useEffect } from "react";
import { DataTable } from "@/features/admin/components/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreHorizontal, Eye, DollarSign, CheckCircle, X, UserCheck, FolderOpen, Clock, CheckCircle2, RefreshCw, Loader2, ChevronDown } from "lucide-react";
import { Project } from "@/features/admin/models/ProjectModel";
import { useToast } from "@/hooks/use-toast";
import { projectController } from "@/features/admin/controllers/projectController";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { ProjectDetailsModal } from "@/features/admin/components/ProjectDetailsModal";
import { getAllUsers } from "@/Services/authService";
import { assignEmployeeToProject } from "@/Services/projectService";
import { emailService } from "@/Services/emailService";
import { adminActivityService } from "@/Services/adminActivityService";

export function ProjectReviewView() {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  // adminPrice removed as part of simplified flow, but duration is still needed
  const [adminDuration, setAdminDuration] = useState<number>(0);
  const [adminDurationUnit, setAdminDurationUnit] = useState<string>("days");
  const [adminNotes, setAdminNotes] = useState<string>("");
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

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const projects = await projectController.getAllProjects();
      
      // 🔍 DEBUGGING: Log all projects
      console.log('📊 ALL PROJECTS (ProjectReviewView):', projects.length);
      console.log('📋 All Projects Details:', projects.map(p => ({
        id: p.id,
        title: p.title,
        isUrgent: p.isUrgent,
        status: p.status
      })));
      
      setAllProjects(projects);
    } catch (error: unknown) {
      console.error("Projects fetch error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch projects";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    try {
      setRefreshing(true);
      // Force reload by clearing cache
      projectController['isLoaded'] = false;
      const projects = await projectController.getAllProjects();
      setAllProjects(projects);
      toast({
        title: "Refreshed",
        description: "Projects list updated successfully",
      });
    } catch (error: unknown) {
      console.error("Refresh error:", error);
      toast({
        title: "Error",
        description: "Failed to refresh projects",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

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
    return "Choose an employee...";
  };

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setAdminNotes("");
    setIsPricingModalOpen(true);
  };

  const handleClosePricingModal = () => {
    setIsPricingModalOpen(false);
    setSelectedProject(null);
    setAdminNotes("");
    setAdminDuration(0);
    setAdminDurationUnit("days");
  };

  const handleSubmitPricing = async () => {
    if (!selectedProject) return;

    // Note: Price and duration are no longer required for initial approval
    // The simplified flow uses a fixed 1500 RS deposit
    // Parts will be priced individually later

    try {
      setSubmittingPrice(true);
      const result = await projectController.adminReviewProject(
        selectedProject.id,
        undefined, // adminPrice is now optional
        adminDuration > 0 ? adminDuration : undefined, // duration is optional but encouraged
        adminDuration > 0 ? adminDurationUnit : undefined,
        adminNotes.trim() || undefined
      );

      if (result.success) {
        // Log activity
        await adminActivityService.logProjectAction(
          'Reviewed Project',
          selectedProject.id,
          selectedProject.title,
          `Approved project. Fixed deposit 1500 RS applies.`
        );
        
        toast({
          title: "Project Reviewed",
          description: result.message,
        });
        handleClosePricingModal();
        await fetchProjects(); // Refresh the data
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

    // Find the selected employee details
    const selectedEmployee = employees.find(emp => emp.uid === selectedEmployeeId);
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
      
      // Log activity
      await adminActivityService.logProjectAction(
        'Assigned Employee',
        selectedProject.id,
        selectedProject.title,
        `Assigned ${selectedEmployee.name} (${selectedEmployee.email}) to project`
      );
      
      // Send email notification to employee
      const emailResult = await emailService.sendEmployeeAssignmentNotification({
        employeeEmail: selectedEmployee.email,
        employeeName: selectedEmployee.name,
        projectTitle: selectedProject.title,
        projectDescription: selectedProject.description || "",
        projectPrice: (selectedProject as any).adminPrice || 0,
        projectId: selectedProject.id,
        buyerEmail: (selectedProject as any).buyerEmail || "",
        projectLink: `${window.location.origin}/employee/projects`, // Link to employee's projects page
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
          description: "Employee assigned successfully and notified via email.",
        });
      }
      
      handleCloseAssignModal();
      await fetchProjects();
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
          <div className="font-medium truncate">{value}</div>
          <div className="text-sm text-muted-foreground line-clamp-2">
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
      title: "Admin Price (LKR)",
      sortable: true,
      render: (value: number) => (value ? `LKR ${value.toLocaleString()}` : "-"),
    },
    {
      key: "adminDuration",
      title: "Duration",
      sortable: true,
      render: (value: number, project: Project) => {
        if (value && project.adminDurationUnit) {
          return `${value} ${project.adminDurationUnit}`;
        }
        return "-";
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
      render: (value: string) => new Date(value).toLocaleDateString(),
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
        {(project.status === "pending" ||
          project.status === "admin_review") && (
          <DropdownMenuItem onClick={() => handleOpenPricingModal(project)}>
            <DollarSign className="mr-2 h-4 w-4" />
            Set Price
          </DropdownMenuItem>
        )}
        {project.status === "ready_to_assign" && 
         !project.assignedEmployeeId && (
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

  // Filter projects by status (exclude urgent projects - they have their own section)
  // Note: undefined or false isUrgent values are treated as non-urgent
  const pendingProjects = allProjects.filter(
    (p) => p.isUrgent !== true && (p.status === "pending" || p.status === "admin_review" || p.status === "priced")
  );
  const readyToAssignProjects = allProjects.filter((p) => p.isUrgent !== true && p.status === "ready_to_assign");
  const assignedProjects = allProjects.filter((p) => p.isUrgent !== true && p.status === "assigned");
  const completedProjects = allProjects.filter((p) => p.isUrgent !== true && p.status === "completed");

  // 🔍 DEBUGGING: Log filtered projects
  console.log('🔵 PROJECT REVIEW FILTERING:');
  console.log('  Pending Projects (not urgent):', pendingProjects.length, pendingProjects.map(p => p.title));
  console.log('  Ready to Assign (not urgent):', readyToAssignProjects.length, readyToAssignProjects.map(p => p.title));
  console.log('  Assigned (not urgent):', assignedProjects.length, assignedProjects.map(p => p.title));
  console.log('  Completed (not urgent):', completedProjects.length, completedProjects.map(p => p.title));
  console.log('  Total in Project Review:', pendingProjects.length + readyToAssignProjects.length + assignedProjects.length + completedProjects.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Project Management</h2>
          <p className="text-muted-foreground">Manage and review all projects</p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <div className="w-full overflow-x-auto pb-2">
          <TabsList className="inline-flex w-auto min-w-full">
          <TabsTrigger value="pending" className="flex items-center gap-2 whitespace-nowrap">
            <Clock className="h-4 w-4" />
            <span>Pending</span>
            {pendingProjects.length > 0 && (
              <Badge variant="default" className="ml-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md hover:from-orange-600 hover:to-orange-700 transition-all">
                {pendingProjects.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ready" className="flex items-center gap-2 whitespace-nowrap">
            <UserCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Ready to Assign</span>
            <span className="sm:hidden">Ready</span>
            {readyToAssignProjects.length > 0 && (
              <Badge variant="default" className="ml-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md hover:from-emerald-600 hover:to-emerald-700 transition-all">
                {readyToAssignProjects.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="assigned" className="flex items-center gap-2 whitespace-nowrap">
            <FolderOpen className="h-4 w-4" />
            <span>Assigned</span>
            {assignedProjects.length > 0 && (
              <Badge variant="default" className="ml-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md hover:from-purple-600 hover:to-purple-700 transition-all">
                {assignedProjects.length}
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

        <TabsContent value="pending" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          <DataTable
            title=""
            data={pendingProjects}
            columns={columns}
            searchPlaceholder="Search pending projects..."
            actions={actions}
          />
        </TabsContent>

        <TabsContent value="ready" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <UserCheck className="h-5 w-5" />
              <p className="font-medium">Projects with confirmed payment awaiting employee assignment</p>
            </div>
          </div>
          <DataTable
            title=""
            data={readyToAssignProjects}
            columns={columns}
            searchPlaceholder="Search ready to assign projects..."
            actions={actions}
          />
        </TabsContent>

        <TabsContent value="assigned" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          <DataTable
            title=""
            data={assignedProjects}
            columns={columns}
            searchPlaceholder="Search assigned projects..."
            actions={actions}
          />
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          <DataTable
            title=""
            data={completedProjects}
            columns={columns}
            searchPlaceholder="Search completed projects..."
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

      {/* Pricing Modal */}
      <Dialog open={isPricingModalOpen} onOpenChange={handleClosePricingModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set Project Price</DialogTitle>
            <DialogDescription>
              Review the project details and approve for deposit payment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-span-4 text-sm text-muted-foreground bg-muted p-3 rounded-md">
                <p><strong>Note:</strong> Approving this project will automatically set a fixed deposit of <strong>1,500 LKR</strong>.</p>
                <p className="mt-1">The buyer will be notified to make this payment to start the project.</p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                Duration *
              </Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={adminDuration || ""}
                  onChange={(e) => setAdminDuration(Number(e.target.value))}
                  className="flex-1"
                  placeholder="e.g. 7"
                />
                <Select value={adminDurationUnit} onValueChange={setAdminDurationUnit}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                  </SelectContent>
                </Select>
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
            <Button 
              onClick={handleSubmitPricing} 
              disabled={submittingPrice}
            >
              {submittingPrice ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                "Approve Project"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Employee Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={handleCloseAssignModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Assign Employee to Project</DialogTitle>
            <DialogDescription className="text-sm">
              Select an employee to work on <span className="font-semibold">"{selectedProject?.title}"</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedProject && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Project Value:</span>
                    <span className="font-semibold">
                                          <div>
                      <div className="text-xs text-muted-foreground">Price (LKR)</div>
                      <div className="font-medium">
                      LKR {(selectedProject as any).adminPrice?.toFixed(2)}
                      </div>
                    </div>
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment Status:</span>
                    <Badge variant="default" className="bg-green-600">
                      ✅ Fixed Deposit Paid
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee" className="text-sm sm:text-base">Select Employee</Label>
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
                  <p className="text-xs text-muted-foreground">
                    The selected employee will receive an email notification with project details.
                  </p>
                </div>
              </>
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
              disabled={!selectedEmployeeId || assigningEmployee || employees.length === 0}
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

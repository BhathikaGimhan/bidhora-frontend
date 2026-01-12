import { useState, useEffect } from "react";
import { DataTable } from "@/features/admin/components/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  CheckCircle,
  X,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Project } from "@/features/admin/models/ProjectModel";
import { useToast } from "@/hooks/use-toast";
import { projectController } from "@/features/admin/controllers/projectController";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { ProjectDetailsModal } from "@/features/admin/components/ProjectDetailsModal";

export function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const allProjects = await projectController.getAllProjects();
      setProjects(allProjects);
      setFilteredProjects(allProjects);
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

  useEffect(() => {
    fetchProjects();
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

  const handleSearch = (query: string) => {
    if (query.trim() === "") {
      setFilteredProjects(projects);
    } else {
      const lowercaseQuery = query.toLowerCase();
      const filtered = projects.filter(
        (project) =>
          project.title.toLowerCase().includes(lowercaseQuery) ||
          project.category.toLowerCase().includes(lowercaseQuery) ||
          project.clientName.toLowerCase().includes(lowercaseQuery)
      );
      setFilteredProjects(filtered);
    }
  };

  const handleStatusChange = async (
    projectId: string,
    newStatus: Project["status"]
  ) => {
    try {
      await projectController.updateProjectStatus(projectId, newStatus);
      await fetchProjects(); // Refresh the data
      toast({
        title: "Project Updated",
        description: `Project status changed to ${newStatus}`,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update project status";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await projectController.deleteProject(projectId);
      await fetchProjects(); // Refresh the data
      toast({
        title: "Project Deleted",
        description: "Project has been permanently deleted",
        variant: "destructive",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete project";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "active":
        return "default";
      case "pending":
        return "secondary";
      case "completed":
        return "outline";
      case "rejected":
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
        <div>
          <div className="font-medium">{value}</div>
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
      title: "Budget",
      sortable: false,
      render: (value: { min: number; max: number }) =>
        `$${value.min.toLocaleString()} - $${value.max.toLocaleString()}`,
    },
    {
      key: "status",
      title: "Status",
      sortable: true,
      render: (value: string) => (
        <Badge variant={getStatusColor(value)}>{value}</Badge>
      ),
    },
    {
      key: "isUrgent",
      title: "Urgent",
      sortable: true,
      render: (value: boolean) =>
        value ? (
          <Badge
            variant="destructive"
            className="flex items-center space-x-1 w-fit"
          >
            <AlertCircle className="h-3 w-3" />
            <span>Urgent</span>
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
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
        {project.status === "pending" && (
          <>
            <DropdownMenuItem
              onClick={() => handleStatusChange(project.id, "approved")}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusChange(project.id, "rejected")}
            >
              <X className="mr-2 h-4 w-4" />
              Reject
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem
          onClick={() => handleDeleteProject(project.id)}
          className="text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Project
        </DropdownMenuItem>
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
    <div className="space-y-6">
      <DataTable
        title="Projects Management"
        data={filteredProjects}
        columns={columns}
        searchPlaceholder="Search projects..."
        onSearch={handleSearch}
        actions={actions}
      />

      <ProjectDetailsModal
        project={selectedProject}
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
      />
    </div>
  );
}

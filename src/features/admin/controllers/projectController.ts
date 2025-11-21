import { Project, ProjectStats } from "@/features/admin/models/ProjectModel";
import {
  getProjectsWithUserDetails,
  getUserDetails,
  adminReviewProject,
  getPendingAdminReviewProjects,
  getPricedProjects,
  updateProjectStatus,
} from "@/Services/projectService";

// Mock data for fallback
const mockProjects: Project[] = [
  {
    id: "1",
    title: "E-commerce Website Development",
    description: "Need a modern e-commerce website with React and Node.js",
    status: "completed",
    clientId: "2",
    clientName: "Michael Chen",
    budget: { min: 1500, max: 3000 },
    deadline: "2024-10-15",
    createdDate: "2024-09-01",
    category: "Web Development",
    skillsRequired: ["React", "Node.js", "MongoDB"],
    featured: true,
  },
  {
    id: "2",
    title: "Mobile App UI/UX Design",
    description: "Design a modern mobile app interface for iOS and Android",
    status: "pending",
    clientId: "5",
    clientName: "Tech Startup Inc",
    budget: { min: 800, max: 1500 },
    deadline: "2024-10-30",
    createdDate: "2024-09-15",
    category: "Design",
    skillsRequired: ["Figma", "UI/UX", "Mobile Design"],
    featured: false,
  },
  {
    id: "3",
    title: "Content Writing for Blog",
    description: "Need 10 SEO-optimized blog posts for tech company",
    status: "completed",
    clientId: "6",
    clientName: "Digital Agency",
    budget: { min: 500, max: 800 },
    deadline: "2024-09-30",
    createdDate: "2024-08-15",
    category: "Writing",
    skillsRequired: ["Content Writing", "SEO", "Research"],
    featured: false,
  },
];

class ProjectController {
  private projects: Project[] = [];
  private isLoaded: boolean = false;

  // Load real projects from Firestore
  private async loadProjects(): Promise<void> {
    if (this.isLoaded) return;

    try {
      const firestoreProjects = await getProjectsWithUserDetails();

      // Transform Firestore data to admin Project model format
      this.projects = firestoreProjects.map((project) => ({
        id: project.id,
        title: project.title,
        description: project.description,
        status: this.mapProjectStatus(project.status),
        clientId: project.createdBy || project.buyerEmail || project.id, // Use buyerEmail as fallback
        clientName:
          project.poster?.displayName ||
          project.buyerEmail ||
          project.poster?.email ||
          (project.createdBy ? `User: ${project.createdBy}` : "Unknown Client"), // Show user ID with label or Unknown Client if no ID
        budget: {
          min: project.budgetMin || 0,
          max: project.budgetMax || project.budgetMin || 0,
        },
        adminPrice: project.adminPrice,
        adminDuration: project.adminDuration,
        adminDurationUnit: project.adminDurationUnit,
        deadline: project.deadline.toISOString().split("T")[0], // Convert to YYYY-MM-DD format
        createdDate: project.createdAt.toISOString().split("T")[0],
        category: project.category || "General",
        skillsRequired: project.skills || [],
        featured: false, // Default to false since not in Firestore data
        isUrgent: project.isUrgent || false, // Include isUrgent field
        assignedEmployeeId: project.assignedEmployeeId,
        assignedEmployeeName: project.assignedEmployeeName,
        assignedEmployeeEmail: project.assignedEmployeeEmail,
        assignedAt: project.assignedAt && project.assignedAt instanceof Date 
          ? project.assignedAt.toISOString() 
          : undefined,
        documents: project.documents?.map(doc => ({
          ...doc,
          uploadedAt: doc.uploadedAt instanceof Date ? doc.uploadedAt.toISOString() : doc.uploadedAt
        })) || [], // Include buyer's uploaded documents with proper type conversion
      }));

      this.isLoaded = true;
    } catch (error) {
      console.error("Error loading projects from Firestore:", error);
      // Fallback to mock data if Firestore fails
      this.projects = mockProjects;
      this.isLoaded = true;
    }
  }

  // Map Firestore project status to admin model status
  private mapProjectStatus(firestoreStatus?: string): Project["status"] {
    switch (firestoreStatus) {
      case "pending":
        return "pending";
      case "admin_review":
        return "admin_review";
      case "priced":
        return "priced";
      case "ready_to_assign":
        return "ready_to_assign";
      case "customer_approved":
        return "customer_approved";
      case "approved":
        return "approved";
      case "assigned":
        return "assigned";
      case "completed_by_employee":
        return "completed_by_employee";
      case "completed":
        return "completed";
      case "cancelled":
        return "cancelled";
      default:
        return "pending";
    }
  }

  async getAllProjects(): Promise<Project[]> {
    await this.loadProjects();
    return this.projects;
  }

  async getProjectById(id: string): Promise<Project | undefined> {
    await this.loadProjects();
    return this.projects.find((project) => project.id === id);
  }

  async getProjectStats(): Promise<ProjectStats> {
    await this.loadProjects();
    return {
      totalProjects: this.projects.length,
      activeProjects: this.projects.filter((p) =>
        ["approved", "assigned", "completed_by_employee"].includes(p.status)
      ).length,
      pendingApproval: this.projects.filter((p) =>
        ["pending", "admin_review", "priced", "customer_approved"].includes(
          p.status
        )
      ).length,
      completedProjects: this.projects.filter((p) => p.status === "completed")
        .length,
    };
  }

  async updateProjectStatus(
    id: string,
    status: Project["status"]
  ): Promise<boolean> {
    try {
      await updateProjectStatus(id, status as any);
      // Reload projects to get updated data
      await this.loadProjects();
      return true;
    } catch (error) {
      console.error("Error updating project status:", error);
      return false;
    }
  }

  async deleteProject(id: string): Promise<boolean> {
    await this.loadProjects();
    const projectIndex = this.projects.findIndex(
      (project) => project.id === id
    );
    if (projectIndex !== -1) {
      this.projects.splice(projectIndex, 1);
      return true;
    }
    return false;
  }

  async searchProjects(query: string): Promise<Project[]> {
    await this.loadProjects();
    const lowercaseQuery = query.toLowerCase();
    return this.projects.filter(
      (project) =>
        project.title.toLowerCase().includes(lowercaseQuery) ||
        project.category.toLowerCase().includes(lowercaseQuery) ||
        project.clientName.toLowerCase().includes(lowercaseQuery)
    );
  }

  async getProjectsByStatus(status: Project["status"]): Promise<Project[]> {
    await this.loadProjects();
    return this.projects.filter((project) => project.status === status);
  }

  // ===== ADMIN PROJECT MANAGEMENT METHODS =====

  // Get projects pending admin review
  async getPendingAdminReviewProjects(): Promise<Project[]> {
    try {
      const firestoreProjects = await getPendingAdminReviewProjects();

      // Transform to admin Project model format
      return firestoreProjects.map((project) => ({
        id: project.id,
        title: project.title,
        description: project.description,
        status: this.mapProjectStatus(project.status),
        clientId: project.createdBy || project.buyerEmail || project.id, // Use buyerEmail as fallback
        clientName:
          project.poster?.displayName ||
          project.buyerEmail ||
          project.poster?.email ||
          (project.createdBy ? `User: ${project.createdBy}` : "Unknown Client"), // Show user ID with label or Unknown Client if no ID
        budget: {
          min: project.budgetMin || 0,
          max: project.budgetMax || project.budgetMin || 0,
        },
        adminPrice: project.adminPrice,
        adminDuration: project.adminDuration,
        adminDurationUnit: project.adminDurationUnit,
        deadline: project.deadline.toISOString().split("T")[0],
        createdDate: project.createdAt.toISOString().split("T")[0],
        category: project.category || "General",
        skillsRequired: project.skills || [],
        featured: false,
      }));
    } catch (error) {
      console.error("Error fetching pending admin review projects:", error);
      return [];
    }
  }

  // Get priced projects waiting for customer decision
  async getPricedProjects(): Promise<Project[]> {
    try {
      const firestoreProjects = await getPricedProjects();

      // Transform to admin Project model format
      return firestoreProjects.map((project) => ({
        id: project.id,
        title: project.title,
        description: project.description,
        status: this.mapProjectStatus(project.status),
        clientId: project.createdBy || project.buyerEmail || project.id, // Use buyerEmail as fallback
        clientName:
          project.poster?.displayName ||
          project.buyerEmail ||
          project.poster?.email ||
          (project.createdBy ? `User: ${project.createdBy}` : "Unknown Client"), // Show user ID with label or Unknown Client if no ID
        budget: {
          min: project.budgetMin || 0,
          max: project.budgetMax || project.budgetMin || 0,
        },
        adminPrice: project.adminPrice,
        adminDuration: project.adminDuration,
        adminDurationUnit: project.adminDurationUnit,
        deadline: project.deadline.toISOString().split("T")[0],
        createdDate: project.createdAt.toISOString().split("T")[0],
        category: project.category || "General",
        skillsRequired: project.skills || [],
        featured: false,
      }));
    } catch (error) {
      console.error("Error fetching priced projects:", error);
      return [];
    }
  }

  // Admin reviews and sets price for a project
  async adminReviewProject(
    projectId: string,
    adminPrice: number,
    adminDuration?: number,
    adminDurationUnit?: "days" | "weeks",
    adminNotes?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await adminReviewProject(
        projectId,
        adminPrice,
        adminDuration,
        adminDurationUnit,
        adminNotes
      );

      // Refresh the local projects cache
      this.isLoaded = false;

      return {
        success: true,
        message: result.message,
      };
    } catch (error) {
      console.error("Error in admin review project:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to review project",
      };
    }
  }
}

export const projectController = new ProjectController();
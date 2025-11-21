export interface Project {
  id: string;
  title: string;
  description: string;
  status:
    | "pending"
    | "admin_review"
    | "priced"
    | "ready_to_assign"
    | "customer_approved"
    | "approved"
    | "assigned"
    | "completed_by_employee"
    | "completed"
    | "cancelled";
  clientId: string;
  clientName: string;
  budget: {
    min: number;
    max: number;
  };
  adminPrice?: number;
  adminDuration?: number; // Duration in days/weeks
  adminDurationUnit?: "days" | "weeks"; // Unit for duration
  deadline: string;
  createdDate: string;
  category: string;
  skillsRequired: string[];
  featured: boolean;
  isUrgent?: boolean;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  assignedEmployeeEmail?: string;
  assignedAt?: string;
  documents?: ProjectDocument[]; // Buyer's uploaded documents
}

export interface ProjectDocument {
  url: string;
  name: string;
  type?: string;
  size?: number;
  uploadedAt: string;
}

export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  pendingApproval: number;
  completedProjects: number;
}

export interface AssignedProject {
  id: string;
  title: string;
  description: string;
  status: 
    | "assigned" 
    | "in_progress" 
    | "completed_by_employee" 
    | "completed" 
    | "needs_revision";
  clientId: string;
  clientName: string;
  budget: {
    min: number;
    max: number;
  };
  adminPrice?: number;
  adminDuration?: number;
  adminDurationUnit?: "days" | "weeks";
  deadline: string;
  createdDate: string;
  assignedDate: string;
  category: string;
  skillsRequired: string[];
  assignedEmployeeId: string;
  assignedEmployeeName: string;
  assignedEmployeeEmail: string;
  adminNotes?: string;
  submittedToAdminAt?: string;
  adminReviewStatus?: "pending" | "approved" | "needs_revision";
  adminReviewNotes?: string;
  downloadUrl?: string;
  documents?: ProjectDocument[];
}

export interface ProjectDocument {
  url: string;
  name: string;
  type?: string;
  size?: number;
  uploadedAt: Date | string;
}

export interface EmployeeStats {
  totalAssigned: number;
  inProgress: number;
  completed: number;
  needsRevision: number;
}

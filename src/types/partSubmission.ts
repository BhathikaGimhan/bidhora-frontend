// Part-Based Payment System Types
// Defines the new database schema for multi-part project submissions

import { Timestamp } from 'firebase/firestore';

/**
 * Individual part submission by employee
 */
export interface PartSubmission {
  id: string;
  projectId: string;
  employeeId: string;
  employeeName: string;
  employeePhotoURL?: string;
  
  // Part identification
  partTag: string; // e.g., "Part 1", "Part 2", "Revision A"
  description: string;
  
  // Files submitted for this part
  documents: PartSubmissionFile[];
  
  // Submission lifecycle
  submittedAt: Date;
  status: 'pending_review' | 'approved' | 'rejected';
  
  // Admin review
  reviewedAt: Date | null;
  reviewedBy: string | null; // admin UID
  reviewerName?: string | null;
  adminPrice: number | null; // Price set by admin for this part
  adminNotes: string | null;
  
  // Payment for this specific part
  paymentStatus: 'pending' | 'paid';
  paidAt: Date | null;
  paymentId: string | null; // Genie payment ID
  isFinal?: boolean; // If this is the final project completion submission
}

/**
 * File attached to a part submission
 */
export interface PartSubmissionFile {
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt?: Date;
}

/**
 * Admin note sent to buyer
 */
export interface AdminNote {
  id: string;
  projectId: string;
  submissionId: string | null; // null if general project note
  adminId: string;
  adminName: string;
  note: string;
  sentAt: Date;
  sentViaEmail: boolean;
  emailedTo?: string;
}

/**
 * Extended project type with new deposit and part-based payment fields
 */
export interface ProjectWithParts {
  // ... existing project fields ...
  
  // NEW: Fixed deposit payment (replaces 10% calculation)
  depositAmount: number; // Always 1500
  depositStatus: 'pending' | 'paid';
  depositPaidAt: Date | null;
  depositPaymentId: string | null;
  
  // NEW: Part-based submissions
  hasPartSubmissions?: boolean;
  totalParts?: number;
  approvedParts?: number;
  paidParts?: number;
  totalPaidAmount?: number; // Sum of all paid parts
  
  // Keep for backward compatibility with old projects
  initialPaymentStatus?: 'pending' | 'paid';
  finalPaymentStatus?: 'pending' | 'paid';
}

/**
 * Data for submitting a new part
 */
export interface SubmitPartData {
  projectId: string;
  partTag: string;
  description: string;
  files: File[];
  isFinal?: boolean;
}

/**
 * Data for admin to approve/reject a part
 */
export interface ReviewPartData {
  submissionId: string;
  status: 'approved' | 'rejected';
  adminPrice?: number; // Required for approval
  adminNotes?: string;
}

/**
 * Payment details for a specific part
 */
export interface PartPaymentDetails {
  submissionId: string;
  projectId: string;
  projectTitle: string;
  partTag: string;
  description: string;
  employeeName: string;
  adminPrice: number;
  adminNotes: string | null;
  documents: PartSubmissionFile[];
  approvedAt: Date;
  paymentStatus: 'pending' | 'paid';
  paidAt: Date | null;
}

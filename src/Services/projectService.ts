import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/firebaseConfig";
import { emailService } from "./emailService";
import { Project as ProfileProject } from "../features/profile/types/profile";

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: "buyer" | "service_provider" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectDocument {
  url: string;
  name: string;
  type?: string;
  size?: number;
  uploadedAt: Date;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number | null;
  deadline: Date;
  location: string;
  skills: string[];
  isUrgent: boolean;
  category: string;
  imageUrl: string | null;
  documents?: ProjectDocument[]; // Added documents array
  createdBy: string;
  createdAt: Date;
  bids: number;
  buyerEmail?: string; // Buyer's email address
  assignedTo?: string; // ID of the user assigned to this project
  // Enhanced with user details
  poster?: User;

  // New workflow fields
  status:
    | "pending"
    | "admin_review"
    | "priced"
    | "customer_approved"
    | "approved"
    | "assigned"
    | "completed_by_employee"
    | "completed"
    | "cancelled";
  adminPrice?: number; // Price set by admin
  adminDuration?: number; // Duration set by admin
  adminDurationUnit?: "days" | "weeks"; // Unit for admin duration
  adminNotes?: string; // Notes from admin during review
  pricedAt?: Date; // When admin set the price
  customerDecision?: "approved" | "rejected"; // Customer's decision on price
  customerDecisionAt?: Date; // When customer made decision
  initialPaymentAmount?: number; // 10% of admin price
  initialPaymentStatus?: "pending" | "paid" | "failed";
  initialPaymentId?: string; // PayHere payment ID
  initialPaymentAt?: Date;
  assignedEmployeeId?: string; // Employee assigned to work on project
  assignedEmployeeName?: string;
  assignedEmployeeEmail?: string;
  assignedAt?: Date;
  submittedToAdminAt?: Date; // When employee submitted work
  adminReviewStatus?: "pending" | "approved" | "needs_revision"; // Admin review of employee work
  adminReviewNotes?: string;
  reviewedAt?: Date; // When admin reviewed employee work
  finalPaymentAmount?: number; // 90% remaining payment
  finalPaymentStatus?: "pending" | "paid" | "failed";
  finalPaymentId?: string;
  finalPaymentAt?: Date;
  downloadUrl?: string; // URL for customer to download completed work
  customerRating?: number; // 1-5 stars
  customerReview?: string;
  customerReviewedAt?: Date; // When customer left review
}

export interface Proposal {
  id?: string;
  projectId: string;
  proposalSenderId: string;
  name?: string; // Custom name for the proposal (e.g., "projectX")
  content: string;
  // Enhanced proposal fields
  biddingPrice?: number;
  estimatedDuration?: number;
  durationUnit?: "days" | "weeks";
  deliveryDate?: Date;
  additionalNotes?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
  // Enhanced with user details
  sender?: User;
}

export interface DetailedProposalData {
  name?: string; // Custom name for the proposal
  biddingPrice: number;
  estimatedDuration: number;
  durationUnit: "days" | "weeks";
  deliveryDate: Date;
  additionalNotes: string;
}

// Enhanced Project interface for buyer projects
export interface BuyerProject {
  id: string;
  title: string;
  description: string;
  budgetMin: number; // Required to align with Project interface
  budgetMax: number | null; // Required to align with Project interface
  budget?: number;
  deadline: Date; // Required to be Date, not string
  location: string;
  skills: string[];
  isUrgent: boolean;
  category: string;
  imageUrl: string | null; // Align with Project interface
  documents?: ProjectDocument[]; // Added documents array
  createdBy: string;
  createdAt: Date; // Required to be Date, not string
  updatedAt?: Date;
  bids: number; // Required to align with Project interface
  proposalsCount: number;
  status: "pending" | "ongoing" | "completed" | "closed";
  assignedTo?: string;
  assignedServiceProvider?: {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    role: "service_provider";
    location?: string;
    skills?: string[];
    averageRating?: number;
    completedProjects?: number;
    createdAt: Date;
    updatedAt: Date;
  };
  assignedAt?: Date;
  progress?: number;
}

export interface BuyerProposal {
  id: string;
  projectId: string;
  proposalSenderId: string;
  name?: string; // Custom proposal name
  content: string;
  biddingPrice: number;
  proposalDuration: string;
  status: "pending" | "accepted" | "rejected"; // Aligned with Proposal interface
  createdAt: Date; // Required to be Date, not string
  updatedAt: Date; // Required to align with Proposal interface
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  serviceProvider?: {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    role: "service_provider";
    location?: string;
    skills?: string[];
    averageRating?: number;
    completedProjects?: number;
    createdAt: Date;
    updatedAt: Date;
  };
}

// Fetch user details from Firestore
export const getUserDetails = async (uid: string): Promise<User | null> => {
  try {
    if (!uid) {
      console.warn("getUserDetails called with empty uid");
      return null;
    }

    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        uid,
        email: userData.email || "",
        displayName: userData.displayName || userData.name || "Anonymous User",
        photoURL: userData.photoURL || undefined,
        role: userData.role || "buyer",
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
      };
    }
    console.warn(`User document not found for uid: ${uid}`);
    return null;
  } catch (error) {
    console.error("Error fetching user details:", error);
    return null;
  }
};

// Fetch all projects with user details
export const getProjectsWithUserDetails = async (): Promise<Project[]> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Query projects from Firestore
    const projectsQuery = query(
      collection(db, "projects"),
      orderBy("createdAt", "desc")
    );

    const projectsSnapshot = await getDocs(projectsQuery);

    // Enhance projects with user details
    const enhancedProjects = await Promise.all(
      projectsSnapshot.docs.map(async (doc) => {
        const projectData = doc.data();
        const poster = await getUserDetails(projectData.createdBy);
        return {
          ...projectData,
          id: doc.id,
          deadline: projectData.deadline?.toDate() || new Date(),
          createdAt: projectData.createdAt?.toDate() || new Date(),
          status: projectData.status || "pending",
          poster,
        } as Project;
      })
    );

    return enhancedProjects;
  } catch (error) {
    console.error("Error fetching projects with user details:", error);
    throw error;
  }
};

// Fetch a single project with user details
export const getProjectById = async (
  projectId: string
): Promise<Project | null> => {
  try {
    const projectDoc = await getDoc(doc(db, "projects", projectId));
    if (!projectDoc.exists()) {
      return null;
    }

    const projectData = projectDoc.data();

    // Try to get poster details, but don't fail if it's not available
    let poster: User | null = null;
    if (projectData.createdBy) {
      poster = await getUserDetails(projectData.createdBy);
    }

    return {
      id: projectDoc.id,
      title: projectData.title,
      description: projectData.description,
      budgetMin: projectData.budgetMin,
      budgetMax: projectData.budgetMax,
      deadline: projectData.deadline.toDate(),
      location: projectData.location,
      skills: projectData.skills,
      isUrgent: projectData.isUrgent,
      category: projectData.category,
      imageUrl: projectData.imageUrl,
      documents: projectData.documents || [], // Include documents
      createdBy: projectData.createdBy,
      createdAt: projectData.createdAt.toDate(),
      bids: projectData.bids || 0,
      status: projectData.status || "pending",
      poster: poster || undefined, // Make poster optional
    };
  } catch (error) {
    console.error("Error fetching project by ID:", error);
    return null;
  }
};

// Submit a proposal (legacy function for backward compatibility)
export const submitProposal = async (
  projectId: string,
  content: string
): Promise<string> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const proposalData = {
      projectId,
      proposalSenderId: user.uid,
      content,
      status: "pending" as const,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, "proposals"), proposalData);

    // Update project bids count
    const projectRef = doc(db, "projects", projectId);
    const projectDoc = await getDoc(projectRef);
    if (projectDoc.exists()) {
      const currentBids = projectDoc.data().bids || 0;
      await updateDoc(projectRef, { bids: currentBids + 1 });
    }

    return docRef.id;
  } catch (error) {
    console.error("Error submitting proposal:", error);
    throw error;
  }
};

// Submit a detailed proposal with all fields
export const submitDetailedProposal = async (
  projectId: string,
  proposalData: DetailedProposalData
): Promise<string> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if user has already submitted a proposal for this project
    const existingProposalQuery = query(
      collection(db, "proposals"),
      where("projectId", "==", projectId),
      where("proposalSenderId", "==", user.uid)
    );

    const existingProposals = await getDocs(existingProposalQuery);
    if (!existingProposals.empty) {
      throw new Error("You have already submitted a proposal for this project");
    }

    const fullProposalData = {
      projectId,
      proposalSenderId: user.uid,
      name: proposalData.name, // Include custom proposal name
      biddingPrice: proposalData.biddingPrice,
      estimatedDuration: proposalData.estimatedDuration,
      durationUnit: proposalData.durationUnit,
      deliveryDate: Timestamp.fromDate(proposalData.deliveryDate),
      additionalNotes: proposalData.additionalNotes,
      // Legacy content field for backward compatibility
      content: `Bid: ${proposalData.biddingPrice} | Duration: ${
        proposalData.estimatedDuration
      } ${
        proposalData.durationUnit
      } | Delivery: ${proposalData.deliveryDate.toLocaleDateString()} | Notes: ${
        proposalData.additionalNotes
      }`,
      status: "pending" as const,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, "proposals"), fullProposalData);

    // Update project bids count
    const projectRef = doc(db, "projects", projectId);
    const projectDoc = await getDoc(projectRef);
    if (projectDoc.exists()) {
      const currentBids = projectDoc.data().bids || 0;
      await updateDoc(projectRef, { bids: currentBids + 1 });
    }

    return docRef.id;
  } catch (error) {
    console.error("Error submitting detailed proposal:", error);
    throw error;
  }
};

// Get proposals for a project
export const getProposalsForProject = async (
  projectId: string
): Promise<Proposal[]> => {
  try {
    const proposalsQuery = query(
      collection(db, "proposals"),
      where("projectId", "==", projectId),
      orderBy("createdAt", "desc")
    );

    const proposalsSnapshot = await getDocs(proposalsQuery);
    const proposals = await Promise.all(
      proposalsSnapshot.docs.map(async (doc) => {
        const proposalData = doc.data();
        const sender = await getUserDetails(proposalData.proposalSenderId);

        return {
          id: doc.id,
          projectId: proposalData.projectId,
          proposalSenderId: proposalData.proposalSenderId,
          name: proposalData.name, // Include custom proposal name
          content: proposalData.content,
          // Enhanced proposal fields
          biddingPrice: proposalData.biddingPrice,
          estimatedDuration: proposalData.estimatedDuration,
          durationUnit: proposalData.durationUnit,
          deliveryDate: proposalData.deliveryDate?.toDate(),
          additionalNotes: proposalData.additionalNotes,
          status: proposalData.status,
          createdAt: proposalData.createdAt.toDate(),
          updatedAt: proposalData.updatedAt.toDate(),
          sender,
        };
      })
    );

    return proposals;
  } catch (error) {
    console.error("Error fetching proposals for project:", error);
    throw error;
  }
};

// Get user's proposals
export const getUserProposals = async (): Promise<Proposal[]> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const proposalsQuery = query(
      collection(db, "proposals"),
      where("proposalSenderId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const proposalsSnapshot = await getDocs(proposalsQuery);
    const proposals = proposalsSnapshot.docs.map((doc) => {
      const proposalData = doc.data();
      return {
        id: doc.id,
        projectId: proposalData.projectId,
        proposalSenderId: proposalData.proposalSenderId,
        content: proposalData.content,
        status: proposalData.status,
        createdAt: proposalData.createdAt.toDate(),
        updatedAt: proposalData.updatedAt.toDate(),
      };
    });

    return proposals;
  } catch (error) {
    console.error("Error fetching user proposals:", error);
    throw error;
  }
};

// Helper function to format time ago
export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12)
    return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;

  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
};

// ===== BUYER PROJECT MANAGEMENT FUNCTIONS =====

// Get all projects for a buyer
export const getBuyerProjects = async (
  buyerId: string
): Promise<{ projects: BuyerProject[]; total: number }> => {
  try {
    // Query projects from Firestore where createdBy matches buyerId
    // Note: Removed orderBy to avoid requiring composite index
    const projectsQuery = query(
      collection(db, "projects"),
      where("createdBy", "==", buyerId)
    );

    const projectsSnapshot = await getDocs(projectsQuery);

    // Convert Firestore documents to BuyerProject format and sort by createdAt desc
    const projects = projectsSnapshot.docs
      .map((doc): BuyerProject => {
        const projectData = doc.data();
        return {
          id: doc.id,
          title: projectData.title || "",
          description: projectData.description || "",
          budgetMin: projectData.budgetMin || projectData.budget || 0,
          budgetMax: projectData.budgetMax || null,
          deadline: projectData.deadline?.toDate() || new Date(),
          location: projectData.location || "",
          skills: projectData.skills || [],
          isUrgent: projectData.isUrgent || false,
          category: projectData.category || "",
          imageUrl: projectData.imageUrl || null,
          createdBy: projectData.createdBy,
          createdAt: projectData.createdAt?.toDate() || new Date(),
          updatedAt: projectData.updatedAt?.toDate(),
          bids: projectData.bids || 0,
          proposalsCount: projectData.bids || 0, // Use bids as proposalsCount
          status:
            (projectData.status as
              | "pending"
              | "ongoing"
              | "completed"
              | "closed") || "pending",
          assignedTo: projectData.assignedTo,
          assignedAt: projectData.assignedAt?.toDate(),
          assignedServiceProvider: projectData.assignedServiceProvider,
          progress: projectData.progress || 0,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by createdAt desc

    return {
      projects,
      total: projects.length,
    };
  } catch (error) {
    console.error("Error fetching buyer projects:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch buyer projects";
    throw new Error(errorMessage);
  }
};

// Get proposals for a specific project
export const getProjectProposals = async (
  buyerId: string,
  projectId: string,
  status: "all" | "pending" | "accepted" | "rejected" = "all"
): Promise<{ proposals: BuyerProposal[]; total: number }> => {
  try {
    // First verify that the current user is the buyer of this project
    const projectDoc = await getDoc(doc(db, "projects", projectId));
    if (!projectDoc.exists()) {
      throw new Error("Project not found");
    }

    const projectData = projectDoc.data();
    if (projectData.createdBy !== buyerId) {
      throw new Error(
        "Unauthorized: You can only view proposals for your own projects"
      );
    }

    // Query proposals from Firestore
    let proposalsQuery = query(
      collection(db, "proposals"),
      where("projectId", "==", projectId),
      orderBy("createdAt", "desc")
    );

    // Filter by status if not "all"
    if (status !== "all") {
      const firestoreStatus = status === "accepted" ? "approved" : status;
      proposalsQuery = query(
        collection(db, "proposals"),
        where("projectId", "==", projectId),
        where("status", "==", firestoreStatus),
        orderBy("createdAt", "desc")
      );
    }

    const proposalsSnapshot = await getDocs(proposalsQuery);

    // Convert Firestore documents to BuyerProposal format
    const proposals = await Promise.all(
      proposalsSnapshot.docs.map(async (doc): Promise<BuyerProposal> => {
        const proposalData = doc.data();
        const serviceProvider = await getUserDetails(
          proposalData.proposalSenderId
        );

        return {
          id: doc.id,
          projectId: proposalData.projectId,
          proposalSenderId: proposalData.proposalSenderId,
          name: proposalData.name,
          content: proposalData.content,
          biddingPrice: proposalData.biddingPrice || 0,
          proposalDuration: `${proposalData.estimatedDuration || 0} ${
            proposalData.durationUnit || "days"
          }`,
          status: (proposalData.status === "approved"
            ? "accepted"
            : proposalData.status) as "pending" | "accepted" | "rejected",
          createdAt: proposalData.createdAt?.toDate() || new Date(),
          updatedAt: proposalData.updatedAt?.toDate() || new Date(),
          approvedAt: proposalData.approvedAt?.toDate(),
          rejectedAt: proposalData.rejectedAt?.toDate(),
          rejectionReason: proposalData.rejectionReason,
          serviceProvider: serviceProvider
            ? {
                uid: serviceProvider.uid,
                email: serviceProvider.email,
                displayName: serviceProvider.displayName,
                photoURL: serviceProvider.photoURL,
                role: "service_provider",
                location: "", // Not stored in user profile
                skills: [], // Not stored in user profile
                averageRating: 0, // Not stored in user profile
                completedProjects: 0, // Not stored in user profile
                createdAt: serviceProvider.createdAt,
                updatedAt: serviceProvider.updatedAt,
              }
            : undefined,
        };
      })
    );

    return {
      proposals,
      total: proposals.length,
    };
  } catch (error) {
    console.error("Error fetching project proposals:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to fetch project proposals";
    throw new Error(errorMessage);
  }
};

// Approve a proposal
export const approveProposal = async (
  buyerId: string,
  proposalId: string
): Promise<{ message: string; proposalId: string; projectId: string }> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Get the proposal document
    const proposalDoc = await getDoc(doc(db, "proposals", proposalId));
    if (!proposalDoc.exists()) {
      throw new Error("Proposal not found");
    }

    const proposalData = proposalDoc.data();

    // Verify that the current user is the buyer of the project
    const projectDoc = await getDoc(
      doc(db, "projects", proposalData.projectId)
    );
    if (!projectDoc.exists()) {
      throw new Error("Project not found");
    }

    const projectData = projectDoc.data();
    if (
      projectData.createdBy !== buyerId ||
      projectData.createdBy !== currentUser.uid
    ) {
      throw new Error(
        "Unauthorized: You can only approve proposals for your own projects"
      );
    }

    // Get service provider details
    const serviceProvider = await getUserDetails(proposalData.proposalSenderId);
    if (!serviceProvider) {
      throw new Error("Service provider not found");
    }

    // Update proposal status
    await updateDoc(doc(db, "proposals", proposalId), {
      status: "approved",
      approvedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Update project to assign the service provider
    await updateDoc(doc(db, "projects", proposalData.projectId), {
      status: "ongoing",
      assignedTo: proposalData.proposalSenderId,
      assignedAt: Timestamp.now(),
      assignedServiceProvider: {
        uid: serviceProvider.uid,
        email: serviceProvider.email,
        displayName: serviceProvider.displayName,
        photoURL: serviceProvider.photoURL,
        role: serviceProvider.role,
        createdAt: Timestamp.fromDate(serviceProvider.createdAt),
        updatedAt: Timestamp.fromDate(serviceProvider.updatedAt),
      },
      updatedAt: Timestamp.now(),
    });

    // Reject all other proposals for this project
    const otherProposalsQuery = query(
      collection(db, "proposals"),
      where("projectId", "==", proposalData.projectId),
      where("status", "==", "pending")
    );

    const otherProposalsSnapshot = await getDocs(otherProposalsQuery);
    const rejectPromises = otherProposalsSnapshot.docs
      .filter((doc) => doc.id !== proposalId)
      .map((doc) =>
        updateDoc(doc.ref, {
          status: "rejected",
          rejectedAt: Timestamp.now(),
          rejectionReason: "Another proposal was accepted",
          updatedAt: Timestamp.now(),
        })
      );

    await Promise.all(rejectPromises);

    return {
      message: "Proposal approved successfully",
      proposalId,
      projectId: proposalData.projectId,
    };
  } catch (error) {
    console.error("Error approving proposal:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to approve proposal";
    throw new Error(errorMessage);
  }
};

// Reject a proposal
export const rejectProposal = async (
  buyerId: string,
  proposalId: string,
  reason?: string
): Promise<{ message: string; proposalId: string }> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Get the proposal document
    const proposalDoc = await getDoc(doc(db, "proposals", proposalId));
    if (!proposalDoc.exists()) {
      throw new Error("Proposal not found");
    }

    const proposalData = proposalDoc.data();

    // Verify that the current user is the buyer of the project
    const projectDoc = await getDoc(
      doc(db, "projects", proposalData.projectId)
    );
    if (!projectDoc.exists()) {
      throw new Error("Project not found");
    }

    const projectData = projectDoc.data();
    if (
      projectData.createdBy !== buyerId ||
      projectData.createdBy !== currentUser.uid
    ) {
      throw new Error(
        "Unauthorized: You can only reject proposals for your own projects"
      );
    }

    // Update proposal status
    await updateDoc(doc(db, "proposals", proposalId), {
      status: "rejected",
      rejectedAt: Timestamp.now(),
      rejectionReason: reason || "Proposal was rejected by the buyer",
      updatedAt: Timestamp.now(),
    });

    return {
      message: "Proposal rejected successfully",
      proposalId,
    };
  } catch (error) {
    console.error("Error rejecting proposal:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to reject proposal";
    throw new Error(errorMessage);
  }
};

// ===== ADMIN PROJECT MANAGEMENT FUNCTIONS =====

// Admin reviews and sets price for a project
export const adminReviewProject = async (
  projectId: string,
  adminPrice: number,
  adminDuration?: number,
  adminDurationUnit?: "days" | "weeks",
  adminNotes?: string
): Promise<{ message: string; projectId: string }> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Check if current user is admin
    const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (!currentUserDoc.exists() || currentUserDoc.data().role !== "admin") {
      throw new Error("Unauthorized: Only admins can review projects");
    }

    // Get the project document
    const projectDoc = await getDoc(doc(db, "projects", projectId));
    if (!projectDoc.exists()) {
      throw new Error("Project not found");
    }

    const projectData = projectDoc.data();
    console.log("Project status check - current status:", projectData.status);
    if (
      projectData.status !== "pending" &&
      projectData.status !== "admin_review" &&
      projectData.status !== "open"
    ) {
      console.error(
        "Project status validation failed. Status:",
        projectData.status,
        "Project ID:",
        projectId
      );
      throw new Error("Project is not in pending, admin review, or open status");
    }

    // Get user details for email
    const userDetails = await getUserDetails(projectData.createdBy);
    const clientEmail = userDetails?.email || projectData.buyerEmail;

    // Calculate 10% deposit amount
    const depositAmount = parseFloat((adminPrice * 0.1).toFixed(2));

    // Generate payment link
    const baseUrl = window.location.origin;
    const paymentLink = `${baseUrl}/payment/project/${projectId}`;

    // Update project with admin review
    const updateData: {
      status: string;
      adminPrice: number;
      adminNotes: string;
      pricedAt: Timestamp;
      updatedAt: Timestamp;
      initialPaymentAmount: number;
      initialPaymentStatus: string;
      paymentLink: string;
      adminDuration?: number;
      adminDurationUnit?: "days" | "weeks";
    } = {
      status: "priced",
      adminPrice,
      adminNotes: adminNotes || "",
      pricedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      initialPaymentAmount: depositAmount,
      initialPaymentStatus: "pending",
      paymentLink: paymentLink,
    };

    if (adminDuration) {
      updateData.adminDuration = adminDuration;
    }

    if (adminDurationUnit) {
      updateData.adminDurationUnit = adminDurationUnit;
    }

    await updateDoc(doc(db, "projects", projectId), updateData);

    // Send email notification to customer about pricing with payment link
    if (clientEmail) {
      try {
        const emailResult = await emailService.sendProjectPriceNotification({
          to_email: clientEmail,
          to_name: userDetails?.displayName || projectData.buyerName,
          project_title: projectData.title,
          project_price: adminPrice,
          project_duration:
            adminDuration && adminDurationUnit
              ? `${adminDuration} ${adminDurationUnit}`
              : undefined,
          admin_notes: adminNotes,
          project_id: projectId,
          payment_link: paymentLink,
          deposit_amount: depositAmount,
        });

        if (emailResult.success) {
          console.log(
            "Price notification email sent successfully to:",
            clientEmail
          );
        } else {
          console.warn(
            "Failed to send price notification email:",
            emailResult.message
          );
        }
      } catch (emailError) {
        console.error("Error sending price notification email:", emailError);
        // Don't fail the entire operation if email fails
      }
    }

    return {
      message: "Project reviewed and priced successfully. Payment link sent to customer.",
      projectId,
    };
  } catch (error) {
    console.error("Error reviewing project:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to review project";
    throw new Error(errorMessage);
  }
};

// Get projects pending admin review
export const getPendingAdminReviewProjects = async (): Promise<Project[]> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Check if current user is admin
    const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (!currentUserDoc.exists() || currentUserDoc.data().role !== "admin") {
      throw new Error("Unauthorized: Only admins can view pending reviews");
    }

    // Query projects with status 'pending'
    const projectsQuery = query(
      collection(db, "projects"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const projectsSnapshot = await getDocs(projectsQuery);

    // Enhance projects with user details
    const enhancedProjects = await Promise.all(
      projectsSnapshot.docs.map(async (doc) => {
        const projectData = doc.data();
        const poster = await getUserDetails(projectData.createdBy);
        return {
          ...projectData,
          id: doc.id,
          deadline: projectData.deadline?.toDate() || new Date(),
          createdAt: projectData.createdAt?.toDate() || new Date(),
          status: projectData.status || "pending",
          poster,
        } as Project;
      })
    );

    return enhancedProjects;
  } catch (error) {
    console.error("Error fetching pending admin review projects:", error);
    throw error;
  }
};

// Get priced projects waiting for customer decision
export const getPricedProjects = async (): Promise<Project[]> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Check if current user is admin
    const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (!currentUserDoc.exists() || currentUserDoc.data().role !== "admin") {
      throw new Error("Unauthorized: Only admins can view priced projects");
    }

    // Query projects with status 'priced'
    const projectsQuery = query(
      collection(db, "projects"),
      where("status", "==", "priced"),
      orderBy("pricedAt", "desc")
    );

    const projectsSnapshot = await getDocs(projectsQuery);

    // Enhance projects with user details
    const enhancedProjects = await Promise.all(
      projectsSnapshot.docs.map(async (doc) => {
        const projectData = doc.data();
        const poster = await getUserDetails(projectData.createdBy);
        return {
          ...projectData,
          id: doc.id,
          deadline: projectData.deadline?.toDate() || new Date(),
          createdAt: projectData.createdAt?.toDate() || new Date(),
          pricedAt: projectData.pricedAt?.toDate(),
          status: projectData.status || "priced",
          poster,
        } as Project;
      })
    );

    return enhancedProjects;
  } catch (error) {
    console.error("Error fetching priced projects:", error);
    throw error;
  }
};

// ===== CUSTOMER DECISION FUNCTIONS =====

// Customer approves the project price
export const customerApproveProject = async (
  projectId: string
): Promise<{ message: string; projectId: string }> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Get the project document
    const projectDoc = await getDoc(doc(db, "projects", projectId));
    if (!projectDoc.exists()) {
      throw new Error("Project not found");
    }

    const projectData = projectDoc.data();

    // Check if user is the project owner
    if (projectData.createdBy !== currentUser.uid) {
      throw new Error("Unauthorized: Only project owner can approve");
    }

    if (projectData.status !== "priced") {
      throw new Error("Project is not in priced status");
    }

    // Update project status to customer_approved
    await updateDoc(doc(db, "projects", projectId), {
      status: "customer_approved",
      customerApprovedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return {
      message: "Project price approved successfully",
      projectId,
    };
  } catch (error) {
    console.error("Error approving project:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to approve project";
    throw new Error(errorMessage);
  }
};

// Customer rejects the project price
export const customerRejectProject = async (
  projectId: string,
  rejectionReason?: string
): Promise<{ message: string; projectId: string }> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Get the project document
    const projectDoc = await getDoc(doc(db, "projects", projectId));
    if (!projectDoc.exists()) {
      throw new Error("Project not found");
    }

    const projectData = projectDoc.data();

    // Check if user is the project owner
    if (projectData.createdBy !== currentUser.uid) {
      throw new Error("Unauthorized: Only project owner can reject");
    }

    if (projectData.status !== "priced") {
      throw new Error("Project is not in priced status");
    }

    // Update project status to cancelled with rejection reason
    await updateDoc(doc(db, "projects", projectId), {
      status: "cancelled",
      rejectionReason: rejectionReason || "",
      customerRejectedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return {
      message: "Project rejected successfully",
      projectId,
    };
  } catch (error) {
    console.error("Error rejecting project:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to reject project";
    throw new Error(errorMessage);
  }
};

// Get projects priced for customer decision (for customer dashboard)
export const getPricedProjectsForCustomer = async (): Promise<Project[]> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Query projects created by current user with status 'priced'
    const projectsQuery = query(
      collection(db, "projects"),
      where("createdBy", "==", currentUser.uid),
      where("status", "==", "priced"),
      orderBy("pricedAt", "desc")
    );

    const projectsSnapshot = await getDocs(projectsQuery);

    // Enhance projects with user details
    const enhancedProjects = await Promise.all(
      projectsSnapshot.docs.map(async (doc) => {
        const projectData = doc.data();
        const poster = await getUserDetails(projectData.createdBy);
        return {
          ...projectData,
          id: doc.id,
          deadline: projectData.deadline?.toDate() || new Date(),
          createdAt: projectData.createdAt?.toDate() || new Date(),
          pricedAt: projectData.pricedAt?.toDate(),
          status: projectData.status || "priced",
          poster,
        } as Project;
      })
    );

    return enhancedProjects;
  } catch (error) {
    console.error("Error fetching priced projects for customer:", error);
    throw error;
  }
};

// Generic function to update project status
export const updateProjectStatus = async (
  projectId: string,
  status: Project["status"],
  additionalData?: Partial<Project>
): Promise<{ message: string; projectId: string }> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Check if current user is admin
    const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (!currentUserDoc.exists() || currentUserDoc.data().role !== "admin") {
      throw new Error("Unauthorized: Only admins can update project status");
    }

    // Get the project document
    const projectDoc = await getDoc(doc(db, "projects", projectId));
    if (!projectDoc.exists()) {
      throw new Error("Project not found");
    }

    // Update project status
    const updateData = {
      status,
      updatedAt: Timestamp.now(),
      ...additionalData,
    };

    await updateDoc(doc(db, "projects", projectId), updateData);

    // Update user profile with the project change
    const updatedProjectDoc = await getDoc(doc(db, "projects", projectId));
    if (updatedProjectDoc.exists()) {
      const projectData = updatedProjectDoc.data();
      const updatedProjectData = { ...projectData, id: projectId };
      await updateUserProfileForProject(projectData.buyerId, projectId, updatedProjectData);
    }

    console.log(`Project ${projectId} status updated to ${status}`);

    return {
      message: `Project status updated to ${status}`,
      projectId,
    };
  } catch (error) {
    console.error("Error updating project status:", error);
    throw error;
  }
};

// Helper function to update user profile when project status changes
export const updateUserProfileForProject = async (
  buyerId: string,
  projectId: string,
  projectData: Partial<Project>
): Promise<void> => {
  try {
    const userDocRef = doc(db, "users", buyerId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      console.warn(`User profile not found for buyerId: ${buyerId}`);
      return;
    }

    const userData = userDocSnap.data();
    const postedProjects = userData.postedProjects || [];
    const completedProjects = userData.completedProjects || [];

    // Create project summary for profile
    const projectSummary: ProfileProject = {
      id: projectId,
      title: projectData.title || "",
      description: projectData.description || "",
      budget: projectData.budgetMin || 0,
      status: projectData.status || "pending",
      createdAt: projectData.createdAt || Timestamp.now(),
    };

    // Update postedProjects array
    const existingProjectIndex = postedProjects.findIndex(
      (p: ProfileProject) => p.id === projectId
    );

    if (projectData.status === "cancelled") {
      // Remove project from postedProjects if it exists
      if (existingProjectIndex >= 0) {
        postedProjects.splice(existingProjectIndex, 1);
      }
    } else if (existingProjectIndex >= 0) {
      // Update existing project
      postedProjects[existingProjectIndex] = {
        ...postedProjects[existingProjectIndex],
        ...projectSummary,
      };
    } else {
      // Add new project
      postedProjects.push(projectSummary);
    }

    // Update completedProjects array if status is completed
    const completedProjectIndex = completedProjects.findIndex(
      (p: ProfileProject) => p.id === projectId
    );

    if (projectData.status === "cancelled") {
      // Remove from completed if project is cancelled
      if (completedProjectIndex >= 0) {
        completedProjects.splice(completedProjectIndex, 1);
      }
    } else if (projectData.status === "completed") {
      if (completedProjectIndex >= 0) {
        completedProjects[completedProjectIndex] = {
          ...completedProjects[completedProjectIndex],
          ...projectSummary,
          completedAt: Timestamp.now(),
        };
      } else {
        completedProjects.push({
          ...projectSummary,
          completedAt: Timestamp.now(),
        });
      }
    } else if (completedProjectIndex >= 0) {
      // Remove from completed if status changed from completed
      completedProjects.splice(completedProjectIndex, 1);
    }

    // Update user profile
    await updateDoc(userDocRef, {
      postedProjects,
      completedProjects,
      updatedAt: Timestamp.now(),
    });

    console.log(`User profile updated for buyer ${buyerId} with project ${projectId}`);
  } catch (error) {
    console.error("Error updating user profile for project:", error);
    // Don't throw error to avoid breaking the main flow
  }
};

// ===== ADMIN EMPLOYEE ASSIGNMENT FUNCTIONS =====

/**
 * Assign an employee to a project that has received 10% deposit payment
 */
export const assignEmployeeToProject = async (
  projectId: string,
  employeeId: string,
  employeeName: string,
  employeeEmail: string
): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Verify project exists and has paid status
    const projectRef = doc(db, "projects", projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      throw new Error("Project not found");
    }

    const projectData = projectDoc.data();

    // Verify payment has been made
    if (projectData.initialPaymentStatus !== "paid") {
      throw new Error("Project deposit payment must be completed before assignment");
    }

    // Update project with employee assignment
    await updateDoc(projectRef, {
      assignedEmployeeId: employeeId,
      assignedEmployeeName: employeeName,
      assignedEmployeeEmail: employeeEmail,
      assignedAt: Timestamp.now(),
      status: "assigned",
      updatedAt: Timestamp.now(),
    });

    // Update employee's profile with assigned project count
    const employeeRef = doc(db, "users", employeeId);
    const employeeDoc = await getDoc(employeeRef);

    if (employeeDoc.exists()) {
      const employeeData = employeeDoc.data();
      const currentProjects = employeeData.totalProjects || 0;

      await updateDoc(employeeRef, {
        totalProjects: currentProjects + 1,
        updatedAt: Timestamp.now(),
      });
    }

    console.log(`✅ Employee ${employeeName} assigned to project ${projectId}`);
  } catch (error) {
    console.error("Error assigning employee to project:", error);
    throw error;
  }
};

/**
 * Get all projects with paid deposits (ready for employee assignment)
 */
export const getProjectsReadyForAssignment = async (): Promise<Project[]> => {
  try {
    const projectsQuery = query(
      collection(db, "projects"),
      where("initialPaymentStatus", "==", "paid"),
      orderBy("initialPaymentAt", "desc")
    );

    const querySnapshot = await getDocs(projectsQuery);
    const projects = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        deadline: data.deadline?.toDate() || new Date(),
        pricedAt: data.pricedAt?.toDate(),
        initialPaymentAt: data.initialPaymentAt?.toDate(),
        assignedAt: data.assignedAt?.toDate(),
      } as Project;
    });

    return projects;
  } catch (error) {
    console.error("Error fetching projects ready for assignment:", error);
    throw error;
  }
};

/**
 * Toggle the urgent status of a project
 */
export const toggleProjectUrgentStatus = async (
  projectId: string,
  isUrgent: boolean
): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const projectRef = doc(db, "projects", projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      throw new Error("Project not found");
    }

    await updateDoc(projectRef, {
      isUrgent: isUrgent,
      updatedAt: Timestamp.now(),
    });

    console.log(`✅ Project ${projectId} urgent status set to: ${isUrgent}`);
  } catch (error) {
    console.error("Error toggling project urgent status:", error);
    throw error;
  }
};

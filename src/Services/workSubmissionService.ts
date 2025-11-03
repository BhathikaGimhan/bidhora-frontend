import { auth, db } from "../firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { geniePaymentService } from "./geniePaymentService";

export interface WorkSubmissionData {
  proposalId: string;
  projectId: string;
  description: string;
  files: File[];
}

export interface WorkSubmissionFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface WorkSubmission {
  id: string;
  proposalId: string;
  projectId: string;
  submitterId: string;
  projectTitle?: string;
  submitterName?: string;
  submitterPhotoURL?: string;
  buyerName?: string;
  buyerPhotoURL?: string;
  description: string;
  files: WorkSubmissionFile[];
  status: "pending_review" | "approved" | "rejected";
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  isUrgent?: boolean;
}

export interface PaymentInfo {
  submissionId: string;
  projectId: string;
  projectTitle: string;
  service_providerName: string;
  service_providerPhotoURL: string;
  amount: number;
  description: string;
  files: WorkSubmissionFile[];
  submittedAt: string;
  reviewedAt: string;
  paymentStatus: "pending" | "paid";
  paidAt: string | null;
}

// Upload file to Firebase Storage
const uploadFile = async (
  file: File,
  projectId: string,
  proposalId: string
): Promise<WorkSubmissionFile> => {
  const storage = getStorage();
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filePath = `work-submissions/${projectId}/${proposalId}/${timestamp}_${sanitizedFileName}`;

  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  return {
    name: file.name,
    url,
    size: file.size,
    type: file.type,
  };
};

// Submit work to Firestore
export const submitWork = async (
  data: WorkSubmissionData
): Promise<WorkSubmission> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Upload all files to Firebase Storage
    const uploadedFiles = await Promise.all(
      data.files.map((file) =>
        uploadFile(file, data.projectId, data.proposalId)
      )
    );

    // Get project and proposal details
    const [projectDoc, proposalDoc] = await Promise.all([
      getDoc(doc(db, "projects", data.projectId)),
      getDoc(doc(db, "proposals", data.proposalId)),
    ]);

    if (!projectDoc.exists()) {
      throw new Error("Project not found");
    }

    if (!proposalDoc.exists()) {
      throw new Error("Proposal not found");
    }

    const projectData = projectDoc.data();
    const proposalData = proposalDoc.data();

    // Get buyer details
    const buyerDoc = await getDoc(doc(db, "users", projectData!.createdBy));
    const buyerData = buyerDoc.exists() ? buyerDoc.data() : null;

    const submissionData = {
      proposalId: data.proposalId,
      projectId: data.projectId,
      submitterId: user.uid,
      projectTitle: projectData!.title || "Untitled Project",
      submitterName: user.displayName || user.email?.split("@")[0] || "Anonymous",
      submitterPhotoURL: user.photoURL || null,
      buyerName:
        buyerData?.displayName ||
        buyerData?.name ||
        buyerData?.email?.split("@")[0] ||
        "Anonymous",
      buyerPhotoURL: buyerData?.photoURL || null,
      description: data.description,
      files: uploadedFiles,
      status: "pending_review" as const,
      submittedAt: Timestamp.now(),
      reviewedAt: null,
      reviewedBy: null,
      reviewNotes: null,
    };

    const docRef = await addDoc(
      collection(db, "workSubmissions"),
      submissionData
    );

    return {
      id: docRef.id,
      ...submissionData,
      submittedAt: new Date(),
    };
  } catch (error: unknown) {
    console.error("Error submitting work:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to submit work";
    throw new Error(errorMessage);
  }
};

// Get work submissions for a proposal
export const getWorkSubmissions = async (
  proposalId: string
): Promise<WorkSubmission[]> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const submissionsQuery = query(
      collection(db, "workSubmissions"),
      where("proposalId", "==", proposalId),
      orderBy("submittedAt", "desc")
    );

    const submissionsSnapshot = await getDocs(submissionsQuery);
    const submissions = submissionsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        proposalId: data.proposalId,
        projectId: data.projectId,
        submitterId: data.submitterId || data.sellerId, // backwards compatibility
        projectTitle: data.projectTitle,
        submitterName: data.submitterName || data.sellerName, // backwards compatibility
        submitterPhotoURL: data.submitterPhotoURL || data.sellerPhotoURL, // backwards compatibility
        buyerName: data.buyerName,
        buyerPhotoURL: data.buyerPhotoURL,
        description: data.description,
        files: data.files || [],
        status: data.status,
        submittedAt: data.submittedAt?.toDate() || new Date(),
        reviewedAt: data.reviewedAt?.toDate(),
        reviewedBy: data.reviewedBy,
        reviewNotes: data.reviewNotes,
      };
    });

    return submissions;
  } catch (error: unknown) {
    console.error("Error fetching work submissions:", error);
    return [];
  }
};

// Get all work submissions for admin
export const getAllWorkSubmissions = async (): Promise<WorkSubmission[]> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if user is admin
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists() || userDoc.data()?.role !== "admin") {
      throw new Error(
        "Unauthorized: Only admins can view all work submissions"
      );
    }

    // Get both workSubmissions and employee submissions from projects
    const [workSubmissionsSnapshot, projectsSnapshot] = await Promise.all([
      getDocs(
        query(
          collection(db, "workSubmissions"),
          orderBy("submittedAt", "desc")
        )
      ),
      getDocs(
        query(
          collection(db, "projects"),
          where("status", "in", [
            "completed_by_employee",
            "needs_revision",
            "completed",
          ])
        )
      ),
    ]);

    // Process regular work submissions and fetch isUrgent from projects
    const regularSubmissions = await Promise.all(
      workSubmissionsSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // Fetch isUrgent flag from project
        let isUrgent = false;
        if (data.projectId) {
          try {
            const projectDoc = await getDoc(doc(db, "projects", data.projectId));
            if (projectDoc.exists()) {
              isUrgent = projectDoc.data()?.isUrgent || false;
            }
          } catch (error) {
            console.error(`Error fetching project ${data.projectId}:`, error);
          }
        }

        return {
          id: doc.id,
          proposalId: data.proposalId,
          projectId: data.projectId,
          submitterId: data.submitterId || data.sellerId,
          projectTitle: data.projectTitle,
          submitterName: data.submitterName || data.sellerName,
          submitterPhotoURL: data.submitterPhotoURL || data.sellerPhotoURL,
          buyerName: data.buyerName,
          buyerPhotoURL: data.buyerPhotoURL,
          description: data.description,
          files: data.files || [],
          status: data.status,
          submittedAt: data.submittedAt?.toDate() || new Date(),
          reviewedAt: data.reviewedAt?.toDate(),
          reviewedBy: data.reviewedBy,
          reviewNotes: data.reviewNotes,
          isUrgent,
        };
      })
    );

    // Process employee submissions from projects
    const employeeSubmissions = projectsSnapshot.docs
      .filter((doc) => {
        const data = doc.data();
        return data.assignedEmployeeId && data.documents && data.documents.length > 0;
      })
      .map((doc) => {
        const data = doc.data();
        
        // Determine status
        let status: "pending_review" | "approved" | "rejected" = "pending_review";
        if (data.adminReviewStatus === "approved") {
          status = "approved";
        } else if (data.adminReviewStatus === "needs_revision") {
          status = "rejected";
        }
        
        return {
          id: `employee_${doc.id}`,
          proposalId: "", // No proposal for employee assignments
          projectId: doc.id,
          submitterId: data.assignedEmployeeId,
          projectTitle: data.title,
          submitterName: data.assignedEmployeeName || "Unknown Employee",
          submitterPhotoURL: null,
          buyerName: data.buyerName || "Unknown Buyer",
          buyerPhotoURL: data.buyerPhotoURL || null,
          description: data.employeeNotes || "No description provided",
          files: data.documents || [],
          status,
          submittedAt: data.submittedToAdminAt?.toDate() || new Date(),
          reviewedAt: data.adminReviewedAt?.toDate(),
          reviewedBy: data.adminReviewedBy,
          reviewNotes: data.adminReviewNotes,
          isUrgent: data.isUrgent || false,
        };
      });

    // Combine and sort by submission date (urgent first)
    const allSubmissions = [...regularSubmissions, ...employeeSubmissions].sort(
      (a, b) => {
        // Urgent submissions come first
        if (a.isUrgent && !b.isUrgent) return -1;
        if (!a.isUrgent && b.isUrgent) return 1;
        // Then sort by submission date
        return b.submittedAt.getTime() - a.submittedAt.getTime();
      }
    );

    return allSubmissions;
  } catch (error: unknown) {
    console.error("Error fetching all work submissions:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to fetch work submissions";
    throw new Error(errorMessage);
  }
};

// Update work submission status
export const updateWorkSubmissionStatus = async (
  submissionId: string,
  status: "approved" | "rejected",
  reviewNotes?: string
): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if user is admin
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists() || userDoc.data()?.role !== "admin") {
      throw new Error("Unauthorized: Only admins can update submission status");
    }

    // Check if this is an employee submission (prefixed with "employee_")
    if (submissionId.startsWith("employee_")) {
      const projectId = submissionId.replace("employee_", "");
      const projectDoc = await getDoc(doc(db, "projects", projectId));
      
      if (!projectDoc.exists()) {
        throw new Error("Project not found");
      }

      const projectData = projectDoc.data();

      await updateDoc(doc(db, "projects", projectId), {
        adminReviewStatus: status === "approved" ? "approved" : "needs_revision",
        adminReviewedAt: Timestamp.now(),
        adminReviewedBy: user.uid,
        adminReviewNotes: reviewNotes || null,
        status: status === "approved" ? "completed" : "needs_revision",
      });

      // If approved, trigger final payment email to buyer
      if (status === "approved") {
        try {
          await geniePaymentService.initiateFinalPayment(projectId);
          console.log("Final payment notification sent to buyer");
        } catch (emailError) {
          console.error("Error sending final payment email:", emailError);
          // Don't fail the approval if email fails
        }
      }
    } else {
      // Regular work submission
      await updateDoc(doc(db, "workSubmissions", submissionId), {
        status,
        reviewedAt: Timestamp.now(),
        reviewedBy: user.uid,
        reviewNotes: reviewNotes || null,
      });
    }
  } catch (error: unknown) {
    console.error("Error updating work submission status:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to update submission status";
    throw new Error(errorMessage);
  }
};

// Get payment info for a work submission
export const getPaymentInfo = async (
  submissionId: string
): Promise<PaymentInfo | null> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Authentication required");
    }

    const submissionDoc = await getDoc(
      doc(db, "workSubmissions", submissionId)
    );
    if (!submissionDoc.exists()) {
      return null;
    }

    const submissionData = submissionDoc.data();

    // Verify user has access (either buyer or seller of the project)
    const projectDoc = await getDoc(
      doc(db, "projects", submissionData!.projectId)
    );
    if (!projectDoc.exists()) {
      throw new Error("Project not found");
    }

    const projectData = projectDoc.data();
    if (
      projectData!.createdBy !== user.uid &&
      submissionData!.sellerId !== user.uid
    ) {
      throw new Error(
        "Access denied: You don't have permission to view this payment"
      );
    }

    // Get payment record
    const paymentsQuery = query(
      collection(db, "payments"),
      where("submissionId", "==", submissionId)
    );

    const paymentsSnapshot = await getDocs(paymentsQuery);
    const paymentData =
      paymentsSnapshot.docs.length > 0 ? paymentsSnapshot.docs[0].data() : null;

    return {
      submissionId,
      projectId: submissionData!.projectId,
      projectTitle: submissionData!.projectTitle || "Untitled Project",
      service_providerName: submissionData!.sellerName || "Unknown",
      service_providerPhotoURL: submissionData!.sellerPhotoURL || "",
      amount: paymentData?.amount || 0,
      description: submissionData!.description,
      files: submissionData!.files || [],
      submittedAt:
        submissionData!.submittedAt?.toDate().toISOString() ||
        new Date().toISOString(),
      reviewedAt:
        submissionData!.reviewedAt?.toDate().toISOString() ||
        new Date().toISOString(),
      paymentStatus: paymentData?.status || "pending",
      paidAt: paymentData?.paidAt?.toDate().toISOString() || null,
    };
  } catch (error: unknown) {
    console.error("Error fetching payment info:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to load payment information";
    throw new Error(errorMessage);
  }
};

// Update payment status
export const updatePaymentStatus = async (
  submissionId: string,
  paymentId: string,
  paymentMethod: string
): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get submission to verify access
    const submissionDoc = await getDoc(
      doc(db, "workSubmissions", submissionId)
    );
    if (!submissionDoc.exists()) {
      throw new Error("Submission not found");
    }

    const submissionData = submissionDoc.data();
    const projectDoc = await getDoc(
      doc(db, "projects", submissionData!.projectId)
    );
    if (!projectDoc.exists()) {
      throw new Error("Project not found");
    }

    const projectData = projectDoc.data();
    if (projectData!.createdBy !== user.uid) {
      throw new Error(
        "Access denied: Only the buyer can update payment status"
      );
    }

    // Update or create payment record
    const paymentsQuery = query(
      collection(db, "payments"),
      where("submissionId", "==", submissionId)
    );

    const paymentsSnapshot = await getDocs(paymentsQuery);

    if (paymentsSnapshot.docs.length > 0) {
      // Update existing payment
      await updateDoc(paymentsSnapshot.docs[0].ref, {
        paymentId,
        paymentMethod,
        status: "paid",
        paidAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } else {
      // Create new payment record
      await addDoc(collection(db, "payments"), {
        submissionId,
        projectId: submissionData!.projectId,
        paymentId,
        paymentMethod,
        amount: 0, // Amount should be set when creating the payment record
        status: "paid",
        paidAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error: unknown) {
    console.error("Error updating payment status:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to update payment status";
    throw new Error(errorMessage);
  }
};

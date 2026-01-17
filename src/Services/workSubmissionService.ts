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
  submissionType?: "part" | "final" | "provider";
  partTag?: string; // For part submissions
  adminPrice?: number; // For part submissions approval
  paymentStatus?: "pending" | "paid"; // For part submissions
  paidAt?: Date; // For part submissions
  isUrgent?: boolean;
  isFinal?: boolean;
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
            "awaiting_final_payment",
          ])
        )
      ),
    ]);

    // Process regular work submissions and fetch isUrgent from projects
    const regularSubmissions = await Promise.all(
      workSubmissionsSnapshot.docs.map(async (d) => {
        const data = d.data();
        
        // Fetch isUrgent flag from project
        let isUrgent = false;
        if (data.projectId) {
          try {
            const projectDoc = await getDoc(doc(db, "projects", data.projectId));
            if (projectDoc.exists()) {
              const pData = projectDoc.data() as any;
              isUrgent = pData?.isUrgent || false;
            }
          } catch (error) {
            console.error(`Error fetching project ${data.projectId}:`, error);
          }
        }

        return {
          id: d.id,
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
        // Exclude if it uses part submissions (to avoid duplicates with partSubmissions list)
        // Unless it's a legacy project not in projectSubmissions
        if (data.hasPartSubmissions) return false;
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

    // Get part submissions from projectSubmissions
    const partSubmissionsSnapshot = await getDocs(
      query(collection(db, "projectSubmissions"), orderBy("submittedAt", "desc"))
    );

    const partSubmissions = await Promise.all(
      partSubmissionsSnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        
        let projectTitle = "Unknown Project";
        let buyerName = "Unknown Buyer";
        let buyerPhotoURL = null;
        let isUrgent = false;

        if (data.projectId) {
          try {
            const projectDoc = await getDoc(doc(db, "projects", data.projectId));
            if (projectDoc.exists()) {
              const pData = projectDoc.data() as any;
              projectTitle = pData.title || "Unknown Project";
              buyerName = pData.buyerName || "Unknown Buyer";
              buyerPhotoURL = pData.buyerPhotoURL || null;
              isUrgent = pData.isUrgent || false;
            }
          } catch (error) {
            console.error(`Error fetching project ${data.projectId} for part submission:`, error);
          }
        }

        return {
          id: `part_${docSnapshot.id}`,
          submissionType: "part" as const,
          proposalId: "", // No proposal for parts
          projectId: data.projectId,
          submitterId: data.employeeId,
          projectTitle: projectTitle,
          submitterName: data.employeeName || "Unknown Employee",
          submitterPhotoURL: data.employeePhotoURL || null,
          buyerName: buyerName,
          buyerPhotoURL: buyerPhotoURL,
          description: data.description,
          files: data.documents || [],
          status: data.status,
          submittedAt: data.submittedAt?.toDate() || new Date(),
          reviewedAt: data.reviewedAt?.toDate(),
          reviewedBy: data.reviewedBy,
          reviewNotes: data.adminNotes,
          partTag: data.partTag,
          adminPrice: data.adminPrice,
          paymentStatus: data.paymentStatus,
          paidAt: data.paidAt?.toDate(),
          isUrgent: isUrgent,
          isFinal: data.isFinal || false,
        };
      })
    );

    // Combine and sort by submission date (urgent first)
    const allSubmissions = [
      ...regularSubmissions, 
      ...employeeSubmissions,
      ...partSubmissions
    ].sort(
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
// Update work submission status
export const updateWorkSubmissionStatus = async (
  submissionId: string,
  status: "approved" | "rejected",
  reviewNotes?: string,
  adminPrice?: number // Added for part submissions
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
        status: status === "approved" ? "awaiting_final_payment" : "needs_revision",
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
    } else if (submissionId.startsWith("part_")) {
      // HANDLE PART SUBMISSION UPDATE
      const partSubmissionId = submissionId.replace("part_", "");
      
      const updateData: any = {
        status: status,
        reviewedAt: Timestamp.now(),
        reviewedBy: user.uid,
        reviewerName: userDoc.data()?.displayName || user.email,
        adminNotes: reviewNotes || null,
      };

      if (status === "approved" && adminPrice) {
        updateData.adminPrice = adminPrice;
      }

      await updateDoc(doc(db, "projectSubmissions", partSubmissionId), updateData);
      
      // Update project counters and send payment email if approved
      if (status === "approved") {
        const submissionDoc = await getDoc(doc(db, "projectSubmissions", partSubmissionId));
        if (submissionDoc.exists()) {
            const data = submissionDoc.data();
            
            console.log('📄 Part submission data:', {
              projectId: data.projectId,
              isFinal: data.isFinal,
              hasDocuments: !!data.documents,
              documentsCount: data.documents?.length,
              documentsContent: data.documents,
            });
            
            const projectRef = doc(db, "projects", data.projectId);
            const projectDoc = await getDoc(projectRef);
            if (projectDoc.exists()) {
                const pData = projectDoc.data();
                
                // Check if this is a final part submission
                const isFinalPart = data.isFinal === true;
                
                console.log('🔍 Checking final part status:', {
                  isFinalValue: data.isFinal,
                  isFinalPart,
                  strictCheck: data.isFinal === true,
                });
                
                // Update project counters
                const projectUpdateData: any = {
                    approvedParts: (pData.approvedParts || 0) + 1,
                    updatedAt: Timestamp.now()
                };
                
                // If final part, update project status for final payment
                if (isFinalPart) {
                    projectUpdateData.status = 'awaiting_final_payment';
                    projectUpdateData.adminReviewStatus = 'approved';
                    projectUpdateData.adminReviewedAt = Timestamp.now();
                    projectUpdateData.adminReviewedBy = user.uid;
                    projectUpdateData.adminReviewNotes = reviewNotes || null;
                    // Store the final part price for the final payment
                    projectUpdateData.finalPartPrice = adminPrice;
                    // Store the final part documents for download after payment
                    if (data.documents && data.documents.length > 0) {
                        projectUpdateData.finalPartDocuments = data.documents;
                        console.log('✅ Storing finalPartDocuments:', data.documents);
                    } else {
                        console.log('⚠️ No documents found in part submission');
                    }
                }
                
                console.log('📝 Project update data:', projectUpdateData);
                
                await updateDoc(projectRef, projectUpdateData);

                // Send payment notification email to buyer
                try {
                  // Get buyer details
                  const buyerUid = pData.createdBy || pData.buyerId;
                  let buyerEmail = pData.buyerEmail;
                  let buyerName = pData.buyerName || 'Valued Customer';

                  // If no buyerEmail, try to fetch from user document
                  if (!buyerEmail && buyerUid) {
                    try {
                      const userRef = doc(db, 'users', buyerUid);
                      const buyerDoc = await getDoc(userRef);
                      if (buyerDoc.exists()) {
                        const buyerData = buyerDoc.data();
                        buyerEmail = buyerData.email;
                        buyerName = buyerData.displayName || buyerData.firstName || buyerName;
                      }
                    } catch (error) {
                      console.error('Error fetching buyer details:', error);
                    }
                  }

                  if (buyerEmail && adminPrice) {
                    // Import emailService dynamically to avoid circular dependencies
                    const { emailService } = await import('./emailService');
                    
                    if (isFinalPart) {
                      // For final part, send final payment email with review link
                      const finalPaymentLink = `https://bidhora.com/payment/final/${data.projectId}`;
                      
                      await emailService.sendFinalPaymentNotification({
                        to_email: buyerEmail,
                        to_name: buyerName,
                        project_title: pData.title,
                        project_id: data.projectId,
                        amount: adminPrice,
                        payment_link: finalPaymentLink,
                        is_urgent: pData.isUrgent || false,
                      });
                      
                      console.log('✅ Final payment notification sent to buyer:', buyerEmail);
                    } else {
                      // For regular part, send part payment email
                      const paymentLink = `https://bidhora.com/payment/part/${partSubmissionId}`;
                      
                      await emailService.sendPartPaymentNotification({
                        to_email: buyerEmail,
                        to_name: buyerName,
                        project_title: pData.title,
                        part_tag: data.partTag,
                        submission_id: partSubmissionId,
                        amount: adminPrice,
                        payment_link: paymentLink,
                        is_urgent: pData.isUrgent || false,
                      });
                      
                      console.log('✅ Part payment notification sent to buyer:', buyerEmail);
                    }
                  } else {
                    console.warn('⚠️ Could not send payment email - missing buyer email or price');
                  }
                } catch (emailError) {
                  console.error('❌ Error sending payment email:', emailError);
                  // Don't fail the approval if email fails
                }
            }
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

    // Update project status to "completed" when final payment is made
    await updateDoc(doc(db, "projects", submissionData!.projectId), {
      status: "completed",
      finalPaymentStatus: "paid",
      finalPaymentId: paymentId,
      finalPaymentAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log("✅ Project status updated to 'completed' after final payment");
  } catch (error: unknown) {
    console.error("Error updating payment status:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to update payment status";
    throw new Error(errorMessage);
  }
};

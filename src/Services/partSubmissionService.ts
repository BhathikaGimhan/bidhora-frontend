import { auth, db } from '../firebaseConfig';
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
  serverTimestamp,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type {
  PartSubmission,
  PartSubmissionFile,
  SubmitPartData,
  ReviewPartData,
  PartPaymentDetails,
} from '../types/partSubmission';

/**
 * Upload file to Firebase Storage for part submission
 */
const uploadPartFile = async (
  file: File,
  projectId: string,
  partTag: string
): Promise<PartSubmissionFile> => {
  const storage = getStorage();
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const sanitizedPartTag = partTag.replace(/[^a-zA-Z0-9-]/g, '_');
  const filePath = `part-submissions/${projectId}/${sanitizedPartTag}/${timestamp}_${sanitizedFileName}`;

  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  return {
    name: file.name,
    url,
    size: file.size,
    type: file.type,
    uploadedAt: new Date(),
  };
};

/**
 * Submit a new part for a project
 */
export const submitPart = async (data: SubmitPartData): Promise<PartSubmission> => {
  console.log("🚀 Starting submitPart with data:", { ...data, files: data.files.length });
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("❌ submitPart: User not authenticated");
      throw new Error('User not authenticated');
    }
    console.log("👤 submitPart: User authenticated:", user.uid);

    // Verify employee is assigned to this project
    const projectDoc = await getDoc(doc(db, 'projects', data.projectId));
    if (!projectDoc.exists()) {
      console.error("❌ submitPart: Project not found:", data.projectId);
      throw new Error('Project not found');
    }

    const projectData = projectDoc.data();
    console.log("📄 submitPart: Project data loaded:", { assignedEmployee: projectData.assignedEmployeeId });
    
    if (projectData.assignedEmployeeId !== user.uid) {
      console.error("❌ submitPart: User not assigned to project. Assigned:", projectData.assignedEmployeeId, "User:", user.uid);
      throw new Error('You are not assigned to this project');
    }

    // Upload all files
    console.log("uploading files...");
    const uploadedFiles = await Promise.all(
      data.files.map((file) => uploadPartFile(file, data.projectId, data.partTag))
    );
    console.log("✅ submitPart: Files uploaded successfully:", uploadedFiles.length);

    const submissionData = {
      projectId: data.projectId,
      employeeId: user.uid,
      employeeName: user.displayName || user.email?.split('@')[0] || 'Employee',
      employeePhotoURL: user.photoURL || null,
      
      partTag: data.partTag,
      description: data.description,
      documents: uploadedFiles,
      
      submittedAt: serverTimestamp(),
      status: 'pending_review' as const,
      
      reviewedAt: null,
      reviewedBy: null,
      reviewerName: null,
      adminPrice: null,
      adminNotes: null,
      
      paymentStatus: 'pending' as const,
      paidAt: null,
      paymentId: null,
      isFinal: data.isFinal || false,
    };

    console.log("💾 submitPart: Saving submission to Firestore...");
    const docRef = await addDoc(collection(db, 'projectSubmissions'), submissionData);
    console.log("✅ submitPart: Submission saved with ID:", docRef.id);

    // Update project stats
    const projectUpdates: any = {
      hasPartSubmissions: true,
      totalParts: (projectData.totalParts || 0) + 1,
      updatedAt: serverTimestamp(),
    };

    // If final submission, update project status
    if (data.isFinal) {
      projectUpdates.status = 'completed_by_employee';
      projectUpdates.submittedToAdminAt = serverTimestamp();
      projectUpdates.adminReviewStatus = 'pending';
    }

    await updateDoc(doc(db, 'projects', data.projectId), projectUpdates);
    console.log("✅ submitPart: Project stats updated");

    return {
      id: docRef.id,
      ...submissionData,
      submittedAt: new Date(),
    } as PartSubmission;
  } catch (error) {
    console.error('❌ Error submitting part:', error);
    if (error instanceof Error) {
        console.error('Error stack:', error.stack);
    }
    throw error instanceof Error ? error : new Error('Failed to submit part');
  }
};

/**
 * Get all part submissions for a project
 */
export const getProjectSubmissions = async (projectId: string): Promise<PartSubmission[]> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const submissionsQuery = query(
      collection(db, 'projectSubmissions'),
      where('projectId', '==', projectId),
      orderBy('submittedAt', 'desc')
    );

    const snapshot = await getDocs(submissionsQuery);
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        projectId: data.projectId,
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        employeePhotoURL: data.employeePhotoURL,
        partTag: data.partTag,
        description: data.description,
        documents: data.documents || [],
        submittedAt: data.submittedAt?.toDate() || new Date(),
        status: data.status,
        reviewedAt: data.reviewedAt?.toDate() || null,
        reviewedBy: data.reviewedBy,
        reviewerName: data.reviewerName,
        adminPrice: data.adminPrice,
        adminNotes: data.adminNotes,
        paymentStatus: data.paymentStatus,
        paidAt: data.paidAt?.toDate() || null,
        paymentId: data.paymentId,
      };
    });
  } catch (error) {
    console.error('Error fetching project submissions:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch submissions');
  }
};

/**
 * Get all pending part submissions for admin review
 */
export const getAllPendingSubmissions = async (): Promise<PartSubmission[]> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Verify user is admin
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists() || userDoc.data()?.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const submissionsQuery = query(
      collection(db, 'projectSubmissions'),
      where('status', '==', 'pending_review'),
      orderBy('submittedAt', 'desc')
    );

    const snapshot = await getDocs(submissionsQuery);
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        projectId: data.projectId,
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        employeePhotoURL: data.employeePhotoURL,
        partTag: data.partTag,
        description: data.description,
        documents: data.documents || [],
        submittedAt: data.submittedAt?.toDate() || new Date(),
        status: data.status,
        reviewedAt: data.reviewedAt?.toDate() || null,
        reviewedBy: data.reviewedBy,
        reviewerName: data.reviewerName,
        adminPrice: data.adminPrice,
        adminNotes: data.adminNotes,
        paymentStatus: data.paymentStatus,
        paidAt: data.paidAt?.toDate() || null,
        paymentId: data.paymentId,
      };
    });
  } catch (error) {
    console.error('Error fetching pending submissions:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch pending submissions');
  }
};

/**
 * Admin approves or rejects a part submission
 */
export const reviewPartSubmission = async (reviewData: ReviewPartData): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Verify user is admin
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists() || userDoc.data()?.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    // Get submission
    const submissionDoc = await getDoc(doc(db, 'projectSubmissions', reviewData.submissionId));
    if (!submissionDoc.exists()) {
      throw new Error('Submission not found');
    }

    const submissionData = submissionDoc.data();

    // Validate: approval requires price
    if (reviewData.status === 'approved' && !reviewData.adminPrice) {
      throw new Error('Price is required for approval');
    }

    // Update submission
    await updateDoc(doc(db, 'projectSubmissions', reviewData.submissionId), {
      status: reviewData.status,
      reviewedAt: serverTimestamp(),
      reviewedBy: user.uid,
      reviewerName: userDoc.data()?.displayName || user.email,
      adminPrice: reviewData.adminPrice || null,
      adminNotes: reviewData.adminNotes || null,
    });

    // Update project stats
    const projectDoc = await getDoc(doc(db, 'projects', submissionData.projectId));
    if (projectDoc.exists()) {
      const projectData = projectDoc.data();
      const updates: any = {
        updatedAt: serverTimestamp(),
      };

      if (reviewData.status === 'approved') {
        updates.approvedParts = (projectData?.approvedParts || 0) + 1;
      }

      await updateDoc(doc(db, 'projects', submissionData.projectId), updates);
    }

    console.log(`✅ Part submission ${reviewData.status}:`, reviewData.submissionId);
  } catch (error) {
    console.error('Error reviewing part submission:', error);
    throw error instanceof Error ? error : new Error('Failed to review submission');
  }
};

/**
 * Get payment details for a specific part submission
 */
export const getPartPaymentDetails = async (
  submissionId: string
): Promise<PartPaymentDetails | null> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Authentication required');
    }

    const submissionDoc = await getDoc(doc(db, 'projectSubmissions', submissionId));
    if (!submissionDoc.exists()) {
      return null;
    }

    const submissionData = submissionDoc.data();

    // Verify submission is approved
    if (submissionData.status !== 'approved') {
      throw new Error('This part has not been approved yet');
    }

    // Get project details
    const projectDoc = await getDoc(doc(db, 'projects', submissionData.projectId));
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }

    const projectData = projectDoc.data();

    // Verify user is project owner
    const ownerId = projectData.buyerId || projectData.createdBy;
    if (ownerId !== user.uid) {
      throw new Error('Access denied: You are not the project owner');
    }

    return {
      submissionId,
      projectId: submissionData.projectId,
      projectTitle: projectData.title || 'Untitled Project',
      partTag: submissionData.partTag,
      description: submissionData.description,
      employeeName: submissionData.employeeName,
      adminPrice: submissionData.adminPrice,
      adminNotes: submissionData.adminNotes,
      documents: submissionData.documents || [],
      approvedAt: submissionData.reviewedAt?.toDate() || new Date(),
      paymentStatus: submissionData.paymentStatus,
      paidAt: submissionData.paidAt?.toDate() || null,
    };
  } catch (error) {
    console.error('Error fetching part payment details:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch payment details');
  }
};

/**
 * Process payment for a part submission
 */
export const processPartPayment = async (
  submissionId: string,
  paymentId: string
): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const submissionDoc = await getDoc(doc(db, 'projectSubmissions', submissionId));
    if (!submissionDoc.exists()) {
      throw new Error('Submission not found');
    }

    const submissionData = submissionDoc.data();

    // Update submission payment status
    await updateDoc(doc(db, 'projectSubmissions', submissionId), {
      paymentStatus: 'paid',
      paidAt: serverTimestamp(),
      paymentId,
    });

    // Update project stats
    const projectDoc = await getDoc(doc(db, 'projects', submissionData.projectId));
    if (projectDoc.exists()) {
      const projectData = projectDoc.data();
      await updateDoc(doc(db, 'projects', submissionData.projectId), {
        paidParts: (projectData?.paidParts || 0) + 1,
        totalPaidAmount: (projectData?.totalPaidAmount || 0) + (submissionData.adminPrice || 0),
        updatedAt: serverTimestamp(),
      });
    }

    console.log(`✅ Part payment processed:`, { submissionId, paymentId });
  } catch (error) {
    console.error('Error processing part payment:', error);
    throw error instanceof Error ? error : new Error('Failed to process payment');
  }
};

import { auth, db } from '../firebaseConfig';
import { collection, doc, addDoc, serverTimestamp } from 'firebase/firestore';

export interface SendAdminNoteData {
  projectId: string;
  submissionId?: string; // Optional - null for general project notes
  note: string;
  notifyViaEmail?: boolean; // Future: trigger email notification
}

/**
 * Send an admin note to a buyer
 * Can be project-level or submission-specific
 */
export const sendAdminNote = async (data: SendAdminNoteData): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Create admin note document
    await addDoc(collection(db, 'adminNotes'), {
      projectId: data.projectId,
      submissionId: data.submissionId || null,
      adminId: user.uid,
      adminName: user.displayName || user.email || 'Admin',
      note: data.note,
      sentAt: serverTimestamp(),
      sentViaEmail: data.notifyViaEmail || false,
    });

    // TODO: Trigger email notification if notifyViaEmail is true
    // This would call a Cloud Function to send the email

    console.log('✅ Admin note saved successfully');
  } catch (error) {
    console.error('Error sending admin note:', error);
    throw error instanceof Error ? error : new Error('Failed to send admin note');
  }
};

/**
 * Get all admin notes for a project
 */
export const getProjectAdminNotes = async (projectId: string) => {
  try {
    // TODO: Implement fetching admin notes from Firestore
    // This would be used by buyers to view notes from admin
    console.log('Fetching admin notes for project:', projectId);
  } catch (error) {
    console.error('Error fetching admin notes:', error);
    throw error;
  }
};

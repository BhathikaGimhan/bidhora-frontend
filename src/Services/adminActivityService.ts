import { db, auth } from "@/firebaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from "firebase/firestore";

export interface AdminActivity {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  actionType: 'user' | 'project' | 'faq' | 'review' | 'notification' | 'transaction' | 'system';
  description: string;
  targetId?: string;
  targetName?: string;
  timestamp: Date;
  metadata?: Record<string, string | number | boolean>;
}

interface AdminActivityData {
  adminId: string;
  adminEmail: string;
  action: string;
  actionType: string;
  description: string;
  targetId?: string;
  targetName?: string;
  timestamp: Timestamp;
  metadata?: Record<string, string | number | boolean>;
}

class AdminActivityService {
  private activitiesCollection = collection(db, "adminActivities");

  // Log an admin activity
  async logActivity(
    action: string,
    actionType: AdminActivity['actionType'],
    description: string,
    targetId?: string,
    targetName?: string,
    metadata?: Record<string, string | number | boolean>
  ): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.warn("No authenticated user to log activity");
        return;
      }

      await addDoc(this.activitiesCollection, {
        adminId: user.uid,
        adminEmail: user.email || "Unknown",
        action,
        actionType,
        description,
        targetId,
        targetName,
        timestamp: Timestamp.now(),
        metadata: metadata || {},
      });
    } catch (error) {
      console.error("Error logging admin activity:", error);
      // Don't throw - activity logging should not break the main flow
    }
  }

  // Get recent activities for a specific admin
  async getAdminActivities(adminId: string, limitCount: number = 10): Promise<AdminActivity[]> {
    try {
      const q = query(
        this.activitiesCollection,
        where("adminId", "==", adminId),
        orderBy("timestamp", "desc"),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc) => {
        const data = doc.data() as AdminActivityData;
        return {
          id: doc.id,
          adminId: data.adminId,
          adminEmail: data.adminEmail,
          action: data.action,
          actionType: data.actionType as AdminActivity['actionType'],
          description: data.description,
          targetId: data.targetId,
          targetName: data.targetName,
          timestamp: data.timestamp?.toDate() || new Date(),
          metadata: data.metadata,
        };
      });
    } catch (error) {
      console.error("Error fetching admin activities:", error);
      throw error;
    }
  }

  // Get all recent activities (for admin dashboard)
  async getAllRecentActivities(limitCount: number = 20): Promise<AdminActivity[]> {
    try {
      const q = query(
        this.activitiesCollection,
        orderBy("timestamp", "desc"),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc) => {
        const data = doc.data() as AdminActivityData;
        return {
          id: doc.id,
          adminId: data.adminId,
          adminEmail: data.adminEmail,
          action: data.action,
          actionType: data.actionType as AdminActivity['actionType'],
          description: data.description,
          targetId: data.targetId,
          targetName: data.targetName,
          timestamp: data.timestamp?.toDate() || new Date(),
          metadata: data.metadata,
        };
      });
    } catch (error) {
      console.error("Error fetching all activities:", error);
      throw error;
    }
  }

  // Helper methods to log common admin actions

  async logUserAction(action: string, userId: string, userName: string, description: string) {
    await this.logActivity(action, 'user', description, userId, userName);
  }

  async logProjectAction(action: string, projectId: string, projectTitle: string, description: string) {
    await this.logActivity(action, 'project', description, projectId, projectTitle);
  }

  async logFAQAction(action: string, faqId: string, faqQuestion: string, description: string) {
    await this.logActivity(action, 'faq', description, faqId, faqQuestion);
  }

  async logReviewAction(action: string, reviewId: string, reviewTarget: string, description: string) {
    await this.logActivity(action, 'review', description, reviewId, reviewTarget);
  }

  async logNotificationAction(action: string, notificationId: string, description: string) {
    await this.logActivity(action, 'notification', description, notificationId);
  }

  async logTransactionAction(action: string, transactionId: string, description: string) {
    await this.logActivity(action, 'transaction', description, transactionId);
  }

  async logSystemAction(action: string, description: string, metadata?: Record<string, string | number | boolean>) {
    await this.logActivity(action, 'system', description, undefined, undefined, metadata);
  }
}

export const adminActivityService = new AdminActivityService();

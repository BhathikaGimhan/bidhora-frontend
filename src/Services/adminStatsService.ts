import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebaseConfig";

export interface AdminStats {
  totalUsers: number;
  activeProjects: number;
  totalRevenue: number;
  totalProjects: number;
}

export const adminStatsService = {
  getAdminStats: async (): Promise<AdminStats> => {
    try {
      // Get total users count
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      const totalUsers = usersSnapshot.size;

      // Get active projects count (projects that are not completed)
      const projectsQuery = query(
        collection(db, "projects"),
        where("status", "!=", "completed")
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      const activeProjects = projectsSnapshot.size;

      // Get total projects count
      const allProjectsQuery = query(collection(db, "projects"));
      const allProjectsSnapshot = await getDocs(allProjectsQuery);
      const totalProjects = allProjectsSnapshot.size;

      // Calculate total revenue from completed projects that have been paid
      let totalRevenue = 0;
      const completedProjectsQuery = query(
        collection(db, "projects"),
        where("status", "==", "completed")
      );
      const completedProjectsSnapshot = await getDocs(completedProjectsQuery);

      completedProjectsSnapshot.forEach((doc) => {
        const projectData = doc.data();
        // Use finalPaymentAmount if available and paid, otherwise use adminPrice
        if (projectData.finalPaymentStatus === "paid" && projectData.finalPaymentAmount) {
          totalRevenue += projectData.finalPaymentAmount;
        } else if (projectData.adminPrice) {
          totalRevenue += projectData.adminPrice;
        }
      });

      return {
        totalUsers,
        activeProjects,
        totalRevenue,
        totalProjects,
      };
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      throw error;
    }
  },

  getUsersCount: async (): Promise<number> => {
    try {
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      return usersSnapshot.size;
    } catch (error) {
      console.error("Error fetching users count:", error);
      return 0;
    }
  },

  getActiveProjectsCount: async (): Promise<number> => {
    try {
      const projectsQuery = query(
        collection(db, "projects"),
        where("status", "!=", "completed")
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      return projectsSnapshot.size;
    } catch (error) {
      console.error("Error fetching active projects count:", error);
      return 0;
    }
  },

  getTotalRevenue: async (): Promise<number> => {
    try {
      let totalRevenue = 0;
      const completedProjectsQuery = query(
        collection(db, "projects"),
        where("status", "==", "completed")
      );
      const completedProjectsSnapshot = await getDocs(completedProjectsQuery);

      completedProjectsSnapshot.forEach((doc) => {
        const projectData = doc.data();
        // Use finalPaymentAmount if available and paid, otherwise use adminPrice
        if (projectData.finalPaymentStatus === "paid" && projectData.finalPaymentAmount) {
          totalRevenue += projectData.finalPaymentAmount;
        } else if (projectData.adminPrice) {
          totalRevenue += projectData.adminPrice;
        }
      });

      return totalRevenue;
    } catch (error) {
      console.error("Error fetching total revenue:", error);
      return 0;
    }
  },
};
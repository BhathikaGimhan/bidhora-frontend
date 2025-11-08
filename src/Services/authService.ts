import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "@/firebaseConfig";
import { storageService } from "./storageService";

interface UserProfile {
  message: string;
  user: {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    role: "buyer" | "employee" | "admin";
    createdAt: Date;
    updatedAt: Date;
  };
}

interface UpdateRoleRequest {
  role: "buyer" | "employee" | "admin";
  targetUserId?: string;
}

interface UpdateRoleResponse {
  message: string;
  role: string;
}

interface UpdateDesignationRequest {
  designation: string;
  targetUserId: string;
}

interface UpdateDesignationResponse {
  message: string;
  designation: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: Date;
  status: "pending" | "approved" | "active" | "completed" | "rejected";
  createdAt: Date;
  updatedAt: Date;
  buyerId: string;
  category: string;
  skills: string[];
  attachments?: string[];
}

interface ServiceProviderApplication {
  id: string;
  userId: string;
  personalInfo: Record<string, unknown>;
  professionalInfo: Record<string, unknown>;
  bankAccountInfo: Record<string, unknown>;
  idFrontImageUrl: string;
  idBackImageUrl: string;
  passbookImageUrl: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

interface AllUsersResponse {
  message: string;
  users: {
    id: string;
    uid: string;
    name: string;
    email: string;
    role: "buyer" | "employee" | "admin";
    designation?: string;
    status: "active" | "inactive" | "banned";
    avatar: string;
    joinedDate: string;
    lastActive: string;
    totalProjects: number;
    totalEarnings: number;
    rating: number;
    verified: boolean;
  }[];
}

// Helper function to ensure user document exists
const ensureUserDocument = async (user: {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}) => {
  const userRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    // Create user document if it doesn't exist
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName:
        user.displayName || user.email?.split("@")[0] || "Anonymous User",
      photoURL: user.photoURL || null,
      role: "buyer", // Default role
      status: "active",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      lastActive: Timestamp.now(),
      totalProjects: 0,
      totalEarnings: 0,
      rating: 0,
      verified: false,
    });
  } else {
    // Update last active
    await updateDoc(userRef, {
      lastActive: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
};

export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No authenticated user found");
    }

    await ensureUserDocument(user);

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      throw new Error("User profile not found");
    }

    const userData = userDoc.data();

    return {
      message: "Profile fetched successfully",
      user: {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName || "Anonymous User",
        photoURL: userData.photoURL || undefined,
        role: userData.role || "buyer",
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
      },
    };
  } catch (error: unknown) {
    console.error("Profile fetch error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch profile";
    throw new Error(errorMessage);
  }
};

export const logout = (): void => {
  // Firebase handles logout automatically
};

export const isAuthenticated = (): boolean => {
  return !!auth.currentUser;
};

export const updateUserRole = async (
  roleData: UpdateRoleRequest
): Promise<UpdateRoleResponse> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No authenticated user found");
    }

    // Check if current user is admin
    const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (!currentUserDoc.exists() || currentUserDoc.data().role !== "admin") {
      throw new Error("Unauthorized: Only admins can update user roles");
    }

    const targetUserId = roleData.targetUserId || currentUser.uid;
    const userRef = doc(db, "users", targetUserId);

    await updateDoc(userRef, {
      role: roleData.role,
      updatedAt: Timestamp.now(),
    });

    return {
      message: "Role updated successfully",
      role: roleData.role,
    };
  } catch (error: unknown) {
    console.error("Role update error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update role";
    throw new Error(errorMessage);
  }
};

export const updateUserDesignation = async (
  designationData: UpdateDesignationRequest
): Promise<UpdateDesignationResponse> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No authenticated user found");
    }

    // Check if current user is admin
    const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (!currentUserDoc.exists() || currentUserDoc.data().role !== "admin") {
      throw new Error("Unauthorized: Only admins can update employee designations");
    }

    const userRef = doc(db, "users", designationData.targetUserId);
    
    // Verify target user exists and is an employee
    const targetUserDoc = await getDoc(userRef);
    if (!targetUserDoc.exists()) {
      throw new Error("User not found");
    }
    
    if (targetUserDoc.data().role !== "employee") {
      throw new Error("Designation can only be set for employees");
    }

    await updateDoc(userRef, {
      designation: designationData.designation,
      updatedAt: Timestamp.now(),
    });

    return {
      message: "Designation updated successfully",
      designation: designationData.designation,
    };
  } catch (error: unknown) {
    console.error("Designation update error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update designation";
    throw new Error(errorMessage);
  }
};

export const getAllUsers = async (): Promise<AllUsersResponse> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No authenticated user found");
    }

    // Check if current user is admin
    const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (!currentUserDoc.exists() || currentUserDoc.data().role !== "admin") {
      throw new Error("Unauthorized: Only admins can view all users");
    }

    const usersQuery = query(
      collection(db, "users"),
      orderBy("createdAt", "desc")
    );

    const usersSnapshot = await getDocs(usersQuery);
    const users = usersSnapshot.docs.map((doc) => {
      const userData = doc.data();
      return {
        id: doc.id,
        uid: userData.uid,
        name: userData.displayName || "Anonymous User",
        email: userData.email,
        role: userData.role || "buyer",
        designation: userData.designation,
        status: userData.status || "active",
        avatar: userData.photoURL || "",
        joinedDate:
          userData.createdAt?.toDate().toISOString() ||
          new Date().toISOString(),
        lastActive:
          userData.lastActive?.toDate().toISOString() ||
          new Date().toISOString(),
        totalProjects: userData.totalProjects || 0,
        totalEarnings: userData.totalEarnings || 0,
        rating: userData.rating || 0,
        verified: userData.verified || false,
      };
    });

    return {
      message: "Users fetched successfully",
      users,
    };
  } catch (error: unknown) {
    console.error("Users fetch error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch users";
    throw new Error(errorMessage);
  }
};

// Helper function to check if user has specific role
export const hasRole = async (
  requiredRole: "buyer" | "service_provider" | "admin"
): Promise<boolean> => {
  try {
    const profile = await getUserProfile();
    return profile.user.role === requiredRole;
  } catch (error) {
    return false;
  }
};

// Helper function to check if user is admin
export const isAdmin = async (): Promise<boolean> => {
  return hasRole("admin");
};

// Helper function to check if user is service_provider
export const isServiceProvider = async (): Promise<boolean> => {
  return hasRole("service_provider");
};

// Admin-specific functions for user management
export const banUser = async (
  userId: string
): Promise<{ message: string; status: string }> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No authenticated user found");
    }

    // Check if current user is admin
    const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (!currentUserDoc.exists() || currentUserDoc.data().role !== "admin") {
      throw new Error("Unauthorized: Only admins can ban users");
    }

    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      status: "banned",
      updatedAt: Timestamp.now(),
    });

    return {
      message: "User banned successfully",
      status: "banned",
    };
  } catch (error: unknown) {
    console.error("User ban error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to ban user";
    throw new Error(errorMessage);
  }
};

export const unbanUser = async (
  userId: string
): Promise<{ message: string; status: string }> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No authenticated user found");
    }

    // Check if current user is admin
    const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (!currentUserDoc.exists() || currentUserDoc.data().role !== "admin") {
      throw new Error("Unauthorized: Only admins can unban users");
    }

    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      status: "active",
      updatedAt: Timestamp.now(),
    });

    return {
      message: "User unbanned successfully",
      status: "active",
    };
  } catch (error: unknown) {
    console.error("User unban error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to unban user";
    throw new Error(errorMessage);
  }
};

export const updateUserStatus = async (
  userId: string,
  status: "active" | "inactive" | "banned"
): Promise<{ message: string; status: string }> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No authenticated user found");
    }

    // Check if current user is admin
    const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (!currentUserDoc.exists() || currentUserDoc.data().role !== "admin") {
      throw new Error("Unauthorized: Only admins can update user status");
    }

    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      status,
      updatedAt: Timestamp.now(),
    });

    return {
      message: "User status updated successfully",
      status,
    };
  } catch (error: unknown) {
    console.error("User status update error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update user status";
    throw new Error(errorMessage);
  }
};

export const deleteUser = async (
  userId: string
): Promise<{ message: string }> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No authenticated user found");
    }

    // Check if current user is admin
    const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (!currentUserDoc.exists() || currentUserDoc.data().role !== "admin") {
      throw new Error("Unauthorized: Only admins can delete users");
    }

    // Delete user document
    await deleteDoc(doc(db, "users", userId));

    return {
      message: "User deleted successfully",
    };
  } catch (error: unknown) {
    console.error("User deletion error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete user";
    throw new Error(errorMessage);
  }
};

// Admin-specific functions for project management
export const getAllProjects = async (): Promise<{
  message: string;
  projects: Project[];
}> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No authenticated user found");
    }

    // Check if current user is admin
    const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (!currentUserDoc.exists() || currentUserDoc.data().role !== "admin") {
      throw new Error("Unauthorized: Only admins can view all projects");
    }

    const projectsQuery = query(
      collection(db, "projects"),
      orderBy("createdAt", "desc")
    );

    const projectsSnapshot = await getDocs(projectsQuery);
    const projects = projectsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || "",
        description: data.description || "",
        budget: data.budget || 0,
        deadline: data.deadline?.toDate() || new Date(),
        status: data.status || "pending",
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        buyerId: data.buyerId || "",
        category: data.category || "",
        skills: data.skills || [],
        attachments: data.attachments || [],
      } as Project;
    });

    return {
      message: "Projects fetched successfully",
      projects,
    };
  } catch (error: unknown) {
    console.error("Projects fetch error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch projects";
    throw new Error(errorMessage);
  }
};

export const updateProjectStatus = async (
  projectId: string,
  status: "pending" | "approved" | "active" | "completed" | "rejected" | "ready_to_assign"
): Promise<{ message: string; status: string }> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No authenticated user found");
    }

    // Check if current user is admin
    const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (!currentUserDoc.exists() || currentUserDoc.data().role !== "admin") {
      throw new Error("Unauthorized: Only admins can update project status");
    }

    const projectRef = doc(db, "projects", projectId);
    await updateDoc(projectRef, {
      status,
      updatedAt: Timestamp.now(),
    });

    return {
      message: "Project status updated successfully",
      status,
    };
  } catch (error: unknown) {
    console.error("Project status update error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to update project status";
    throw new Error(errorMessage);
  }
};

export const deleteProject = async (
  projectId: string
): Promise<{ message: string }> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No authenticated user found");
    }

    // Check if current user is admin
    const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (!currentUserDoc.exists() || currentUserDoc.data().role !== "admin") {
      throw new Error("Unauthorized: Only admins can delete projects");
    }

    // Delete project document
    await deleteDoc(doc(db, "projects", projectId));

    return {
      message: "Project deleted successfully",
    };
  } catch (error: unknown) {
    console.error("Project deletion error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete project";
    throw new Error(errorMessage);
  }
};

// Service Provider Application Functions - DEPRECATED (No longer using seller role)
/*
export const submitServiceProviderApplication = async (
  formData: FormData
): Promise<{ message: string }> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No authenticated user found");
    }

    // This functionality is deprecated as there is no seller role anymore
    throw new Error("Service provider applications are no longer supported");
  } catch (error: unknown) {
    console.error("Service Provider application error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to submit service provider application";
    throw new Error(errorMessage);
  }
};

export const getServiceProviderApplicationStatus = async (): Promise<{
  status: "none" | "pending" | "approved" | "rejected";
  applicationData?: ServiceProviderApplication;
}> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No authenticated user found");
    }

    // This functionality is deprecated as there is no seller role anymore
    return { status: "none" };
  } catch (error: unknown) {
    console.error("Service Provider application status error:", error);
    return { status: "none" };
  }
};
*/

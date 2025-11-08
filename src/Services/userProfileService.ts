import { auth, db } from "../firebaseConfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import {
  UserProfile,
  ProfileAPIResponse,
} from "../features/profile/types/profile";

const getAuthToken = async (): Promise<string | null> => {
  try {
    const user = auth.currentUser;
    console.log("Current user:", user?.uid, user?.email);
    if (!user) {
      console.log("No current user found");
      return null;
    }
    const token = await user.getIdToken();
    console.log("Got auth token:", token ? "Token obtained" : "No token");
    return token;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

export const userProfileService = {
  getProfile: async (): Promise<ProfileAPIResponse> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      console.log("Fetching profile for current user:", currentUser.uid);

      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        throw new Error("Profile not found");
      }

      const userData = userDocSnap.data();
      console.log("Profile data received:", userData);

      // Convert Firestore data to UserProfile format
      const profile: UserProfile = {
        uid: userData.uid || currentUser.uid,
        name: userData.displayName || userData.name || "",
        email: userData.email || currentUser.email || "",
        displayName: userData.displayName || "",
        profileUrl: userData.photoURL || userData.profileUrl || "",
        photoURL: userData.photoURL || "",
        coverImage: userData.coverImage || "",
        role: userData.role || "user",
        designation: userData.designation,
        isVerified: userData.isVerified || false,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        status: userData.status || "active",
        username: userData.username || "",
        headline: userData.headline || "",
        bio: userData.bio || "",
        rating: userData.rating || 0,
        totalReviews: userData.totalReviews || 0,
        responseTime: userData.responseTime || "",
        languages: userData.languages || [],
        credits: userData.credits || 0,
        availability: userData.availability || "available",
        location: userData.location || "",
        phoneNumber: userData.phoneNumber || "",
        skills: userData.skills || [],
        averageRating: userData.averageRating || 0,
        completedProjects: userData.completedProjects || [],
        postedProjects: userData.postedProjects || [],
      };

      return {
        message: "Profile fetched successfully",
        user: profile,
        isOwnProfile: true,
      };
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }
  },

  getProfileById: async (userId: string): Promise<ProfileAPIResponse> => {
    try {
      const currentUser = auth.currentUser;
      console.log("🔍 Fetching profile for userId:", userId);

      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        throw new Error("Profile not found");
      }

      const userData = userDocSnap.data();
      console.log("✅ Profile data received for userId:", userId);

      // Convert Firestore data to UserProfile format
      const profile: UserProfile = {
        uid: userData.uid || userId,
        name: userData.displayName || userData.name || "",
        email: userData.email || "",
        displayName: userData.displayName || "",
        profileUrl: userData.photoURL || userData.profileUrl || "",
        photoURL: userData.photoURL || "",
        coverImage: userData.coverImage || "",
        role: userData.role || "user",
        designation: userData.designation,
        isVerified: userData.isVerified || false,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        status: userData.status || "active",
        username: userData.username || "",
        headline: userData.headline || "",
        bio: userData.bio || "",
        rating: userData.rating || 0,
        totalReviews: userData.totalReviews || 0,
        responseTime: userData.responseTime || "",
        languages: userData.languages || [],
        credits: userData.credits || 0,
        availability: userData.availability || "available",
        location: userData.location || "",
        phoneNumber: userData.phoneNumber || "",
        skills: userData.skills || [],
        averageRating: userData.averageRating || 0,
        completedProjects: userData.completedProjects || [],
        postedProjects: userData.postedProjects || [],
      };

      const isOwnProfile = currentUser?.uid === userId;

      console.log("👤 Profile UID:", profile.uid);
      console.log("📧 Profile email:", profile.email);
      console.log("🔐 Is own profile:", isOwnProfile);

      return {
        message: "Profile fetched successfully",
        user: profile,
        isOwnProfile,
      };
    } catch (error) {
      console.error("Error fetching profile by ID:", error);
      throw error;
    }
  },

  getCurrentUserProfile: async (): Promise<ProfileAPIResponse> => {
    return userProfileService.getProfile();
  },

  getUserProfileById: async (userId: string): Promise<ProfileAPIResponse> => {
    return userProfileService.getProfileById(userId);
  },

  updateProfile: async (
    profileData: Partial<UserProfile>
  ): Promise<{ message: string; updatedFields: string[] }> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      const userDocRef = doc(db, "users", currentUser.uid);

      // Prepare update data
      const updateData: Record<string, unknown> = {
        ...profileData,
        updatedAt: new Date(),
      };

      // Remove undefined values
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      await updateDoc(userDocRef, updateData);

      const updatedFields = Object.keys(updateData);

      return {
        message: "Profile updated successfully",
        updatedFields,
      };
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },

  updateProfileField: async (
    field: string,
    value: unknown
  ): Promise<{ message: string; updatedFields: string[] }> => {
    try {
      const profileData = { [field]: value };
      return await userProfileService.updateProfile(profileData);
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      throw error;
    }
  },

  updatePhotoURL: async (
    photoURL: string
  ): Promise<{ message: string; updatedFields: string[] }> => {
    return userProfileService.updateProfileField("photoURL", photoURL);
  },

  updateBio: async (
    bio: string
  ): Promise<{ message: string; updatedFields: string[] }> => {
    return userProfileService.updateProfileField("bio", bio);
  },

  updateSkills: async (
    skills: string[]
  ): Promise<{ message: string; updatedFields: string[] }> => {
    return userProfileService.updateProfileField("skills", skills);
  },

  updateHeadline: async (
    headline: string
  ): Promise<{ message: string; updatedFields: string[] }> => {
    return userProfileService.updateProfileField("headline", headline);
  },

  updateDisplayName: async (
    displayName: string
  ): Promise<{ message: string; updatedFields: string[] }> => {
    return userProfileService.updateProfileField("displayName", displayName);
  },

  updateMultipleFields: async (
    fields: Partial<UserProfile>
  ): Promise<{ message: string; updatedFields: string[] }> => {
    return userProfileService.updateProfile(fields);
  },
};

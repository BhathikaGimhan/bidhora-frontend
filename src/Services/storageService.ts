import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { auth } from "@/firebaseConfig";

const storage = getStorage();

/**
 * Firebase Storage Service for profile images
 */
export const storageService = {
  /**
   * Upload profile picture and get download URL
   */
  uploadProfilePicture: async (file: File): Promise<string> => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      // Create a reference to the file location
      const fileName = `profile-pictures/${user.uid}/${Date.now()}_${
        file.name
      }`;
      const storageRef = ref(storage, fileName);

      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      return downloadURL;
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      throw new Error("Failed to upload profile picture");
    }
  },

  /**
   * Delete profile picture from storage
   */
  deleteProfilePicture: async (imageUrl: string): Promise<void> => {
    try {
      // Extract the storage path from the URL
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      // Don't throw error for deletion failures as the main operation might still succeed
    }
  },

  /**
   * Validate image file
   */
  validateImage: (file: File): { valid: boolean; error?: string } => {
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return { valid: false, error: "Image size should be less than 5MB" };
    }

    // Check file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: "Only JPEG, PNG, and WebP images are allowed",
      };
    }

    return { valid: true };
  },

  /**
   * Get optimized image URL for different sizes
   */
  getOptimizedImageUrl: (
    url: string,
    size: "thumbnail" | "medium" | "large" = "medium"
  ): string => {
    // This would be implemented with a service like Firebase Image Resizing
    // For now, return the original URL
    return url;
  },
};

/**
 * Image processing utilities
 */
export const imageUtils = {
  /**
   * Resize image before upload
   */
  resizeImage: (
    file: File,
    maxWidth: number = 400,
    maxHeight: number = 400,
    quality: number = 0.8
  ): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const resizedFile = new File([blob!], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  },

  /**
   * Generate image preview URL
   */
  generatePreview: (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  },
};

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
  arrayUnion,
  arrayRemove,
  increment,
} from "firebase/firestore";
import { auth, db } from "@/firebaseConfig";
import { Review } from "../types/profile";

export class ReviewService {
  // Add a new review
  static async addReview(reviewData: Omit<Review, 'id' | 'createdAt' | 'helpfulVotes' | 'reactions'>): Promise<string> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      // Verify that the reviewer has completed projects with the reviewee
      const hasCompletedProjects = await this.hasCompletedProjectsWithUser(
        reviewData.reviewerId,
        reviewData.revieweeId
      );

      if (!hasCompletedProjects) {
        throw new Error("You can only review users you've completed projects with");
      }

      const review: Omit<Review, 'id'> = {
        ...reviewData,
        createdAt: Timestamp.now(),
        isVerified: true,
        helpfulVotes: [],
        reactions: {
          likes: [],
          dislikes: [],
        },
      };

      const docRef = await addDoc(collection(db, "reviews"), review);

      // Update the reviewee's rating and review count
      await this.updateUserRating(reviewData.revieweeId);

      return docRef.id;
    } catch (error) {
      console.error("Error adding review:", error);
      throw error;
    }
  }

  // Get reviews for a user
  static async getUserReviews(userId: string): Promise<Review[]> {
    try {
      const q = query(
        collection(db, "reviews"),
        where("revieweeId", "==", userId),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const reviews: Review[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reviews.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        } as Review);
      });

      return reviews;
    } catch (error) {
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === "failed-precondition" && firebaseError.message?.includes("index")) {
        console.error("Firestore index required. Please create the index using the provided URL in the error message.");
      } else {
        console.error("Error getting user reviews:", error);
      }
      throw error;
    }
  }

  // Mark review as helpful
  static async markReviewHelpful(reviewId: string, userId: string): Promise<void> {
    try {
      const reviewRef = doc(db, "reviews", reviewId);
      const reviewDoc = await getDoc(reviewRef);

      if (!reviewDoc.exists()) {
        throw new Error("Review not found");
      }

      const reviewData = reviewDoc.data();
      const helpfulVotes = reviewData.helpfulVotes || [];

      if (helpfulVotes.includes(userId)) {
        // Remove helpful vote
        await updateDoc(reviewRef, {
          helpfulVotes: arrayRemove(userId),
        });
      } else {
        // Add helpful vote
        await updateDoc(reviewRef, {
          helpfulVotes: arrayUnion(userId),
        });
      }
    } catch (error) {
      console.error("Error marking review as helpful:", error);
      throw error;
    }
  }

  // React to a review (like/dislike)
  static async reactToReview(reviewId: string, userId: string, reaction: 'like' | 'dislike'): Promise<void> {
    try {
      const reviewRef = doc(db, "reviews", reviewId);
      const reviewDoc = await getDoc(reviewRef);

      if (!reviewDoc.exists()) {
        throw new Error("Review not found");
      }

      const reviewData = reviewDoc.data();
      const likes = reviewData.reactions?.likes || [];
      const dislikes = reviewData.reactions?.dislikes || [];

      if (reaction === 'like') {
        if (likes.includes(userId)) {
          // Remove like
          await updateDoc(reviewRef, {
            'reactions.likes': arrayRemove(userId),
          });
        } else {
          // Add like and remove dislike if exists
          await updateDoc(reviewRef, {
            'reactions.likes': arrayUnion(userId),
            'reactions.dislikes': arrayRemove(userId),
          });
        }
      } else if (reaction === 'dislike') {
        if (dislikes.includes(userId)) {
          // Remove dislike
          await updateDoc(reviewRef, {
            'reactions.dislikes': arrayRemove(userId),
          });
        } else {
          // Add dislike and remove like if exists
          await updateDoc(reviewRef, {
            'reactions.dislikes': arrayUnion(userId),
            'reactions.likes': arrayRemove(userId),
          });
        }
      }
    } catch (error) {
      console.error("Error reacting to review:", error);
      throw error;
    }
  }

    // Check if user has completed projects with another user
  static async hasCompletedProjectsWithUser(userId1: string, userId2: string): Promise<boolean> {
    try {
      // Check if userId1 has completed projects where userId2 was involved
      const q1 = query(
        collection(db, "projects"),
        where("buyerId", "==", userId1),
        where("serviceProviderId", "==", userId2),
        where("status", "==", "completed")
      );

      const q2 = query(
        collection(db, "projects"),
        where("buyerId", "==", userId2),
        where("serviceProviderId", "==", userId1),
        where("status", "==", "completed")
      );

      const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);

      return !snapshot1.empty || !snapshot2.empty;
    } catch (error) {
      console.error("Error checking completed projects:", error);
      return false;
    }
  }

  // Update user's rating and review count
  static async updateUserRating(userId: string): Promise<void> {
    try {
      const userReviews = await this.getUserReviews(userId);
      
      if (userReviews.length === 0) {
        return;
      }

      const totalRating = userReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / userReviews.length;

      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        rating: averageRating,
        reviewCount: userReviews.length,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating user rating:", error);
      throw error;
    }
  }

  // Get all reviews from all users (for review center)
  static async getAllReviews(): Promise<Review[]> {
    try {
      const q = query(
        collection(db, "reviews"),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const allReviews: Review[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        allReviews.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        } as Review);
      });

      return allReviews;
    } catch (error) {
      console.error("Error getting all reviews:", error);
      throw error;
    }
  }
}
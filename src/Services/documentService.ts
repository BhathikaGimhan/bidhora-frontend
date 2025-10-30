import { auth, db } from "../firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export interface ProjectDocument {
  id: string;
  name: string;
  url: string;
  size?: number;
  type?: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export const getProjectDocuments = async (
  projectId: string
): Promise<ProjectDocument[]> => {
  try {
    // Query documents collection for documents belonging to this project
    const documentsRef = collection(db, "documents");
    const q = query(documentsRef, where("projectId", "==", projectId));
    const querySnapshot = await getDocs(q);

    const documents: ProjectDocument[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      documents.push({
        id: doc.id,
        name: data.name || "",
        url: data.url || "",
        size: data.size,
        type: data.type,
        uploadedAt: data.uploadedAt?.toDate() || new Date(),
        uploadedBy: data.uploadedBy || "",
      });
    });

    return documents;
  } catch (error) {
    console.error("Error fetching project documents:", error);
    return [];
  }
};

export const getUserDetails = async (userId: string) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return null;
    }

    const userData = userDocSnap.data();

    // Return user details in the expected format
    return {
      uid: userData.uid || userId,
      name: userData.displayName || userData.name || "",
      email: userData.email || "",
      displayName: userData.displayName || "",
      photoURL: userData.photoURL || "",
      role: userData.role || "user",
      isVerified: userData.isVerified || false,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      status: userData.status || "active",
      headline: userData.headline || "",
      bio: userData.bio || "",
      skills: userData.skills || [],
      location: userData.location || "",
      phoneNumber: userData.phoneNumber || "",
    };
  } catch (error) {
    console.error("Error fetching user details:", error);
    return null;
  }
};

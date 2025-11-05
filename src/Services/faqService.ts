import { db } from "@/firebaseConfig";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";

export interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface FAQData {
  category: string;
  question: string;
  answer: string;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

class FAQService {
  private faqsCollection = collection(db, "faqs");

  // Get all FAQs
  async getAllFAQs(): Promise<FAQ[]> {
    try {
      const q = query(this.faqsCollection, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc) => {
        const data = doc.data() as FAQData;
        return {
          id: doc.id,
          category: data.category,
          question: data.question,
          answer: data.answer,
          tags: data.tags || [],
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      });
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      throw error;
    }
  }

  // Get FAQ by ID
  async getFAQById(id: string): Promise<FAQ | null> {
    try {
      const docRef = doc(this.faqsCollection, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as FAQData;
        return {
          id: docSnap.id,
          category: data.category,
          question: data.question,
          answer: data.answer,
          tags: data.tags || [],
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching FAQ:", error);
      throw error;
    }
  }

  // Add new FAQ
  async addFAQ(faq: Omit<FAQ, "id" | "createdAt" | "updatedAt">): Promise<string> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(this.faqsCollection, {
        category: faq.category,
        question: faq.question,
        answer: faq.answer,
        tags: faq.tags || [],
        createdAt: now,
        updatedAt: now,
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding FAQ:", error);
      throw error;
    }
  }

  // Update FAQ
  async updateFAQ(id: string, faq: Omit<FAQ, "id" | "createdAt" | "updatedAt">): Promise<void> {
    try {
      const docRef = doc(this.faqsCollection, id);
      await updateDoc(docRef, {
        category: faq.category,
        question: faq.question,
        answer: faq.answer,
        tags: faq.tags || [],
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating FAQ:", error);
      throw error;
    }
  }

  // Delete FAQ
  async deleteFAQ(id: string): Promise<void> {
    try {
      const docRef = doc(this.faqsCollection, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      throw error;
    }
  }

  // Get FAQs by category
  async getFAQsByCategory(category: string): Promise<FAQ[]> {
    try {
      const allFaqs = await this.getAllFAQs();
      return allFaqs.filter((faq) => faq.category === category);
    } catch (error) {
      console.error("Error fetching FAQs by category:", error);
      throw error;
    }
  }
}

export const faqService = new FAQService();

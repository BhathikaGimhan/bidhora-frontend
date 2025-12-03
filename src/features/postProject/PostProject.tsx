import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import HeroSection from "./components/HeroSection";
import ProjectForm from "./components/ProjectForm";
import { auth, db } from "@/firebaseConfig";
import { User } from "firebase/auth";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, ArrowRight } from "lucide-react";
import { updateUserProfileForProject } from "../../Services/projectService";
import { PhoneNumberModal } from "./components/PhoneNumberModal";
import { userProfileService } from "@/Services/userProfileService";
import SEO from "@/components/SEO";

export interface FormData {
  title: string;
  description: string;
  budgetMin: string;
  budgetMax: string;
  deadline: string;
  location: string;
  skills: string[];
  isUrgent: boolean;
  category: string;
  projectImage: File | null;
  projectFiles: File[];
}

const PostProject = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPostAnotherModal, setShowPostAnotherModal] = useState(false);
  const [showPhoneNumberModal, setShowPhoneNumberModal] = useState(false);

  const initialFormData: FormData = {
    title: "",
    description: "",
    budgetMin: "",
    budgetMax: "",
    deadline: "",
    location: "",
    skills: [],
    isUrgent: false,
    category: "",
    projectImage: null,
    projectFiles: [],
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);

  const validateForm = (): string | null => {
    // Required field validations
    if (!formData.title || formData.title.trim() === "") {
      return "Project title is required.";
    }
    if (formData.title.length < 10) {
      return "Project title must be at least 10 characters long.";
    }
    if (formData.title.length > 100) {
      return "Project title must not exceed 100 characters.";
    }

    if (!formData.description || formData.description.trim() === "") {
      return "Project description is required.";
    }
    if (formData.description.length < 50) {
      return "Project description must be at least 50 characters long.";
    }
    if (formData.description.length > 2000) {
      return "Project description must not exceed 2000 characters.";
    }

    if (!formData.category || formData.category === "") {
      return "Category is required. Please select a category.";
    }

    if (!formData.budgetMin || formData.budgetMin.trim() === "") {
      return "Minimum budget is required.";
    }
    if (Number(formData.budgetMin) <= 0) {
      return "Minimum budget must be greater than zero.";
    }
    if (Number(formData.budgetMin) > 1000000) {
      return "Minimum budget seems to high. Please verify.";
    }

    if (formData.budgetMax && formData.budgetMax.trim() !== "") {
      if (Number(formData.budgetMax) <= 0) {
        return "Maximum budget must be greater than zero.";
      }
      if (Number(formData.budgetMin) > Number(formData.budgetMax)) {
        return "Minimum budget cannot exceed maximum budget.";
      }
    }

    if (!formData.deadline || formData.deadline === "") {
      return "Deadline is required.";
    }
    const deadlineDate = new Date(formData.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadlineDate < today) {
      return "Deadline cannot be in the past.";
    }

    if (!formData.location || formData.location.trim() === "") {
      return "Location is required.";
    }

    if (!formData.skills || formData.skills.length === 0) {
      return "At least one skill is required.";
    }
    if (formData.skills.length > 10) {
      return "Maximum 10 skills allowed.";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // First, validate the form
    const error = validateForm();
    if (error) {
      toast({
        title: "Validation Error",
        description: error,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to post a project.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Check if user has a phone number
      const userProfile = await userProfileService.getProfile();
      if (!userProfile.user.phoneNumber || userProfile.user.phoneNumber.trim() === "") {
        // Show phone number modal
        setIsSubmitting(false);
        setShowPhoneNumberModal(true);
        return;
      }

      // Continue with project submission
      await submitProject(user);
    } catch (error: unknown) {
      console.error("Submission error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Submission Failed",
        description:
          errorMessage || "An error occurred while posting the project.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const handlePhoneNumberAdded = async () => {
    // After phone number is added, retry the submission
    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to post a project.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Verify phone number was added
      const userProfile = await userProfileService.getProfile();
      if (!userProfile.user.phoneNumber || userProfile.user.phoneNumber.trim() === "") {
        toast({
          title: "Phone Number Required",
          description: "Please add your phone number to continue.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Continue with project submission
      await submitProject(user);
    } catch (error: unknown) {
      console.error("Submission error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Submission Failed",
        description:
          errorMessage || "An error occurred while posting the project.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const submitProject = async (user: User) => {
    try {
      let imageUrl = null;
      const documents: Array<{
        url: string;
        name: string;
        type: string;
        size: number;
        uploadedAt: string;
      }> = [];

      // Handle main project image upload
      if (formData.projectImage) {
        // Validate file size and type
        if (formData.projectImage.size > 5 * 1024 * 1024) {
          throw new Error("Image file size must be less than 5MB");
        }
        if (
          !["image/jpeg", "image/png", "image/jpg"].includes(
            formData.projectImage.type
          )
        ) {
          throw new Error("Only JPEG, JPG, or PNG images are allowed");
        }

        const storage = getStorage();
        const fileName = `projects/${user.uid}/${Date.now()}_${
          formData.projectImage.name
        }`;
        const imageRef = storageRef(storage, fileName);
        try {
          const snapshot = await uploadBytes(imageRef, formData.projectImage);
          imageUrl = await getDownloadURL(snapshot.ref);
          console.log("Image uploaded successfully:", imageUrl);
        } catch (uploadError: unknown) {
          console.error("Storage upload error:", uploadError);
          const errorMessage =
            uploadError instanceof Error
              ? uploadError.message
              : "Unknown error occurred";
          throw new Error(`Failed to upload image: ${errorMessage}`);
        }
      }

      // Handle multiple file uploads
      if (formData.projectFiles && formData.projectFiles.length > 0) {
        const storage = getStorage();

        for (let i = 0; i < formData.projectFiles.length; i++) {
          const file = formData.projectFiles[i];

          // Validate file size (10MB limit for documents)
          if (file.size > 10 * 1024 * 1024) {
            throw new Error(`File "${file.name}" exceeds maximum size of 10MB`);
          }

          try {
            const fileName = `projects/${user.uid}/files/${Date.now()}_${i}_${
              file.name
            }`;
            const fileRef = storageRef(storage, fileName);
            const snapshot = await uploadBytes(fileRef, file);
            const fileUrl = await getDownloadURL(snapshot.ref);
            documents.push({
              url: fileUrl,
              name: file.name,
              type: file.type,
              size: file.size,
              uploadedAt: new Date().toISOString(),
            });
            console.log(`File ${i + 1} uploaded successfully:`, fileUrl);
          } catch (uploadError: unknown) {
            console.error(
              `Storage upload error for file ${file.name}:`,
              uploadError
            );
            const errorMessage =
              uploadError instanceof Error
                ? uploadError.message
                : "Unknown error occurred";
            throw new Error(
              `Failed to upload file "${file.name}": ${errorMessage}`
            );
          }
        }
      }

      // Create project document in Firestore
      const projectData = {
        title: formData.title,
        description: formData.description,
        budgetMin: Number(formData.budgetMin),
        budgetMax: formData.budgetMax ? Number(formData.budgetMax) : null,
        deadline: Timestamp.fromDate(new Date(formData.deadline)),
        location: formData.location,
        skills: formData.skills,
        isUrgent: formData.isUrgent,
        category: formData.category,
        imageUrl,
        documents: documents,
        createdBy: user.uid, // Standard field for owner identification
        buyerId: user.uid,   // Legacy/alternative field for backwards compatibility
        buyerName: user.displayName || user.email?.split("@")[0] || "Anonymous",
        buyerEmail: user.email,
        status: "pending", // pending, admin_review, priced, customer_approved, approved, assigned, completed_by_employee, completed, cancelled
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        proposalsCount: 0,
        viewsCount: 0,
      };

      const docRef = await addDoc(collection(db, "projects"), projectData);
      console.log("Project created successfully with ID:", docRef.id);

      // Update user profile with the new project
      await updateUserProfileForProject(user.uid, docRef.id, {
        ...projectData,
        deadline: projectData.deadline.toDate(),
        createdAt: projectData.createdAt.toDate(),
        updatedAt: projectData.updatedAt.toDate(),
        id: docRef.id,
      });

      // Show success modal instead of toast
      setShowSuccessModal(true);
    } catch (error: unknown) {
      console.error("Submission error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Submission Failed",
        description:
          errorMessage || "An error occurred while posting the project.",
        variant: "destructive",
      });
      throw error; // Re-throw to be caught by caller
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Post a Project" 
        description="Post your project on Bidhora and hire the best professionals in Sri Lanka. Web Development, Graphic Design, Writing, and more."
      />
      <HeroSection />
      <main className="container mx-auto px-4 py-8 pt-8 pb-24 ">
        <Card className="bg-card border border-border shadow-lg max-w-3xl mx-auto mt-0">
          <CardHeader>
            <CardTitle className="text-2xl text-card-foreground">
              Post Your Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => navigate(-1)}
            />
          </CardContent>
        </Card>
      </main>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-green-700">
              Project Posted Successfully! 🎉
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Your project has been created and submitted for review. You can now view and manage your project from your profile.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-6">
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                navigate(`/profile/${auth.currentUser?.uid}`);
              }}
              className="w-full bg-primary hover:bg-primary/90"
            >
              View My Projects
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowSuccessModal(false);
                setShowPostAnotherModal(true);
              }}
              className="w-full"
            >
              Post Another Job
            </Button>

            {/* Post Another Job Modal */}
            <Dialog open={showPostAnotherModal} onOpenChange={setShowPostAnotherModal}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center">
                  <DialogTitle className="text-xl font-semibold">
                    Ready to Post Another Job?
                  </DialogTitle>
                  <DialogDescription className="text-center text-muted-foreground">
                    You can start creating a new job post right away.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-center gap-4 mt-6">
                  <Button
                    onClick={() => {
                      setShowPostAnotherModal(false);
                      navigate("/post-project");
                    }}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Yes, Post Now
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPostAnotherModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </DialogContent>
      </Dialog>

      {/* Phone Number Modal */}
      <PhoneNumberModal
        open={showPhoneNumberModal}
        onOpenChange={setShowPhoneNumberModal}
        onPhoneNumberAdded={handlePhoneNumberAdded}
      />
    </div>
  );
};

export default PostProject;

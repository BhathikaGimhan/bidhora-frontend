import { Dispatch, SetStateAction } from "react";
import { FormData } from "../PostProject"; // This should now work
import ProjectTitleInput from "@/features/postProject/components/ProjectTitleInput";
import CategorySelect from "@/features/postProject/components/CategorySelect";
import DescriptionTextarea from "@/features/postProject/components/DescriptionTextarea";
import BudgetFields from "@/features/postProject/components/BudgetFields";
import DeadlineLocationFields from "@/features/postProject/components/DeadlineLocationFields";
import SkillsInput from "@/features/postProject/components/SkillsInput";
import UrgentCheckbox from "@/features/postProject/components/UrgentCheckbox";
import FormActions from "@/features/postProject/components/FormActions";
import ImageUpload from "@/features/postProject/components/ImageUpload";
import MultipleFileUpload from "@/features/postProject/components/MultipleFileUpload";

interface Props {
  formData: FormData;
  setFormData: Dispatch<SetStateAction<FormData>>;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

const categories = [
  // Software Development Main
  "Web Development",
  "Mobile App Development (Android / iOS)",
  "Desktop Application Development",
  "Game Development",
  "Chatbot Development",
  "API Development & Integration",
  "Bug Fixing / Debugging",
  "Custom Software Development",
  "Database Design & Management",
  "Automation Scripts (Python, JS, etc.)",
  "UI/UX Frontend Development (React, Vue, Angular)",
  
  // Graphic Design Main
  "Logo Design",
  "Business Card & Stationery Design",
  "Flyer / Brochure Design",
  "Poster Design",
  "Social Media Post Design",
  "Banner / Ad Design",
  "Infographic Design",
  "T-shirt & Merchandise Design",
  "Packaging Design",
  "Illustration",
  "Presentation Design (PowerPoint / Pitch Decks)",
  "Website UI/UX Design",
  "3D Product Mockups",
  "Brand Style Guides",
  
  // Video Editing
  "YouTube Video Editing",
  "Short Form Content (TikTok / Reels) Editing",
  "Promotional / Advertisement Video Editing",
  "Wedding / Event Video Editing",
  "Color Grading & Correction",
  "Subtitle / Caption Adding",
  "Green Screen Editing",
  "VFX / Motion Graphics",
  "Slideshow / Photo-to-Video",
  "Intro / Outro Creation",
  "Music Video Editing",
  "Podcast Video Editing",
  
  // Academic Writing & Note Writing
  "Essay Writing",
  "Research Paper Writing",
  "Report Writing",
  "Thesis / Dissertation Assistance",
  "Literature Review Writing",
  "Case Study Writing",
  "Note Writing (Handwritten / Typed Lecture Notes)",
  "Summarizing Textbooks or Lessons",
  "Study Guide Preparation",
  "Proofreading & Editing",
  "Data Analysis (SPSS / Excel / R)",
  "PowerPoint Presentation Preparation",
  "Academic Referencing (APA, MLA, Harvard, etc.)",
  "Assignment Help (School / University level)",
  "Research Proposal Writing",
];

const ProjectForm: React.FC<Props> = ({ formData, setFormData, onSubmit, isSubmitting, onCancel }) => {
  const handleInputChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <ProjectTitleInput
        value={formData.title}
        onChange={(value) => handleInputChange("title", value)}
      />
      <CategorySelect
        categories={categories}
        value={formData.category}
        onChange={(value) => handleInputChange("category", value)}
      />
      <DescriptionTextarea
        value={formData.description}
        onChange={(value) => handleInputChange("description", value)}
      />
      <BudgetFields
        values={{ budgetMin: formData.budgetMin, budgetMax: formData.budgetMax }}
        onChange={handleInputChange}
      />
      <DeadlineLocationFields
        values={{ deadline: formData.deadline, location: formData.location }}
        onChange={handleInputChange}
      />
      <SkillsInput
        skills={formData.skills}
        onChange={(value) => handleInputChange("skills", value)}
      />
      <UrgentCheckbox
        checked={formData.isUrgent}
        onChange={(value) => handleInputChange("isUrgent", value)}
      />
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          Project Image (Optional)
        </label>
        <ImageUpload onFileSelect={(file) => handleInputChange("projectImage", file)} />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          Additional Files (Optional)
          <span className="text-xs text-muted-foreground ml-2">
            Upload documents, PDFs, images, etc.
          </span>
        </label>
        <MultipleFileUpload 
          onFilesSelect={(files) => handleInputChange("projectFiles", files)}
          maxFiles={10}
          maxFileSize={10}
        />
      </div>
      <FormActions onCancel={onCancel} isSubmitting={isSubmitting} />
    </form>
  );
};

export default ProjectForm;
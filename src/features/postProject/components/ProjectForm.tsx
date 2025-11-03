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
  // Writing & Translation
  "Articles & Blog Posts",
  "Copywriting",
  "Translation",
  "Proofreading",
  "Resume Writing",
  "Business Names & Slogans",
  
  // Academic Services
  "Report Writing",
  "Assignments",
  "Presentations",
  "Research Papers",
  "Thesis & Dissertation Assistance",
  
  // Finance & Accounting
  "Bookkeeping",
  "Business Valuation",
  "Financial Forecasting",
  
  // Consulting & Career
  "Business Consulting",
  "Resume Review",
  "Career Coaching",
  
  // Business
  "Business Plans",
  "Market Research",
  "Virtual Assistance",
  "Branding Services",
  
  // Digital Marketing
  "SEO",
  "Social Media Marketing",
  "Email Marketing",
  "Marketing Strategy",
  
  // Programming & Tech
  "Website & App Development",
  "Game Development",
  "Chatbot & Automation",
  "Software Development",
  "AI Tools Setup",
  
  // Graphics & Design
  "Logo Design",
  "Illustrations",
  "Web Design",
  "Product & Packaging Design",
  "3D Models",
  
  // Music & Audio
  "Voice Overs",
  "Mixing & Mastering",
  "Podcast Editing",
  "Music Production",
  
  // AI Services
  "AI Image Generation",
  "AI Voiceover",
  "AI Video",
  
  // Lifestyle
  "Life Coaching",
  "Fitness & Diet Plans",
  "Online Lessons",
  
  // Video & Animation
  "Video Editing",
  "Explainer Videos",
  "3D Animation",
  "Logo Animation",
  "Product & Ad Videos",
  
  // Writing & Research Support
  "Ghostwriting",
  "Proofreading & Editing",
  "Citation & Referencing Help",
  "Literature Review Assistance",
  "Study Notes & Summaries",
  
  // Marketing & Branding Support
  "Brand Identity Consulting",
  "Campaign Strategy Support",
  "Press Release Writing",
  "Market Analysis Reports",
  "Social Media Content Planning",
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
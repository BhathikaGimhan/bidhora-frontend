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
import MultipleFileUpload from "@/features/postProject/components/MultipleFileUpload";
import { SERVICE_CATEGORIES } from "@/constants/serviceCategories";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  formData: FormData;
  setFormData: Dispatch<SetStateAction<FormData>>;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

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
        categories={[...SERVICE_CATEGORIES]}
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

      <div className="space-y-3 p-5 bg-gradient-to-r from-primary/5 to-transparent border-2 border-dashed border-primary/30 rounded-xl hover:border-primary/50 transition-colors">
        <Label htmlFor="promoCode" className="text-primary font-bold flex items-center gap-2 text-base">
          <span className="text-xl">🎟️</span> Have a Promo Code? (optional)
        </Label>
        <div className="relative">
          <Input 
            id="promoCode"
            placeholder="Enter code here"
            value={formData.promoCode || ""}
            onChange={(e) => handleInputChange("promoCode", e.target.value)}
            className="pl-4 h-11 border-primary/20 focus-visible:ring-primary/40 bg-white/80 backdrop-blur-sm transition-all font-medium tracking-wide uppercase placeholder:normal-case placeholder:tracking-normal"
          />
        </div>
        <p className="text-xs text-muted-foreground font-medium ml-1">
          Enter a valid promo code.
        </p>
      </div>

      <FormActions onCancel={onCancel} isSubmitting={isSubmitting} />
    </form>
  );
};

export default ProjectForm;
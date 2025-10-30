import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const ProjectTitleInput: React.FC<Props> = ({ value, onChange }) => {
  const minLength = 10;
  const maxLength = 100;
  const isValid = value.length >= minLength && value.length <= maxLength;
  const showValidation = value.length > 0;

  return (
    <div className="space-y-2">
      <Label htmlFor="title" className="text-foreground">
        Project Title <span className="text-destructive">*</span>
      </Label>
      <div className="relative">
        <Input
          id="title"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g., Academic Research Paper Digital Solution"
          className={`bg-background border-input text-foreground pr-10 ${
            showValidation && !isValid ? 'border-destructive' : ''
          } ${showValidation && isValid ? 'border-green-500' : ''}`}
          required
          maxLength={maxLength}
        />
        {showValidation && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-destructive" />
            )}
          </div>
        )}
      </div>
      <div className="flex justify-between text-xs">
        <span className={value.length < minLength ? 'text-destructive' : 'text-muted-foreground'}>
          {value.length < minLength ? `Minimum ${minLength} characters required` : 'Title looks good!'}
        </span>
        <span className={value.length > maxLength - 10 ? 'text-destructive' : 'text-muted-foreground'}>
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
};

export default ProjectTitleInput;

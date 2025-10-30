import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const DescriptionTextarea: React.FC<Props> = ({ value, onChange }) => {
  const minLength = 50;
  const maxLength = 2000;
  const isValid = value.length >= minLength && value.length <= maxLength;
  const showValidation = value.length > 0;

  return (
    <div className="space-y-2">
      <Label htmlFor="description" className="text-foreground flex items-center gap-2">
        Project Description <span className="text-destructive">*</span>
        {showValidation && (
          <>
            {isValid ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-destructive" />
            )}
          </>
        )}
      </Label>
      <Textarea
        id="description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe your project in detail... (minimum 50 characters)"
        rows={6}
        className={`bg-background border-input text-foreground resize-none ${
          showValidation && !isValid ? 'border-destructive' : ''
        } ${showValidation && isValid ? 'border-green-500' : ''}`}
        required
        maxLength={maxLength}
      />
      <div className="flex justify-between text-xs">
        <span className={value.length < minLength ? 'text-destructive' : 'text-muted-foreground'}>
          {value.length < minLength 
            ? `${minLength - value.length} more characters needed` 
            : 'Description looks good!'}
        </span>
        <span className={value.length > maxLength - 100 ? 'text-destructive' : 'text-muted-foreground'}>
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
};

export default DescriptionTextarea;

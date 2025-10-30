import { Button } from "@/components/ui/button";
import { Clock, Loader2 } from "lucide-react";

interface Props {
  onCancel: () => void;
  isSubmitting?: boolean;
}

const FormActions: React.FC<Props> = ({ onCancel, isSubmitting = false }) => (
  <div className="flex gap-4 pt-6">
    <Button 
      type="button" 
      variant="outline" 
      onClick={onCancel} 
      className="flex-1"
      disabled={isSubmitting}
    >
      Cancel
    </Button>
    <Button 
      type="submit" 
      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
      disabled={isSubmitting}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Posting...
        </>
      ) : (
        <>
          <Clock className="mr-2 h-4 w-4" />
          Post Project
        </>
      )}
    </Button>
  </div>
);

export default FormActions;

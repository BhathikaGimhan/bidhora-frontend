import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone } from "lucide-react";
import { userProfileService } from "@/Services/userProfileService";
import { useToast } from "@/hooks/use-toast";

interface PhoneNumberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPhoneNumberAdded: () => void;
}

export const PhoneNumberModal = ({
  open,
  onOpenChange,
  onPhoneNumberAdded,
}: PhoneNumberModalProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { toast } = useToast();

  const validatePhoneNumber = (value: string): string | null => {
    if (!value || value.trim() === "") {
      return "Phone number is required";
    }

    // Remove spaces, dashes, parentheses for validation
    const cleanedPhone = value.replace(/[\s\-()]/g, "");

    // Check if it contains only digits and optional + at the start
    const phoneRegex = /^\+?[0-9]{7,15}$/;

    if (!phoneRegex.test(cleanedPhone)) {
      return "Please enter a valid phone number (7-15 digits)";
    }

    return null;
  };

  const handlePhoneNumberChange = (value: string) => {
    setPhoneNumber(value);
    const error = validatePhoneNumber(value);
    setValidationError(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validatePhoneNumber(phoneNumber);
    if (error) {
      setValidationError(error);
      return;
    }

    setIsSubmitting(true);

    try {
      await userProfileService.updateProfileField("phoneNumber", phoneNumber);

      toast({
        title: "Success",
        description: "Phone number added successfully!",
      });

      // Call the callback to notify parent that phone number was added
      onPhoneNumberAdded();

      // Close the modal
      onOpenChange(false);

      // Reset form
      setPhoneNumber("");
      setValidationError(null);
    } catch (error) {
      console.error("Error updating phone number:", error);
      toast({
        title: "Error",
        description: "Failed to update phone number. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setPhoneNumber("");
    setValidationError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Phone className="h-8 w-8 text-blue-600" />
          </div>
          <DialogTitle className="text-xl font-semibold text-center">
            Phone Number Required
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Please provide your phone number to post a project. This helps us
            and our service providers contact you regarding your project.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={phoneNumber}
              onChange={(e) => handlePhoneNumberChange(e.target.value)}
              className={validationError ? "border-red-500" : ""}
              disabled={isSubmitting}
              autoFocus
            />
            {validationError && (
              <p className="text-sm text-red-500">{validationError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Supports international format (e.g., +1 555-123-4567, +94 77 123 4567)
            </p>
          </div>

          <div className="flex flex-col gap-2 mt-6">
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isSubmitting || !!validationError}
            >
              {isSubmitting ? "Saving..." : "Save & Continue"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

import React, { useState } from "react";
import { Calendar, DollarSign, Clock, FileText, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { submitDetailedProposal } from "@/Services/projectService";

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  onSuccess: () => void;
}

interface ProposalFormData {
  name: string; // Custom proposal name
  biddingPrice: string;
  estimatedDuration: string;
  durationUnit: "days" | "weeks";
  deliveryDate: string;
  additionalNotes: string;
}

const ProposalModal: React.FC<ProposalModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProposalFormData>({
    name: "",
    biddingPrice: "",
    estimatedDuration: "",
    durationUnit: "days",
    deliveryDate: "",
    additionalNotes: "",
  });

  const [errors, setErrors] = useState<Partial<ProposalFormData>>({});

  const handleInputChange = (field: keyof ProposalFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ProposalFormData> = {};

    // Validate proposal name
    if (!formData.name.trim()) {
      newErrors.name = "ProjectX name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "ProjectX name must be at least 3 characters";
    } else if (formData.name.trim().length > 50) {
      newErrors.name = "ProjectX name must be less than 50 characters";
    }

    // Validate bidding price
    if (!formData.biddingPrice.trim()) {
      newErrors.biddingPrice = "Bidding price is required";
    } else {
      const price = parseFloat(formData.biddingPrice);
      if (isNaN(price) || price <= 0) {
        newErrors.biddingPrice = "Please enter a valid price";
      }
    }

    // Validate estimated duration
    if (!formData.estimatedDuration.trim()) {
      newErrors.estimatedDuration = "Estimated duration is required";
    } else {
      const duration = parseInt(formData.estimatedDuration);
      if (isNaN(duration) || duration <= 0) {
        newErrors.estimatedDuration = "Please enter a valid duration";
      }
    }

    // Validate delivery date
    if (!formData.deliveryDate) {
      newErrors.deliveryDate = "Delivery date is required";
    } else {
      const selectedDate = new Date(formData.deliveryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.deliveryDate = "Delivery date cannot be in the past";
      }
    }

    // Validate additional notes
    if (!formData.additionalNotes.trim()) {
      newErrors.additionalNotes =
        "Please provide some details about your ProjectX";
    } else if (formData.additionalNotes.trim().length < 20) {
      newErrors.additionalNotes =
        "Please provide more details (at least 20 characters)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const proposalData = {
        name: formData.name.trim(),
        biddingPrice: parseFloat(formData.biddingPrice),
        estimatedDuration: parseInt(formData.estimatedDuration),
        durationUnit: formData.durationUnit,
        deliveryDate: new Date(formData.deliveryDate),
        additionalNotes: formData.additionalNotes.trim(),
      };

      await submitDetailedProposal(projectId, proposalData);

      toast({
        title: "Success!",
        description: "Your ProjectX has been submitted successfully.",
      });

      // Reset form
      setFormData({
        name: "",
        biddingPrice: "",
        estimatedDuration: "",
        durationUnit: "days",
        deliveryDate: "",
        additionalNotes: "",
      });
      setErrors({});

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error submitting proposal:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to submit ProjectX. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setFormData({
        name: "",
        biddingPrice: "",
        estimatedDuration: "",
        durationUnit: "days",
        deliveryDate: "",
        additionalNotes: "",
      });
      setErrors({});
      onClose();
    }
  };

  // Calculate minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Submit ProjectX
          </DialogTitle>
          <DialogDescription>
            Submit your ProjectX for "{projectTitle}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Proposal Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              ProjectX Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., projectX, web-design-ProjectX, logo-redesign"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Give your ProjectX a custom name to easily identify it later
            </p>
          </div>
          {/* Bidding Price */}
          <div className="space-y-2">
            <Label htmlFor="biddingPrice" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Bidding Price (USD)
            </Label>
            <Input
              id="biddingPrice"
              type="number"
              min="1"
              step="0.01"
              placeholder="Enter your bid amount"
              value={formData.biddingPrice}
              onChange={(e) =>
                handleInputChange("biddingPrice", e.target.value)
              }
              className={errors.biddingPrice ? "border-red-500" : ""}
            />
            {errors.biddingPrice && (
              <p className="text-sm text-red-500">{errors.biddingPrice}</p>
            )}
          </div>

          {/* Estimated Duration */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Estimated Duration
            </Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                placeholder="Duration"
                value={formData.estimatedDuration}
                onChange={(e) =>
                  handleInputChange("estimatedDuration", e.target.value)
                }
                className={`flex-1 ${
                  errors.estimatedDuration ? "border-red-500" : ""
                }`}
              />
              <Select
                value={formData.durationUnit}
                onValueChange={(value: "days" | "weeks") =>
                  handleInputChange("durationUnit", value)
                }
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {errors.estimatedDuration && (
              <p className="text-sm text-red-500">{errors.estimatedDuration}</p>
            )}
          </div>

          {/* Delivery Date */}
          <div className="space-y-2">
            <Label htmlFor="deliveryDate" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Delivery Date
            </Label>
            <Input
              id="deliveryDate"
              type="date"
              min={getMinDate()}
              value={formData.deliveryDate}
              onChange={(e) =>
                handleInputChange("deliveryDate", e.target.value)
              }
              className={errors.deliveryDate ? "border-red-500" : ""}
            />
            {errors.deliveryDate && (
              <p className="text-sm text-red-500">{errors.deliveryDate}</p>
            )}
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label
              htmlFor="additionalNotes"
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Additional Notes
            </Label>
            <Textarea
              id="additionalNotes"
              placeholder="Describe your approach, relevant experience, timeline details, and why you're the best choice for this project..."
              rows={5}
              value={formData.additionalNotes}
              onChange={(e) =>
                handleInputChange("additionalNotes", e.target.value)
              }
              className={`resize-none ${
                errors.additionalNotes ? "border-red-500" : ""
              }`}
            />
            <div className="flex justify-between items-center">
              {errors.additionalNotes && (
                <p className="text-sm text-red-500">{errors.additionalNotes}</p>
              )}
              <p className="text-xs text-muted-foreground ml-auto">
                {formData.additionalNotes.length} characters
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit ProjectX
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProposalModal;

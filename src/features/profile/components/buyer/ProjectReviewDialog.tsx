import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { submitProjectReview } from '@/Services/projectService';

interface ProjectReviewDialogProps {
  projectId: string;
  projectTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted?: () => void;
}

export const ProjectReviewDialog = ({
  projectId,
  projectTitle,
  isOpen,
  onClose,
  onReviewSubmitted,
}: ProjectReviewDialogProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please select a star rating before submitting.',
        variant: 'destructive',
      });
      return;
    }

    if (!feedback.trim()) {
      toast({
        title: 'Feedback Required',
        description: 'Please provide your feedback before submitting.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await submitProjectReview(projectId, rating, feedback.trim());
      
      toast({
        title: 'Review Submitted',
        description: 'Thank you for your feedback! Your review has been submitted successfully.',
      });
      
      // Reset form
      setRating(0);
      setFeedback('');
      
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Failed to submit review. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(0);
      setHoveredRating(0);
      setFeedback('');
      onClose();
    }
  };

  console.log('🎨 ProjectReviewDialog render:', {
    projectId,
    projectTitle,
    isOpen,
    rating,
    feedback: feedback.substring(0, 20) + '...',
  });

  if (!isOpen) {
    console.log('⏸️ Dialog isOpen=false, not rendering');
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose} modal={true}>
      {console.log('🎪 Dialog component rendering with open=', isOpen)}
      <DialogContent 
        className="sm:max-w-[500px] z-[100]" 
        onPointerDownOutside={(e) => {
          console.log('🖱️ Clicked outside dialog');
          e.preventDefault();
        }}
        onEscapeKeyDown={() => console.log('⌨️ Escape key pressed')}
      >
        {console.log('📦 DialogContent rendering')}
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
          <DialogDescription>
            How was your experience with "{projectTitle}"?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Your Rating</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  disabled={isSubmitting}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    } transition-colors`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm font-medium">
                  {rating} {rating === 1 ? 'Star' : 'Stars'}
                </span>
              )}
            </div>
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback">Your Feedback</Label>
            <Textarea
              id="feedback"
              placeholder="Tell us about your experience with this project..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={5}
              disabled={isSubmitting}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Your feedback helps us improve our service and assists other users.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0 || !feedback.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

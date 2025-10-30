import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Send } from "lucide-react";
import { ReviewService } from "../../../Services/reviewService";
import { useToast } from "@/hooks/use-toast";

interface ReviewFormProps {
  projectId: string;
  projectTitle: string;
  reviewerId: string;
  reviewerName: string;
  reviewerPhotoURL?: string;
  revieweeId: string;
  onReviewSubmitted?: () => void;
  onCancel?: () => void;
}

export const ReviewForm = ({
  projectId,
  projectTitle,
  reviewerId,
  reviewerName,
  reviewerPhotoURL,
  revieweeId,
  onReviewSubmitted,
  onCancel
}: ReviewFormProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating for this review",
        variant: "destructive",
      });
      return;
    }

    if (!comment.trim()) {
      toast({
        title: "Comment Required",
        description: "Please provide a comment for this review",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await ReviewService.addReview({
        projectId,
        projectTitle,
        reviewerId,
        reviewerName,
        reviewerPhotoURL,
        revieweeId,
        rating,
        comment: comment.trim(),
        isVerified: true, // Assuming verified for now, can be updated based on business logic
      });

      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });

      if (onReviewSubmitted) onReviewSubmitted();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1;
      const isActive = starValue <= (hoveredRating || rating);

      return (
        <button
          key={i}
          type="button"
          className="focus:outline-none"
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
          onClick={() => setRating(starValue)}
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              isActive
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 hover:text-yellow-300'
            }`}
          />
        </button>
      );
    });
  };

  const getRatingText = () => {
    const texts = {
      1: "Poor",
      2: "Fair",
      3: "Good",
      4: "Very Good",
      5: "Excellent"
    };
    return rating > 0 ? texts[rating as keyof typeof texts] : "Select rating";
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-lg">Write a Review</CardTitle>
        <p className="text-sm text-muted-foreground">
          Share your experience working on "{projectTitle}"
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Overall Rating</Label>
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                {renderStars()}
              </div>
              <span className="text-sm text-muted-foreground">
                {getRatingText()}
              </span>
            </div>
          </div>

          {/* Comment Section */}
          <div className="space-y-3">
            <Label htmlFor="comment" className="text-sm font-medium">
              Your Review
            </Label>
            <Textarea
              id="comment"
              placeholder="Tell others about your experience working on this project. What went well? What could be improved?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0 || !comment.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
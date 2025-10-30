import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Star, ThumbsUp, ThumbsDown, Heart, MessageCircle } from "lucide-react";
import { Review } from "../types/profile";
import { ReviewService } from "../../../Services/reviewService";
import { useToast } from "@/hooks/use-toast";

interface ReviewCardProps {
  review: Review;
  currentUserId?: string;
  onReviewUpdated?: () => void;
}

export const ReviewCard = ({ review, currentUserId, onReviewUpdated }: ReviewCardProps) => {
  const { toast } = useToast();
  const [isMarkingHelpful, setIsMarkingHelpful] = useState(false);
  const [isReacting, setIsReacting] = useState(false);

  const formatDate = (date: Date | { toDate(): Date }) => {
    const d = date instanceof Date ? date : date.toDate();
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const handleMarkHelpful = async () => {
    if (!currentUserId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to mark reviews as helpful",
        variant: "destructive",
      });
      return;
    }

    setIsMarkingHelpful(true);
    try {
      await ReviewService.markReviewHelpful(review.id, currentUserId);
      if (onReviewUpdated) onReviewUpdated();
      toast({
        title: "Success",
        description: "Review marked as helpful",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark review as helpful",
        variant: "destructive",
      });
    } finally {
      setIsMarkingHelpful(false);
    }
  };

  const handleReaction = async (reaction: 'like' | 'dislike') => {
    if (!currentUserId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to react to reviews",
        variant: "destructive",
      });
      return;
    }

    setIsReacting(true);
    try {
      await ReviewService.reactToReview(review.id, currentUserId, reaction);
      if (onReviewUpdated) onReviewUpdated();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to react to review",
        variant: "destructive",
      });
    } finally {
      setIsReacting(false);
    }
  };

  const isHelpfulMarked = currentUserId ? review.helpfulVotes.includes(currentUserId) : false;
  const userLiked = currentUserId ? review.reactions.likes.includes(currentUserId) : false;
  const userDisliked = currentUserId ? review.reactions.dislikes.includes(currentUserId) : false;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={review.reviewerPhotoURL} />
              <AvatarFallback>
                {review.reviewerName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">{review.reviewerName}</h4>
                {review.isVerified && (
                  <Badge variant="secondary" className="text-xs">
                    Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center">
                  {renderStars(review.rating)}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(review.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="mb-3">
          <p className="text-sm text-muted-foreground mb-2">
            Project: <span className="font-medium text-foreground">{review.projectTitle}</span>
          </p>
          <p className="text-sm">{review.comment}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Helpful votes */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkHelpful}
              disabled={isMarkingHelpful}
              className={`text-xs ${isHelpfulMarked ? 'text-blue-600' : 'text-muted-foreground'}`}
            >
              <ThumbsUp className="w-3 h-3 mr-1" />
              Helpful ({review.helpfulVotes.length})
            </Button>

            {/* Like/Dislike */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReaction('like')}
                disabled={isReacting}
                className={`text-xs ${userLiked ? 'text-green-600' : 'text-muted-foreground'}`}
              >
                <Heart className="w-3 h-3 mr-1" />
                {review.reactions.likes.length}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReaction('dislike')}
                disabled={isReacting}
                className={`text-xs ${userDisliked ? 'text-red-600' : 'text-muted-foreground'}`}
              >
                <ThumbsDown className="w-3 h-3 mr-1" />
                {review.reactions.dislikes.length}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
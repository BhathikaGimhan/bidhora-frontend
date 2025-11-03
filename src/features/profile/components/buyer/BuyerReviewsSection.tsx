import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, MessageSquare, Calendar } from "lucide-react";
import { ReviewService } from "@/Services/reviewService";
import { Review } from "@/types/profile";
import { Timestamp } from "firebase/firestore";

interface BuyerReviewsSectionProps {
  userId: string;
}

export const BuyerReviewsSection = ({ userId }: BuyerReviewsSectionProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setIsLoading(true);
        // Fetch recent 5 reviews created by this buyer
        const buyerReviews = await ReviewService.getReviewsByReviewer(userId, 5);
        setReviews(buyerReviews);
      } catch (err) {
        console.error("Error loading buyer reviews:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadReviews();
  }, [userId]);

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

  const formatDate = (timestamp: Timestamp | Date | string | { toDate(): Date } | undefined) => {
    if (!timestamp) return 'Unknown date';
    let date: Date;
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'object' && 'toDate' in timestamp) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            My Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-muted-foreground">No reviews yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your reviews for completed projects will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          My Reviews ({reviews.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
            >
              {/* Project Title (if available) */}
              {review.projectTitle && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Project: {review.projectTitle}
                  </span>
                </div>
              )}

              {/* Rating and Date */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-sm font-medium">
                    {review.rating} out of 5
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {formatDate(review.createdAt)}
                </div>
              </div>

              {/* Review Comment */}
              {review.comment && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  "{review.comment}"
                </p>
              )}

              {/* Helpful Count */}
              {review.helpfulVotes && review.helpfulVotes.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    {review.helpfulVotes.length} {review.helpfulVotes.length === 1 ? 'person' : 'people'} found this helpful
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

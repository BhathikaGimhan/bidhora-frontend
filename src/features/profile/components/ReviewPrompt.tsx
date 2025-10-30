import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare, X } from "lucide-react";
import { ReviewForm } from "./ReviewForm";
import { ReviewService } from "../../../Services/reviewService";
import { Project } from "../../types/profile";

interface ReviewPromptProps {
  project: Project;
  currentUserId: string;
  currentUserName: string;
  currentUserPhotoURL?: string;
  onClose: () => void;
}

export const ReviewPrompt = ({
  project,
  currentUserId,
  currentUserName,
  currentUserPhotoURL,
  onClose
}: ReviewPromptProps) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkIfAlreadyReviewed = useCallback(async () => {
    try {
      // Determine who to review based on current user role
      const revieweeId = project.buyerId === currentUserId
        ? project.serviceProviderId
        : project.buyerId;

      if (!revieweeId) return;

      const reviews = await ReviewService.getUserReviews(revieweeId);
      const userReview = reviews.find(review =>
        review.reviewerId === currentUserId && review.projectId === project.id
      );

      setHasReviewed(!!userReview);
    } catch (error) {
      console.error("Error checking review status:", error);
    } finally {
      setIsLoading(false);
    }
  }, [project.id, project.buyerId, project.serviceProviderId, currentUserId]);

  useEffect(() => {
    checkIfAlreadyReviewed();
  }, [checkIfAlreadyReviewed]);

  const handleReviewSubmitted = () => {
    setHasReviewed(true);
    setShowReviewForm(false);
  };

  const getRevieweeInfo = () => {
    const isBuyer = project.buyerId === currentUserId;
    const revieweeId = isBuyer ? project.serviceProviderId : project.buyerId;
    const revieweeName = isBuyer ? project.serviceProviderName : project.buyerName;
    const revieweePhotoURL = isBuyer ? project.serviceProviderPhotoURL : project.buyerPhotoURL;

    return { revieweeId, revieweeName, revieweePhotoURL };
  };

  const { revieweeId, revieweeName, revieweePhotoURL } = getRevieweeInfo();

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasReviewed) {
    return (
      <Card className="w-full max-w-md mx-auto border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-green-800">Review Submitted</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Star className="w-5 h-5 text-green-600 fill-current" />
            </div>
            <div>
              <p className="font-medium text-green-800">Thank you for your feedback!</p>
              <p className="text-sm text-green-600">
                Your review for "{project.title}" has been submitted.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showReviewForm) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <ReviewForm
          projectId={project.id}
          projectTitle={project.title}
          reviewerId={currentUserId}
          reviewerName={currentUserName}
          reviewerPhotoURL={currentUserPhotoURL}
          revieweeId={revieweeId!}
          onReviewSubmitted={handleReviewSubmitted}
          onCancel={() => setShowReviewForm(false)}
        />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Project Completed!</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <Badge variant="secondary" className="w-fit">
          {project.title}
        </Badge>
      </CardHeader>

      <CardContent>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <MessageSquare className="w-8 h-8 text-blue-600" />
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">
              Share Your Experience
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Help others by reviewing your experience working with{" "}
              <span className="font-medium text-foreground">{revieweeName}</span>
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setShowReviewForm(true)}
              className="flex-1"
            >
              <Star className="w-4 h-4 mr-2" />
              Write Review
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
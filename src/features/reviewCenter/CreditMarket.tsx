import { useState } from "react";
import {
  Star,
  User,
  Calendar,
  MessageSquare,
  ThumbsUp,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Review {
  id: string;
  clientName: string;
  clientAvatar?: string;
  serviceProviderName: string;
  serviceProviderAvatar?: string;
  projectTitle: string;
  rating: number;
  reviewText: string;
  date: string;
  category: string;
  helpful: number;
  projectId: string;
}

const ReviewCenter = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Mock data for client reviews
  const mockReviews: Review[] = [
    {
      id: "1",
      clientName: "Sarah Johnson",
      clientAvatar: "/user.png",
      serviceProviderName: "Alex Chen",
      serviceProviderAvatar: "/user.png",
      projectTitle: "Business Report Typing - 50 pages",
      rating: 5,
      reviewText:
        "Excellent work! The typing was accurate and completed ahead of schedule. The formatting was perfect and exactly what I needed for my business presentation. Highly recommend!",
      date: "2025-10-15",
      category: "Business Documents",
      helpful: 12,
      projectId: "proj-001",
    },
    {
      id: "2",
      clientName: "Michael Rodriguez",
      clientAvatar: "/user.png",
      serviceProviderName: "Priya Patel",
      serviceProviderAvatar: "/user.png",
      projectTitle: "Academic Research Paper - 25 pages",
      rating: 5,
      reviewText:
        "Outstanding service! The typist caught several formatting inconsistencies that I missed. The final document looked professional and was ready for submission. Will definitely use again.",
      date: "2025-10-12",
      category: "Academic",
      helpful: 8,
      projectId: "proj-002",
    },
    {
      id: "3",
      clientName: "Emma Thompson",
      clientAvatar: "/user.png",
      serviceProviderName: "David Kim",
      serviceProviderAvatar: "/user.png",
      projectTitle: "Legal Document Transcription - 15 pages",
      rating: 4,
      reviewText:
        "Very good work overall. The typing was accurate and the turnaround time was reasonable. There were a couple of minor formatting issues but nothing major. Good value for money.",
      date: "2025-10-10",
      category: "Legal",
      helpful: 6,
      projectId: "proj-003",
    },
    {
      id: "4",
      clientName: "James Wilson",
      clientAvatar: "/user.png",
      serviceProviderName: "Maria Garcia",
      serviceProviderAvatar: "/user.png",
      projectTitle: "Medical Report Typing - 30 pages",
      rating: 5,
      reviewText:
        "Exceptional attention to detail! As a healthcare professional, accuracy is crucial. The typist handled complex medical terminology perfectly and maintained confidentiality throughout the process.",
      date: "2025-10-08",
      category: "Medical",
      helpful: 15,
      projectId: "proj-004",
    },
    {
      id: "5",
      clientName: "Lisa Chen",
      clientAvatar: "/user.png",
      serviceProviderName: "Robert Taylor",
      serviceProviderAvatar: "/user.png",
      projectTitle: "Manuscript Editing - 80 pages",
      rating: 5,
      reviewText:
        "Incredible service! Not only did they type my handwritten manuscript beautifully, but they also suggested improvements to the formatting and caught some grammatical errors. Truly professional work.",
      date: "2025-10-05",
      category: "Creative Writing",
      helpful: 9,
      projectId: "proj-005",
    },
    {
      id: "6",
      clientName: "Ahmed Hassan",
      clientAvatar: "/user.png",
      serviceProviderName: "Sophie Martin",
      serviceProviderAvatar: "/user.png",
      projectTitle: "Research Data Entry - 40 pages",
      rating: 4,
      reviewText:
        "Good quality work. The data was entered accurately and the Excel sheets were well-organized. There was a small delay in delivery but the final result was satisfactory.",
      date: "2025-10-03",
      category: "Data Entry",
      helpful: 4,
      projectId: "proj-006",
    },
    {
      id: "7",
      clientName: "Rachel Green",
      clientAvatar: "/user.png",
      serviceProviderName: "Carlos Rodriguez",
      serviceProviderAvatar: "/user.png",
      projectTitle: "Thesis Typing - 120 pages",
      rating: 5,
      reviewText:
        "Absolutely fantastic! My PhD thesis was typed with perfect formatting, including complex tables, figures, and references. The attention to detail was impeccable. Thank you for helping me meet my submission deadline!",
      date: "2025-10-01",
      category: "Academic",
      helpful: 18,
      projectId: "proj-007",
    },
    {
      id: "8",
      clientName: "Tom Anderson",
      clientAvatar: "/user.png",
      serviceProviderName: "Nina Petrov",
      serviceProviderAvatar: "/user.png",
      projectTitle: "Contract Document - 8 pages",
      rating: 5,
      reviewText:
        "Professional and reliable service. The contract was typed exactly as requested with proper legal formatting. Quick turnaround and excellent communication throughout the process.",
      date: "2025-09-28",
      category: "Legal",
      helpful: 7,
      projectId: "proj-008",
    },
  ];

  const categories = [
    "all",
    "Academic",
    "Business Documents",
    "Legal",
    "Medical",
    "Creative Writing",
    "Data Entry",
  ];

  const filteredReviews =
    selectedCategory === "all"
      ? mockReviews
      : mockReviews.filter((review) => review.category === selectedCategory);

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case "oldest":
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case "highest":
        return b.rating - a.rating;
      case "lowest":
        return a.rating - b.rating;
      case "most-helpful":
        return b.helpful - a.helpful;
      default:
        return 0;
    }
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const getAverageRating = () => {
    const total = mockReviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / mockReviews.length).toFixed(1);
  };

  const getTotalReviews = () => mockReviews.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Review Center</h1>
          <p className="text-xl mb-8 text-blue-100">
            Discover what our clients say about our professional typing services
          </p>
          <div className="flex justify-center items-center space-x-8">
            <div className="text-center">
              <div className="text-3xl font-bold">{getAverageRating()}</div>
              <div className="flex justify-center mb-1">
                {renderStars(Math.round(parseFloat(getAverageRating())))}
              </div>
              <div className="text-sm text-blue-100">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{getTotalReviews()}</div>
              <div className="text-sm text-blue-100">Total Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">98%</div>
              <div className="text-sm text-blue-100">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-gray-900 border-b py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Filter Reviews:</span>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-4">
              <span className="font-medium">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="highest">Highest Rated</SelectItem>
                  <SelectItem value="lowest">Lowest Rated</SelectItem>
                  <SelectItem value="most-helpful">Most Helpful</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            {sortedReviews.map((review, index) => (
              <Card
                key={review.id}
                className="hover:shadow-lg transition-shadow duration-300"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={review.clientAvatar} />
                        <AvatarFallback>
                          {review.clientName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {review.clientName}
                        </CardTitle>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(review.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">{review.category}</Badge>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    {renderStars(review.rating)}
                    <span className="text-sm font-medium ml-2">
                      {review.rating}/5
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h4 className="font-semibold text-foreground mb-2">
                      {review.projectTitle}
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {review.reviewText}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>Service by {review.serviceProviderName}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ThumbsUp className="w-4 h-4" />
                        <span>{review.helpful} found helpful</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      Helpful
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {sortedReviews.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                No reviews found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your filters to see more reviews.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewCenter;

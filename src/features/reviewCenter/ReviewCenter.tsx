import { useState, useEffect } from "react";
import {
  Star,
  User,
  Calendar,
  MessageSquare,
  ThumbsUp,
  Filter,
  Award,
  TrendingUp,
  Heart,
  Check,
  ChevronsUpDown,
  Loader2,
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ReviewService } from "../../Services/reviewService";
import { Review } from "../../types/profile";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { auth } from "@/firebaseConfig";
import { useToast } from "@/hooks/use-toast";
import { SERVICE_CATEGORIES } from "@/constants/serviceCategories";

const ReviewCenter = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllReviews();
  }, []);

  const fetchAllReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching all reviews...');
      const allReviews = await ReviewService.getAllReviews();
      console.log('📦 Reviews fetched:', allReviews);
      console.log('📊 Total reviews count:', allReviews.length);
      
      setReviews(allReviews);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to mark reviews as helpful",
        variant: "destructive",
      });
      return;
    }

    try {
      await ReviewService.markReviewHelpful(reviewId, currentUser.uid);
      
      // Update local state to reflect the change
      setReviews(prevReviews =>
        prevReviews.map(review => {
          if (review.id === reviewId) {
            const isAlreadyHelpful = review.helpfulVotes.includes(currentUser.uid);
            const newHelpfulVotes = isAlreadyHelpful
              ? review.helpfulVotes.filter(id => id !== currentUser.uid)
              : [...review.helpfulVotes, currentUser.uid];
            
            return {
              ...review,
              helpfulVotes: newHelpfulVotes
            };
          }
          return review;
        })
      );

      toast({
        title: "Success",
        description: "Your feedback has been recorded",
      });
    } catch (err) {
      console.error("Error marking review as helpful:", err);
      toast({
        title: "Error",
        description: "Failed to mark review as helpful",
        variant: "destructive",
      });
    }
  };

  const categories = ["all", ...SERVICE_CATEGORIES];

  const filteredReviews =
    selectedCategory === "all"
      ? reviews
      : reviews.filter((review) => {
          // Filter by checking if project title contains the selected category
          const projectTitle = review.projectTitle.toLowerCase();
          const category = selectedCategory.toLowerCase();
          return projectTitle.includes(category);
        });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate();
    const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate();

    switch (sortBy) {
      case "newest":
        return dateB.getTime() - dateA.getTime();
      case "oldest":
        return dateA.getTime() - dateB.getTime();
      case "highest":
        return b.rating - a.rating;
      case "lowest":
        return a.rating - b.rating;
      case "most-helpful":
        return b.helpfulVotes.length - a.helpfulVotes.length;
      default:
        return 0;
    }
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 transition-all duration-300 ${
          i < rating
            ? "fill-yellow-400 text-yellow-400 drop-shadow-lg"
            : "text-gray-300 hover:text-yellow-300"
        }`}
      />
    ));
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return "0.0";
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  const getTotalReviews = () => reviews.length;

  const getCategoryColor = (category: string) => {
    // Generate colors based on category type
    if (category.includes("Writing") || category.includes("Translation") || category.includes("Copywriting")) {
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    } else if (category.includes("Academic") || category.includes("Research") || category.includes("Thesis")) {
      return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    } else if (category.includes("Finance") || category.includes("Business") || category.includes("Accounting")) {
      return "bg-green-500/10 text-green-600 border-green-500/20";
    } else if (category.includes("Marketing") || category.includes("SEO") || category.includes("Social Media")) {
      return "bg-pink-500/10 text-pink-600 border-pink-500/20";
    } else if (category.includes("Programming") || category.includes("Development") || category.includes("Software")) {
      return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
    } else if (category.includes("Design") || category.includes("Graphics") || category.includes("Logo")) {
      return "bg-rose-500/10 text-rose-600 border-rose-500/20";
    } else if (category.includes("Audio") || category.includes("Music") || category.includes("Voice")) {
      return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    } else if (category.includes("AI") || category.includes("Automation")) {
      return "bg-cyan-500/10 text-cyan-600 border-cyan-500/20";
    } else if (category.includes("Video") || category.includes("Animation")) {
      return "bg-red-500/10 text-red-600 border-red-500/20";
    } else if (category.includes("Consulting") || category.includes("Coaching") || category.includes("Lifestyle")) {
      return "bg-teal-500/10 text-teal-600 border-teal-500/20";
    }
    return "bg-gray-500/10 text-gray-600 border-gray-500/20";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card/20">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 via-brand-primary/10 to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--brand-primary))_0%,transparent_50%)] opacity-10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--accent))_0%,transparent_50%)] opacity-5"></div>

        <div className="relative py-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            {/* Main Title */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary shadow-glow mb-6 animate-scale-in">
                <Award className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-4 animate-fade-in">
                <span className="bg-gradient-to-r from-brand-primary via-green-400 to-brand-primary-dark bg-clip-text text-transparent">
                  Review Center
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up">
                Discover what our clients say about our professional services across all categories
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="group">
                <Card className="bg-card/80 backdrop-blur-sm border border-white/10 shadow-glass hover:shadow-glow transition-all duration-500 hover:-translate-y-2 animate-fade-in">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold text-brand-primary mb-2 group-hover:scale-110 transition-transform duration-300">
                      {getAverageRating()}
                    </div>
                    <div className="flex justify-center mb-3">
                      {renderStars(Math.round(parseFloat(getAverageRating())))}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">
                      Average Rating
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="group">
                <Card
                  className="bg-card/80 backdrop-blur-sm border border-white/10 shadow-glass hover:shadow-glow transition-all duration-500 hover:-translate-y-2 animate-fade-in animate-stagger"
                  style={{ "--stagger": 1 } as React.CSSProperties}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold text-brand-primary mb-2 group-hover:scale-110 transition-transform duration-300">
                      {getTotalReviews()}
                    </div>
                    <TrendingUp className="w-6 h-6 text-brand-primary mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground font-medium">
                      Total Reviews
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="group">
                <Card
                  className="bg-card/80 backdrop-blur-sm border border-white/10 shadow-glass hover:shadow-glow transition-all duration-500 hover:-translate-y-2 animate-fade-in animate-stagger"
                  style={{ "--stagger": 2 } as React.CSSProperties}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold text-brand-primary mb-2 group-hover:scale-110 transition-transform duration-300">
                      98%
                    </div>
                    <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground font-medium">
                      Satisfaction Rate
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/10 shadow-glass">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-brand-primary/10 border border-brand-primary/20">
                  <Filter className="w-5 h-5 text-brand-primary" />
                </div>
                <span className="font-semibold text-foreground">
                  Filter Reviews:
                </span>
              </div>
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={categoryOpen}
                    className="w-72 justify-between bg-card/50 backdrop-blur-sm border-white/20 hover:border-brand-primary/50 transition-colors duration-300"
                  >
                    {selectedCategory === "all"
                      ? "All Categories"
                      : categories.find((cat) => cat === selectedCategory) || "Select category..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0 bg-card/95 backdrop-blur-sm border-white/20" align="start">
                  <Command>
                    <CommandInput placeholder="Search categories..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No category found.</CommandEmpty>
                      <CommandGroup className="max-h-[300px] overflow-auto">
                        <CommandItem
                          key="all"
                          value="all"
                          onSelect={() => {
                            setSelectedCategory("all");
                            setCategoryOpen(false);
                          }}
                          className="hover:bg-brand-primary/10"
                        >
                          All Categories
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              selectedCategory === "all" ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                        {categories.filter(cat => cat !== "all").map((category) => (
                          <CommandItem
                            key={category}
                            value={category}
                            onSelect={(currentValue) => {
                              setSelectedCategory(currentValue === selectedCategory ? "all" : currentValue);
                              setCategoryOpen(false);
                            }}
                            className="hover:bg-brand-primary/10"
                          >
                            {category}
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                selectedCategory === category ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-semibold text-foreground">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-44 bg-card/50 backdrop-blur-sm border-white/20 hover:border-brand-primary/50 transition-colors duration-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card/95 backdrop-blur-sm border-white/20">
                  <SelectItem
                    value="newest"
                    className="hover:bg-brand-primary/10"
                  >
                    Newest First
                  </SelectItem>
                  <SelectItem
                    value="oldest"
                    className="hover:bg-brand-primary/10"
                  >
                    Oldest First
                  </SelectItem>
                  <SelectItem
                    value="highest"
                    className="hover:bg-brand-primary/10"
                  >
                    Highest Rated
                  </SelectItem>
                  <SelectItem
                    value="lowest"
                    className="hover:bg-brand-primary/10"
                  >
                    Lowest Rated
                  </SelectItem>
                  <SelectItem
                    value="most-helpful"
                    className="hover:bg-brand-primary/10"
                  >
                    Most Helpful
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="relative mb-6">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-red-500/20 to-red-500/10 flex items-center justify-center">
                  <MessageSquare className="w-12 h-12 text-red-500/60" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">
                Error Loading Reviews
              </h3>
              <p className="text-muted-foreground text-lg max-w-md mx-auto mb-4">
                {error}
              </p>
              <Button onClick={fetchAllReviews} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {sortedReviews.map((review, index) => (
              <Card
                key={review.id}
                className="group bg-card/60 backdrop-blur-sm border border-white/10 shadow-card hover:shadow-glow transition-all duration-500 hover:-translate-y-1 hover:bg-card/80 animate-fade-in animate-stagger"
                style={{ "--stagger": index % 3 } as React.CSSProperties}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Avatar className="w-14 h-14 ring-2 ring-brand-primary/20 group-hover:ring-brand-primary/40 transition-all duration-300">
                          <AvatarImage src={review.reviewerPhotoURL} />
                          <AvatarFallback className="bg-gradient-to-br from-brand-primary/20 to-brand-primary/10 text-brand-primary font-semibold">
                            {review.reviewerName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-xl group-hover:text-brand-primary transition-colors duration-300">
                          {review.reviewerName}
                        </CardTitle>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 text-brand-primary/60" />
                          <span>
                            {(() => {
                              const date = review.createdAt instanceof Date ? review.createdAt : review.createdAt.toDate();
                              return date.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              });
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-gray-500/10 text-gray-600 border-gray-500/20 border backdrop-blur-sm hover:scale-105 transition-transform duration-300"
                    >
                      Review
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-3 mt-4">
                    <div className="flex items-center space-x-1">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-lg font-bold text-brand-primary">
                      {review.rating}/5
                    </span>
                    {review.isVerified && (
                      <>
                        <div className="h-6 w-px bg-border"></div>
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 border backdrop-blur-sm"
                        >
                          Verified Client
                        </Badge>
                      </>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <p className="text-muted-foreground leading-relaxed text-base">
                      "{review.comment}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <ThumbsUp className="w-4 h-4 text-brand-primary/60" />
                        <span className="font-medium">
                          {review.helpfulVotes.length} found helpful
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-muted-foreground/60" />
                        <span>Verified Review</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkHelpful(review.id)}
                      className={`bg-card/50 backdrop-blur-sm border-white/20 hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all duration-300 hover:scale-105 ${
                        auth.currentUser && review.helpfulVotes.includes(auth.currentUser.uid)
                          ? 'bg-emerald-500/10 border-emerald-500/50'
                          : ''
                      }`}
                    >
                      <ThumbsUp 
                        className={`w-4 h-4 mr-2 ${
                          auth.currentUser && review.helpfulVotes.includes(auth.currentUser.uid)
                            ? 'fill-emerald-600 text-emerald-600'
                            : ''
                        }`}
                      />
                      Helpful
                    </Button>
                  </div>
                </CardContent>
              </Card>
              ))}

              {sortedReviews.length === 0 && (
                <div className="text-center py-20">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-brand-primary/20 to-brand-primary/10 flex items-center justify-center">
                      <MessageSquare className="w-12 h-12 text-brand-primary/60" />
                    </div>
                    <div className="absolute inset-0 rounded-full bg-brand-primary/5 animate-pulse"></div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    No reviews found
                  </h3>
                  <p className="text-muted-foreground text-lg max-w-md mx-auto">
                    Try adjusting your filters to see more reviews from our
                    satisfied clients.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewCenter;

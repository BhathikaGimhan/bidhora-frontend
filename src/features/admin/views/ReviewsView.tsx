import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Star, Search, TrendingUp, TrendingDown, MessageSquare, Calendar, RefreshCw } from 'lucide-react';
import { DataTable } from '@/features/admin/components/DataTable';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

interface ProjectReview {
  id: string;
  projectId: string;
  projectTitle: string;
  customerRating: number;
  customerReview: string;
  customerReviewedAt: Date;
  buyerEmail: string;
  adminPrice?: number;
  status: string;
}

export function ReviewsView() {
  const [reviews, setReviews] = useState<ProjectReview[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<ProjectReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const { toast } = useToast();

  const filterReviews = () => {
    let filtered = [...reviews];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (review) =>
          review.projectTitle.toLowerCase().includes(query) ||
          review.customerReview.toLowerCase().includes(query) ||
          review.buyerEmail.toLowerCase().includes(query)
      );
    }

    // Rating filter
    if (ratingFilter !== 'all') {
      const rating = parseInt(ratingFilter);
      filtered = filtered.filter((review) => review.customerRating === rating);
    }

    setFilteredReviews(filtered);
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const projectsRef = collection(db, 'projects');
      const q = query(
        projectsRef,
        where('customerRating', '!=', null),
        orderBy('customerRating', 'desc'),
        orderBy('customerReviewedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const reviewsData: ProjectReview[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reviewsData.push({
          id: doc.id,
          projectId: doc.id,
          projectTitle: data.title || 'Untitled Project',
          customerRating: data.customerRating,
          customerReview: data.customerReview || '',
          customerReviewedAt: data.customerReviewedAt?.toDate() || new Date(),
          buyerEmail: data.buyerEmail || 'N/A',
          adminPrice: data.adminPrice,
          status: data.status,
        });
      });

      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch reviews. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviews, searchQuery, ratingFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReviews();
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.customerRating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      distribution[review.customerRating as keyof typeof distribution]++;
    });
    return distribution;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const columns = [
    {
      key: 'projectTitle',
      title: 'Project',
      render: (_value: any, row: ProjectReview) => (
        <div className="max-w-xs">
          <p className="font-medium truncate">{row.projectTitle}</p>
          <p className="text-xs text-muted-foreground truncate">{row.buyerEmail}</p>
        </div>
      ),
    },
    {
      key: 'customerRating',
      title: 'Rating',
      render: (_value: any, row: ProjectReview) => (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= row.customerRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
          <span className="ml-1 text-sm font-medium">{row.customerRating}.0</span>
        </div>
      ),
    },
    {
      key: 'customerReview',
      title: 'Review',
      render: (_value: any, row: ProjectReview) => (
        <div className="max-w-md">
          <p className="text-sm line-clamp-2">{row.customerReview}</p>
        </div>
      ),
    },
    {
      key: 'adminPrice',
      title: 'Project Value',
      render: (_value: any, row: ProjectReview) => (
        <span className="font-medium">
          {row.adminPrice ? `$${row.adminPrice.toLocaleString()}` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'customerReviewedAt',
      title: 'Date',
      render: (_value: any, row: ProjectReview) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {formatDate(row.customerReviewedAt)}
        </div>
      ),
    },
  ];

  const distribution = getRatingDistribution();
  const avgRating = calculateAverageRating();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Project Reviews</h2>
          <p className="text-muted-foreground">Customer feedback and ratings</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviews.length}</div>
            <p className="text-xs text-muted-foreground">From completed projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRating}</div>
            <p className="text-xs text-muted-foreground">Out of 5.0 stars</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">5-Star Reviews</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{distribution[5]}</div>
            <p className="text-xs text-muted-foreground">
              {reviews.length > 0 ? ((distribution[5] / reviews.length) * 100).toFixed(1) : 0}% of
              total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Ratings (1-2)</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{distribution[1] + distribution[2]}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = distribution[rating as keyof typeof distribution];
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;

              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by project, review, or buyer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Reviews ({filteredReviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReviews.length > 0 ? (
            <DataTable 
              title="Reviews"
              columns={columns} 
              data={filteredReviews}
              searchPlaceholder="Search reviews..."
            />
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No reviews found</h3>
              <p className="text-muted-foreground">
                {searchQuery || ratingFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Reviews will appear here once customers complete projects'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

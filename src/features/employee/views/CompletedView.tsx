import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Calendar, DollarSign, Award, RefreshCw, AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { AssignedProject } from '@/features/employee/models/AssignedProjectModel';
import { auth } from '@/firebaseConfig';
import { collection, query, where, getFirestore, orderBy, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function CompletedView() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<AssignedProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<AssignedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCompletedProjects = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.warn('No authenticated user found');
        return;
      }

      const db = getFirestore();
      const projectsRef = collection(db, 'projects');
      
      // Query only for completed projects that are admin-approved
      const q = query(
        projectsRef,
        where('assignedEmployeeId', '==', user.uid),
        where('status', '==', 'completed'),
        orderBy('assignedAt', 'desc')
      );
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(q,
        (snapshot) => {
          const projectsList: AssignedProject[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            projectsList.push({
              id: doc.id,
              title: data.title || '',
              description: data.description || '',
              status: data.status || 'completed',
              clientId: data.createdBy || '',
              clientName: data.buyerEmail || '',
              budget: {
                min: data.budgetMin || 0,
                max: data.budgetMax || 0,
              },
              adminPrice: data.adminPrice,
              adminDuration: data.adminDuration,
              adminDurationUnit: data.adminDurationUnit,
              deadline: data.deadline?.toDate?.().toISOString().split('T')[0] || '',
              createdDate: data.createdAt?.toDate?.().toISOString().split('T')[0] || '',
              assignedDate: data.assignedAt?.toDate?.().toISOString().split('T')[0] || '',
              category: data.category || '',
              skillsRequired: data.skills || [],
              assignedEmployeeId: data.assignedEmployeeId || '',
              assignedEmployeeName: data.assignedEmployeeName || '',
              assignedEmployeeEmail: data.assignedEmployeeEmail || '',
              adminNotes: data.adminNotes,
              submittedToAdminAt: data.submittedToAdminAt?.toDate?.().toISOString(),
              adminReviewStatus: data.adminReviewStatus,
              adminReviewNotes: data.adminReviewNotes,
              downloadUrl: data.downloadUrl,
              documents: data.documents,
              isUrgent: data.isUrgent || false,
            });
          });
          
          // Sort: urgent projects first
          projectsList.sort((a, b) => {
            if (a.isUrgent && !b.isUrgent) return -1;
            if (!a.isUrgent && b.isUrgent) return 1;
            return 0;
          });
          
          setProjects(projectsList);
          setFilteredProjects(projectsList);
          setLoading(false);
          setRefreshing(false);
        },
        (error) => {
          console.error('Error loading completed projects:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load completed projects. Please try again.',
          });
          setLoading(false);
          setRefreshing(false);
        }
      );
      
      // Return cleanup function
      return unsubscribe;
      
    } catch (error) {
      console.error('Error setting up completed projects listener:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load completed projects. Please try again.',
      });
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const setupListener = async () => {
      unsubscribe = await loadCompletedProjects();
    };
    
    setupListener();
    
    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    // The real-time listener will automatically update the data
    // Just show a toast to indicate refresh
    setTimeout(() => {
      setRefreshing(false);
      toast({
        title: 'Refreshed',
        description: 'Completed projects list is up to date',
      });
    }, 500);
  };

  useEffect(() => {
    if (searchQuery) {
      const filtered = projects.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProjects(filtered);
    } else {
      setFilteredProjects(projects);
    }
  }, [searchQuery, projects]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Completed Projects</h1>
          <p className="text-muted-foreground mt-1">
            Admin-approved completed projects ({filteredProjects.length})
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search completed projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Award className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg mb-2">
              {searchQuery
                ? 'No completed projects match your search'
                : 'No completed projects yet'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {!searchQuery && 'Complete and submit your projects to see them here'}
            </p>
            <Button onClick={() => navigate('/employee/projects')}>
              View My Projects
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className={`hover:shadow-lg transition-all duration-300 relative overflow-hidden ${
                project.isUrgent 
                  ? 'border-red-500 border-2 shadow-lg shadow-red-200 dark:shadow-red-900/50 bg-gradient-to-br from-red-50/30 to-white dark:from-red-950/10 dark:to-background' 
                  : ''
              }`}
            >
              {project.isUrgent && (
                <>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 dark:bg-red-500/20 rounded-bl-full"></div>
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg">
                      🚨 URGENT
                    </Badge>
                  </div>
                </>
              )}
              <CardHeader className={project.isUrgent ? 'pt-10' : ''}>
                <div className="flex items-start justify-between">
                  <CardTitle className={`text-lg line-clamp-2 flex items-center gap-2 ${project.isUrgent ? 'text-red-700 dark:text-red-400' : ''}`}>
                    {project.isUrgent && (
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    )}
                    {project.title}
                  </CardTitle>
                  <Badge className="bg-green-500 hover:bg-green-600">
                    Completed
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {project.description}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Completed: {new Date(project.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  {project.adminPrice && (
                    <div className="flex items-center text-sm">
                      <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">
                                              <p className="text-sm text-emerald-600 font-semibold">
                        LKR {project.adminPrice.toLocaleString()}
                      </p>
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {project.skillsRequired.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {project.skillsRequired.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{project.skillsRequired.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
                <Button 
                  className="w-full mt-4" 
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/employee/projects/${project.id}`)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

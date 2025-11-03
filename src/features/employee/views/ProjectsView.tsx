import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Calendar, DollarSign, RefreshCw, AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { AssignedProject } from '@/features/employee/models/AssignedProjectModel';
import { auth } from '@/firebaseConfig';
import { collection, query, where, getFirestore, orderBy, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function ProjectsView() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<AssignedProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<AssignedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadProjects = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.warn('No authenticated user found');
        return;
      }

      const db = getFirestore();
      const projectsRef = collection(db, 'projects');
      
      // Query all projects except completed ones (they're shown in Completed view)
      const q = query(
        projectsRef,
        where('assignedEmployeeId', '==', user.uid),
        orderBy('assignedAt', 'desc')
      );
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const projectsList: AssignedProject[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            // Filter out completed projects - they go to the Completed view
            if (data.status !== 'completed') {
              projectsList.push({
              id: doc.id,
              title: data.title || '',
              description: data.description || '',
              status: data.status || 'assigned',
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
          }
          });
          
          // Sort projects: urgent projects first, then by assigned date
          projectsList.sort((a, b) => {
            if (a.isUrgent && !b.isUrgent) return -1;
            if (!a.isUrgent && b.isUrgent) return 1;
            return new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime();
          });
          
          setProjects(projectsList);
          setFilteredProjects(projectsList);
          setLoading(false);
          setRefreshing(false);
        },
        (error) => {
          console.error('Error loading projects:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load projects. Please try again.',
          });
          setLoading(false);
          setRefreshing(false);
        }
      );
      
      // Return cleanup function
      return unsubscribe;
      
    } catch (error) {
      console.error('Error setting up projects listener:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load projects. Please try again.',
      });
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const setupListener = async () => {
      unsubscribe = await loadProjects();
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
        description: 'Projects list is up to date',
      });
    }, 500);
  };

  useEffect(() => {
    let filtered = projects;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
  }, [searchQuery, statusFilter, projects]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'secondary';
      case 'in_progress':
        return 'default';
      case 'completed_by_employee':
        return 'outline';
      case 'completed':
        return 'default';
      case 'needs_revision':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'Assigned';
      case 'in_progress':
        return 'In Progress';
      case 'completed_by_employee':
        return 'Submitted';
      case 'completed':
        return 'Completed';
      case 'needs_revision':
        return 'Needs Revision';
      default:
        return status;
    }
  };

  const getEffectiveDeadline = (project: AssignedProject) => {
    // Use admin deadline if available, otherwise fall back to buyer deadline
    if (project.adminDuration && project.adminDurationUnit && project.assignedDate) {
      const durationInDays = project.adminDurationUnit === 'weeks' 
        ? project.adminDuration * 7 
        : project.adminDuration;
      const adminDeadline = new Date(project.assignedDate);
      adminDeadline.setDate(adminDeadline.getDate() + durationInDays);
      return adminDeadline.toISOString().split('T')[0];
    }
    return project.deadline;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-2xl font-bold">My Projects</h2>
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

      {/* Urgent Projects Alert Banner */}
      {filteredProjects.some(p => p.isUrgent) && (
        <div className="relative overflow-hidden p-6 bg-gradient-to-r from-red-50 via-red-100 to-red-50 dark:from-red-950/30 dark:via-red-900/40 dark:to-red-950/30 border-2 border-red-500 dark:border-red-600 rounded-xl shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-200 dark:bg-red-800/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-200 dark:bg-red-800/20 rounded-full blur-3xl -ml-16 -mb-16"></div>
          <div className="relative flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="p-3 bg-red-500 dark:bg-red-600 rounded-xl shadow-lg animate-pulse">
                <AlertCircle className="h-7 w-7 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
                🚨 URGENT PROJECTS - IMMEDIATE ACTION REQUIRED
              </h3>
              <p className="text-red-800 dark:text-red-200 font-medium mb-3">
                You have {filteredProjects.filter(p => p.isUrgent).length} urgent project{filteredProjects.filter(p => p.isUrgent).length > 1 ? 's' : ''} that require priority handling!
              </p>
              <div className="flex flex-wrap gap-2">
                {filteredProjects.filter(p => p.isUrgent).slice(0, 3).map(project => (
                  <div key={project.id} className="px-3 py-1 bg-white dark:bg-red-950 border border-red-300 dark:border-red-700 rounded-lg text-sm font-medium text-red-700 dark:text-red-300">
                    {project.title}
                  </div>
                ))}
                {filteredProjects.filter(p => p.isUrgent).length > 3 && (
                  <div className="px-3 py-1 bg-red-600 dark:bg-red-700 rounded-lg text-sm font-bold text-white">
                    +{filteredProjects.filter(p => p.isUrgent).length - 3} more
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed_by_employee">Submitted</SelectItem>
            <SelectItem value="needs_revision">Needs Revision</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? 'No projects match your filters'
                : 'No projects assigned yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className={`hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden ${
                project.isUrgent 
                  ? 'border-red-500 border-3 shadow-red-200 dark:shadow-red-900/50 shadow-xl bg-gradient-to-br from-red-50/50 to-white dark:from-red-950/20 dark:to-background hover:shadow-2xl hover:shadow-red-300 dark:hover:shadow-red-900' 
                  : ''
              }`}
              onClick={() => navigate(`/employee/projects/${project.id}`)}
            >
              {project.isUrgent && (
                <>
                  {/* Animated corner accent */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 dark:bg-red-500/20 rounded-bl-full"></div>
                  {/* Pulsing indicator */}
                  <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                  <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full"></div>
                </>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className={`text-lg line-clamp-2 flex items-center gap-2 ${project.isUrgent ? 'text-red-700 dark:text-red-400' : ''}`}>
                    {project.isUrgent && (
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 animate-pulse" />
                    )}
                    {project.title}
                  </CardTitle>
                  <Badge variant={getStatusColor(project.status)}>
                    {getStatusLabel(project.status)}
                  </Badge>
                </div>
                {project.isUrgent && (
                  <div className="mt-2 animate-pulse">
                    <Badge variant="destructive" className="font-bold shadow-lg bg-red-600 hover:bg-red-700 text-white">
                      🚨 URGENT - HIGH PRIORITY
                    </Badge>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {project.description}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Due: {new Date(getEffectiveDeadline(project)).toLocaleDateString()}
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
                <Button className="w-full mt-4" size="sm">
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

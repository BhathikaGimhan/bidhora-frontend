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
import { Search, Calendar, DollarSign } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { AssignedProject } from '@/features/employee/models/AssignedProjectModel';
import { auth } from '@/firebaseConfig';
import { collection, query, where, getDocs, getFirestore, orderBy } from 'firebase/firestore';

export function ProjectsView() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<AssignedProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<AssignedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate('/login');
          return;
        }

        const db = getFirestore();
        const projectsRef = collection(db, 'projects');
        
        const q = query(
          projectsRef,
          where('assignedEmployeeId', '==', user.uid),
          orderBy('assignedAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const projectsList: AssignedProject[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
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
          });
        });
        
        setProjects(projectsList);
        setFilteredProjects(projectsList);
        
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [navigate]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            <SelectItem value="completed">Completed</SelectItem>
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
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/employee/projects/${project.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">
                    {project.title}
                  </CardTitle>
                  <Badge variant={getStatusColor(project.status)}>
                    {getStatusLabel(project.status)}
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
                      Due: {new Date(project.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  {project.adminPrice && (
                    <div className="flex items-center text-sm">
                      <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        ${project.adminPrice.toLocaleString()}
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

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { StatCard } from '@/features/employee/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { AssignedProject, EmployeeStats } from '@/features/employee/models/AssignedProjectModel';
import { auth } from '@/firebaseConfig';
import { collection, query, where, getDocs, getFirestore } from 'firebase/firestore';

export function DashboardView() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<EmployeeStats>({
    totalAssigned: 0,
    inProgress: 0,
    completed: 0,
    needsRevision: 0,
  });
  const [recentProjects, setRecentProjects] = useState<AssignedProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate('/login');
          return;
        }

        const db = getFirestore();
        const projectsRef = collection(db, 'projects');
        
        // Query projects assigned to this employee
        const q = query(
          projectsRef,
          where('assignedEmployeeId', '==', user.uid)
        );
        
        const snapshot = await getDocs(q);
        const projects: AssignedProject[] = [];
        
        let inProgress = 0;
        let completed = 0;
        let needsRevision = 0;
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          const project: AssignedProject = {
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
          };
          
          projects.push(project);
          
          // Count by status
          if (project.status === 'in_progress' || project.status === 'assigned') {
            inProgress++;
          } else if (project.status === 'completed' || project.status === 'completed_by_employee') {
            completed++;
          } else if (project.status === 'needs_revision') {
            needsRevision++;
          }
        });
        
        setStats({
          totalAssigned: projects.length,
          inProgress,
          completed,
          needsRevision,
        });
        
        // Get recent 5 projects
        setRecentProjects(projects.slice(0, 5));
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [navigate]);

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
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Assigned"
          value={stats.totalAssigned}
          description="Projects assigned to you"
          icon={FolderOpen}
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          description="Currently working on"
          icon={Clock}
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          description="Successfully finished"
          icon={CheckCircle}
        />
        <StatCard
          title="Needs Revision"
          value={stats.needsRevision}
          description="Requires changes"
          icon={AlertCircle}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Performance Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-64 flex items-center justify-center text-muted-foreground">
              Performance Chart Placeholder
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm flex-1 min-w-0 truncate">
                  New project assigned
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  2h ago
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm flex-1 min-w-0 truncate">
                  Work submitted for review
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  4h ago
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm flex-1 min-w-0 truncate">
                  Project approved by admin
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  1d ago
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Projects</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/employee/projects')}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentProjects.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No projects assigned yet
            </p>
          ) : (
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/employee/projects/${project.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{project.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {project.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={getStatusColor(project.status)}>
                        {getStatusLabel(project.status)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Due: {new Date(project.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

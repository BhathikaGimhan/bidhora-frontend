import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import {
  DollarSign,
  Calendar,
  MapPin,
  Tag,
  FileText,
  User,
  Mail,
  Phone,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Briefcase,
} from 'lucide-react';
import { Project } from '@/features/admin/models/ProjectModel';

interface ClientInfo {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  phoneNumber?: string;
  location?: string;
  bio?: string;
  role: string;
  createdAt?: string;
  totalProjects?: number;
  rating?: number;
  verified?: boolean;
}

interface ProjectDetailsModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectDetailsModal({ project, isOpen, onClose }: ProjectDetailsModalProps) {
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchClientDetails = useCallback(async () => {
    if (!project?.clientId) return;

    setLoading(true);
    try {
      // Fetch client details from Firestore
      const { getFirestore } = await import('firebase/firestore');
      const { doc, getDoc } = await import('firebase/firestore');
      const db = getFirestore();
      
      const clientDoc = await getDoc(doc(db, 'users', project.clientId));
      
      if (clientDoc.exists()) {
        const data = clientDoc.data();
        setClientInfo({
          id: clientDoc.id,
          name: data.displayName || data.name || 'Unknown User',
          email: data.email || '',
          photoURL: data.photoURL || data.avatar,
          phoneNumber: data.phoneNumber,
          location: data.location,
          bio: data.bio,
          role: data.role || 'buyer',
          createdAt: data.createdAt?.toDate().toISOString(),
          totalProjects: data.totalProjects || 0,
          rating: data.rating || 0,
          verified: data.verified || false,
        });
      } else {
        // If client details not found, use basic info
        setClientInfo({
          id: project.clientId,
          name: project.clientName || 'Unknown User',
          email: '',
          role: 'buyer',
        });
      }
    } catch (error) {
      console.error('Error fetching client details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load client details',
        variant: 'destructive',
      });
      // Set basic info from project
      setClientInfo({
        id: project.clientId,
        name: project.clientName || 'Unknown User',
        email: '',
        role: 'buyer',
      });
    } finally {
      setLoading(false);
    }
  }, [project, toast]);

  useEffect(() => {
    if (project && isOpen) {
      fetchClientDetails();
    }
  }, [project, isOpen, fetchClientDetails]);

  if (!project) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Project Details</DialogTitle>
          <DialogDescription>
            Complete information about the project and client
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Project Status Banner */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(project.status)}
                <Badge variant={getStatusColor(project.status)} className="text-sm">
                  {project.status.toUpperCase()}
                </Badge>
              </div>
              {project.isUrgent && (
                <Badge variant="destructive" className="flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>URGENT</span>
                </Badge>
              )}
            </div>

            {/* Project Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5" />
                  <span>Project Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {project.description}
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Budget</p>
                      <p className="text-lg font-semibold">
                        ${project.budget.min.toLocaleString()} - ${project.budget.max.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Deadline</p>
                      <p className="text-lg font-semibold">
                        {new Date(project.deadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Tag className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Category</p>
                      <Badge variant="outline" className="mt-1">
                        {project.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Posted On</p>
                      <p className="text-lg font-semibold">
                        {new Date(project.createdDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {project.skillsRequired && project.skillsRequired.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Required Skills
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {project.skillsRequired.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Client Information</span>
                </CardTitle>
                <CardDescription>
                  Details about the project owner
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : clientInfo ? (
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={clientInfo.photoURL} alt={clientInfo.name} />
                        <AvatarFallback className="text-lg">
                          {clientInfo.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold">{clientInfo.name}</h3>
                          {clientInfo.verified && (
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {clientInfo.role.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {clientInfo.email && (
                        <div className="flex items-start space-x-3">
                          <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Email</p>
                            <p className="text-sm break-all">{clientInfo.email}</p>
                          </div>
                        </div>
                      )}

                      {clientInfo.phoneNumber && (
                        <div className="flex items-start space-x-3">
                          <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Phone</p>
                            <p className="text-sm">{clientInfo.phoneNumber}</p>
                          </div>
                        </div>
                      )}

                      {clientInfo.location && (
                        <div className="flex items-start space-x-3">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Location</p>
                            <p className="text-sm">{clientInfo.location}</p>
                          </div>
                        </div>
                      )}

                      {clientInfo.totalProjects !== undefined && (
                        <div className="flex items-start space-x-3">
                          <Briefcase className="h-4 w-4 text-muted-foreground mt-1" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Total Projects
                            </p>
                            <p className="text-sm">{clientInfo.totalProjects}</p>
                          </div>
                        </div>
                      )}

                      {clientInfo.rating !== undefined && clientInfo.rating > 0 && (
                        <div className="flex items-start space-x-3">
                          <span className="text-yellow-500 mt-1">★</span>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Rating</p>
                            <p className="text-sm">{clientInfo.rating.toFixed(1)} / 5.0</p>
                          </div>
                        </div>
                      )}

                      {clientInfo.createdAt && (
                        <div className="flex items-start space-x-3">
                          <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Member Since
                            </p>
                            <p className="text-sm">
                              {new Date(clientInfo.createdAt).toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {clientInfo.bio && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Bio</p>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {clientInfo.bio}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No client information available</p>
                )}
              </CardContent>
            </Card>

            {/* Project Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Project ID</p>
                    <p className="font-mono text-xs mt-1">{project.id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Featured</p>
                    <p className="mt-1">{project.featured ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

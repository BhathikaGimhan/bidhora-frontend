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
  Download,
  Star,
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
    if (!project?.clientId) {
      console.log('No clientId found in project:', project);
      return;
    }

    console.log('Fetching client details for clientId:', project.clientId);
    setLoading(true);
    try {
      // Fetch client details from Firestore
      const { getFirestore } = await import('firebase/firestore');
      const { doc, getDoc, collection, query, where, getDocs } = await import('firebase/firestore');
      const db = getFirestore();
      
      let clientDoc;
      let clientData = null;
      
      // Check if clientId is an email (contains @)
      if (project.clientId.includes('@')) {
        console.log('ClientId is an email, querying by email:', project.clientId);
        // Query users collection by email
        const usersQuery = query(
          collection(db, 'users'),
          where('email', '==', project.clientId)
        );
        const querySnapshot = await getDocs(usersQuery);
        
        console.log('Query returned', querySnapshot.size, 'documents');
        
        if (!querySnapshot.empty) {
          clientDoc = querySnapshot.docs[0];
          clientData = clientDoc.data();
          console.log('Found client by email:', clientData);
        }
      } else {
        // Assume it's a user ID, fetch directly
        console.log('ClientId is a UID, fetching directly');
        clientDoc = await getDoc(doc(db, 'users', project.clientId));
        if (clientDoc.exists()) {
          clientData = clientDoc.data();
          console.log('Found client by UID:', clientData);
        }
      }
      
      if (clientData) {
        // Count actual projects for this client
        // First check if postedProjects array exists
        let projectCount = 0;
        
        if (clientData.postedProjects && Array.isArray(clientData.postedProjects)) {
          projectCount = clientData.postedProjects.length;
          console.log('Found', projectCount, 'projects in postedProjects array');
        } else if (clientData.totalProjects) {
          projectCount = clientData.totalProjects;
          console.log('Using totalProjects from user document:', projectCount);
        } else {
          // Fallback: Query projects collection
          try {
            console.log('Counting projects from projects collection...');
            const projectsRef = collection(db, 'projects');
            let projectsQuery;
            
            if (clientDoc?.id) {
              // If we have the UID, query by createdBy
              projectsQuery = query(projectsRef, where('createdBy', '==', clientDoc.id));
            } else if (project.clientId.includes('@')) {
              // If we only have email, query by buyerEmail
              projectsQuery = query(projectsRef, where('buyerEmail', '==', project.clientId));
            }
            
            if (projectsQuery) {
              const projectsSnapshot = await getDocs(projectsQuery);
              projectCount = projectsSnapshot.size;
              console.log('Found', projectCount, 'projects from query');
            }
          } catch (error) {
            console.error('Error counting projects:', error);
          }
        }
        
        setClientInfo({
          id: clientDoc?.id || project.clientId,
          name: clientData.displayName || clientData.name || project.clientName || 'Unknown User',
          email: clientData.email || project.clientId,
          photoURL: clientData.photoURL || clientData.avatar,
          phoneNumber: clientData.phoneNumber,
          location: clientData.location,
          bio: clientData.bio,
          role: clientData.role || 'buyer',
          createdAt: clientData.createdAt?.toDate?.().toISOString(),
          totalProjects: projectCount,
          rating: clientData.rating || 0,
          verified: clientData.verified || false,
        });
      } else {
        console.log('Client not found in database, using project data');
        // If client details not found, use basic info from project
        setClientInfo({
          id: project.clientId,
          name: project.clientName || 'Unknown User',
          email: project.clientId.includes('@') ? project.clientId : '',
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
        email: project.clientId.includes('@') ? project.clientId : '',
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
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-6">
          <DialogTitle className="text-xl sm:text-2xl">Project Details</DialogTitle>
          <DialogDescription className="text-sm">
            Complete information about the project and client
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="space-y-4 sm:space-y-6 pt-4">
            {/* Project Status Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                {getStatusIcon(project.status)}
                <Badge variant={getStatusColor(project.status)} className="text-xs sm:text-sm">
                  {project.status.toUpperCase()}
                </Badge>
              </div>
              {project.isUrgent && (
                <Badge variant="destructive" className="flex items-center space-x-1 text-xs sm:text-sm">
                  <AlertCircle className="h-3 w-3" />
                  <span>URGENT</span>
                </Badge>
              )}
            </div>

            {/* Project Information */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Project Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 break-words">{project.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap break-words">
                    {project.description}
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Project ID</p>
                      <p className="text-sm sm:text-base font-semibold font-mono break-all">
                        {project.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Budget</p>
                      <div className="text-sm sm:text-base font-semibold break-words">
                        <span className="font-medium text-xs sm:text-sm">Budget Range:</span>{" "}
                        <div className="break-words">LKR {project.budget.min.toLocaleString()} - LKR {project.budget.max.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Deadline</p>
                      <p className="text-sm sm:text-base font-semibold break-words">
                        {new Date(project.deadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Category</p>
                      <Badge variant="outline" className="mt-1 text-xs sm:text-sm">
                        {project.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Posted On</p>
                      <p className="text-sm sm:text-base font-semibold break-words">
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
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">
                        Required Skills
                      </p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {project.skillsRequired.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Buyer Documents Section */}
            {project.documents && project.documents.length > 0 && (
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Buyer's Project Documents</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Documents uploaded by the buyer with the project
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-2 sm:space-y-3">
                    {project.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 border border-border rounded-lg hover:bg-accent transition-colors gap-2"
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0 w-full sm:w-auto">
                          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium truncate">{doc.name}</p>
                            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                              {doc.size && (
                                <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                              )}
                              {doc.uploadedAt && (
                                <span>
                                  • Uploaded{' '}
                                  {new Date(doc.uploadedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.url, '_blank')}
                          className="flex-shrink-0 w-full sm:w-auto text-xs sm:text-sm h-8"
                        >
                          <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Client Information */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Client Information</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Details about the project owner
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : clientInfo ? (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                        <AvatarImage src={clientInfo.photoURL} alt={clientInfo.name} />
                        <AvatarFallback className="text-base sm:text-lg">
                          {clientInfo.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-1">
                          <h3 className="text-base sm:text-lg font-semibold break-words">{clientInfo.name}</h3>
                          {clientInfo.verified && (
                            <Badge variant="outline" className="text-xs w-fit">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {clientInfo.email && (
                        <div className="flex items-start space-x-2 sm:space-x-3">
                          <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground mt-1 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Email</p>
                            <p className="text-xs sm:text-sm break-all">{clientInfo.email}</p>
                          </div>
                        </div>
                      )}

                      {clientInfo.phoneNumber && (
                        <div className="flex items-start space-x-2 sm:space-x-3">
                          <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground mt-1 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Phone</p>
                            <p className="text-xs sm:text-sm">{clientInfo.phoneNumber}</p>
                          </div>
                        </div>
                      )}

                      {clientInfo.location && (
                        <div className="flex items-start space-x-2 sm:space-x-3">
                          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground mt-1 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Location</p>
                            <p className="text-xs sm:text-sm">{clientInfo.location}</p>
                          </div>
                        </div>
                      )}

                      {clientInfo.totalProjects !== undefined && (
                        <div className="flex items-start space-x-2 sm:space-x-3">
                          <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground mt-1 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                              Total Projects
                            </p>
                            <p className="text-xs sm:text-sm">{clientInfo.totalProjects}</p>
                          </div>
                        </div>
                      )}

                      {clientInfo.rating !== undefined && clientInfo.rating > 0 && (
                        <div className="flex items-start space-x-2 sm:space-x-3">
                          <span className="text-yellow-500 mt-1 text-sm">★</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Rating</p>
                            <p className="text-xs sm:text-sm">{clientInfo.rating.toFixed(1)} / 5.0</p>
                          </div>
                        </div>
                      )}

                      {clientInfo.createdAt && (
                        <div className="flex items-start space-x-2 sm:space-x-3">
                          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground mt-1 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                              Member Since
                            </p>
                            <p className="text-xs sm:text-sm">
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
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">Bio</p>
                          <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap break-words">
                            {clientInfo.bio}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-muted-foreground">No client information available</p>
                )}
              </CardContent>
            </Card>

            {/* Project Metadata */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-sm sm:text-base font-medium">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <p className="text-muted-foreground">Project ID</p>
                    <p className="font-mono text-[10px] sm:text-xs mt-1 break-all">{project.id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Featured</p>
                    <p className="mt-1">{project.featured ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Review Section */}
            {project.customerRating && (
              <Card className="border-yellow-200 dark:border-yellow-800">
                <CardHeader className="bg-yellow-50 dark:bg-yellow-950">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    Customer Review
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Star Rating Display */}
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= (project.customerRating || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">
                      {project.customerRating}.0 out of 5 stars
                    </span>
                  </div>

                  {/* Review Text */}
                  {project.customerReview && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Feedback:</p>
                      <p className="text-sm leading-relaxed border-l-2 border-yellow-500 pl-3 py-1 bg-muted/50 rounded-r">
                        "{project.customerReview}"
                      </p>
                    </div>
                  )}

                  {/* Review Date */}
                  {project.customerReviewedAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Reviewed on{' '}
                      {new Date(project.customerReviewedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        
      </DialogContent>
    </Dialog>
  );
}
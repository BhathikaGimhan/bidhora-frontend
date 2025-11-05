import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  Calendar,
  DollarSign,
  Clock,
  User,
  Mail,
  Tag,
  AlertCircle,
  ArrowLeft,
  FileText,
  Download
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { AssignedProject } from '@/features/employee/models/AssignedProjectModel';
import { auth } from '@/firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getFirestore, 
  doc, 
  updateDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ClientInfo {
  displayName: string;
  email: string;
  photoURL?: string;
  phoneNumber?: string;
}

export function ProjectDetailsView() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState<AssignedProject | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showSubmitSection, setShowSubmitSection] = useState(false);

  useEffect(() => {
    const loadProjectDetails = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate('/');
          return;
        }

        const db = getFirestore();
        
        if (projectId) {
          // Load specific project
          const projectDoc = await getDocs(
            query(
              collection(db, 'projects'),
              where('__name__', '==', projectId),
              where('assignedEmployeeId', '==', user.uid)
            )
          );
          
          if (!projectDoc.empty) {
            const data = projectDoc.docs[0].data();
            const projectData: AssignedProject = {
              id: projectDoc.docs[0].id,
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
            };
            setProject(projectData);

            // Fetch client information
            if (data.createdBy) {
              const userDoc = await getDoc(doc(db, 'users', data.createdBy));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                setClientInfo({
                  displayName: userData.displayName || userData.name || 'Anonymous',
                  email: userData.email || '',
                  photoURL: userData.photoURL || userData.profileUrl,
                  phoneNumber: userData.phoneNumber,
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading project details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load project details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProjectDetails();
  }, [projectId, navigate, toast]);

  const calculateProgress = () => {
    if (!project) return 0;
    
    const now = new Date();
    const start = new Date(project.assignedDate);
    
    // Use admin deadline if available, otherwise fall back to buyer deadline
    let end: Date;
    if (project.adminDuration && project.adminDurationUnit && project.assignedDate) {
      const durationInDays = project.adminDurationUnit === 'weeks' 
        ? project.adminDuration * 7 
        : project.adminDuration;
      end = new Date(project.assignedDate);
      end.setDate(end.getDate() + durationInDays);
    } else {
      end = new Date(project.deadline);
    }
    
    const totalTime = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    
    const progress = (elapsed / totalTime) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const getDaysRemaining = () => {
    if (!project) return 0;
    
    const now = new Date();
    
    // Use admin deadline if available, otherwise fall back to buyer deadline
    let deadline: Date;
    if (project.adminDuration && project.adminDurationUnit && project.assignedDate) {
      const durationInDays = project.adminDurationUnit === 'weeks' 
        ? project.adminDuration * 7 
        : project.adminDuration;
      deadline = new Date(project.assignedDate);
      deadline.setDate(deadline.getDate() + durationInDays);
    } else {
      deadline = new Date(project.deadline);
    }
    
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getEffectiveDeadline = () => {
    if (!project) return '';
    
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please upload at least one file before submitting',
        variant: 'destructive',
      });
      return;
    }

    if (!project) return;

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const storage = getStorage();
      const db = getFirestore();
      const uploadedDocuments = [];

      // Upload all files
      for (const file of uploadedFiles) {
        const storageRef = ref(
          storage,
          `project-submissions/${project.id}/${Date.now()}_${file.name}`
        );
        
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        
        uploadedDocuments.push({
          url: downloadURL,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        });
      }

      // Update project status
      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, {
        status: 'completed_by_employee',
        submittedToAdminAt: serverTimestamp(),
        adminReviewStatus: 'pending',
        documents: uploadedDocuments,
        employeeNotes: notes,
      });

      toast({
        title: 'Success',
        description: 'Work submitted successfully!',
      });

      navigate('/employee/projects');
      
    } catch (error) {
      console.error('Error submitting work:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit work. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!project) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">Project not found</p>
          <Button onClick={() => navigate('/employee/projects')}>
            Back to Projects
          </Button>
        </CardContent>
      </Card>
    );
  }

  const daysRemaining = getDaysRemaining();
  const progress = calculateProgress();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 rounded-lg">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-lg"
          onClick={() => navigate('/employee/projects')}
        >
          <ArrowLeft className="h-5 w-5 rounded-lg" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Project Details</h1>
          <p className="text-muted-foreground">View and manage project information</p>
        </div>
      </div>

      {/* Urgent Project Alert */}
      {project.isUrgent && (
        <div className="relative overflow-hidden p-6 bg-gradient-to-r from-red-600 via-red-700 to-red-600 dark:from-red-700 dark:via-red-800 dark:to-red-700 rounded-xl shadow-2xl border-2 border-red-400 dark:border-red-500">
          {/* Animated background elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse delay-75"></div>
          
          <div className="relative flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-2xl">
                <AlertCircle className="h-8 w-8 text-white animate-pulse" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-2xl font-black text-white drop-shadow-lg">
                  🚨 URGENT PROJECT
                </h3>
                <Badge className="bg-yellow-400 text-red-900 font-bold px-3 py-1 text-sm animate-bounce shadow-lg">
                  IMMEDIATE ACTION REQUIRED
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-white/95 font-semibold text-base leading-relaxed drop-shadow-md">
                  ⚡ This project has been marked as HIGH PRIORITY and requires immediate attention.
                </p>
                <p className="text-white/90 text-sm leading-relaxed drop-shadow-md">
                  🎯 Please prioritize this work and complete it as soon as possible to meet critical deadlines.
                </p>
              </div>
              <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <p className="text-white/95 text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></span>
                  <span className="w-2 h-2 bg-yellow-400 rounded-full absolute"></span>
                  <span className="ml-2">Urgent projects receive priority review and faster payment processing.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Overview */}
      <Card className={`${project.isUrgent ? 'border-red-500 border-2 shadow-xl shadow-red-200 dark:shadow-red-900/50 bg-gradient-to-br from-red-50/30 to-white dark:from-red-950/10 dark:to-background' : ''}`}>
        <CardHeader className={project.isUrgent ? 'bg-gradient-to-r from-red-50 to-transparent dark:from-red-950/20 dark:to-transparent' : ''}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {project.isUrgent && (
                  <div className="relative">
                    <AlertCircle className="h-7 w-7 text-red-500 animate-pulse" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                  </div>
                )}
                <CardTitle className={`text-2xl ${project.isUrgent ? 'text-red-700 dark:text-red-400 font-bold' : ''}`}>
                  {project.title}
                </CardTitle>
              </div>
              {project.isUrgent && (
                <div className="mb-3 flex items-center gap-2">
                  <Badge variant="destructive" className="font-bold text-sm px-3 py-1 bg-red-600 hover:bg-red-700 shadow-lg animate-pulse">
                    🚨 URGENT PROJECT - HIGH PRIORITY
                  </Badge>
                  <Badge className="bg-yellow-400 text-red-900 font-bold text-xs px-2 py-1">
                    FAST TRACK
                  </Badge>
                </div>
              )}
              <CardDescription className="text-base">
                {project.description}
              </CardDescription>
            </div>
            <Badge variant={
              project.status === 'completed' ? 'default' :
              project.status === 'completed_by_employee' ? 'secondary' :
              project.status === 'needs_revision' ? 'destructive' :
              'outline'
            } className="ml-4">
              {project.status === 'completed_by_employee' ? 'Submitted' :
               project.status === 'completed' ? 'Completed' :
               project.status === 'needs_revision' ? 'Needs Revision' :
               project.status === 'in_progress' ? 'In Progress' : 'Assigned'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Project Timeline</span>
              <span className={`font-medium ${daysRemaining < 0 ? 'text-destructive' : daysRemaining < 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : 
                 daysRemaining === 0 ? 'Due today' :
                 `${daysRemaining} days remaining`}
              </span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Started: {new Date(project.assignedDate).toLocaleDateString()}</span>
              <span>Deadline: {new Date(getEffectiveDeadline()).toLocaleDateString()}</span>
            </div>
          </div>

          <Separator />

          {/* Project Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Category</p>
                <p className="text-sm text-muted-foreground">{project.category}</p>
              </div>
            </div>
            
            {project.adminPrice && (
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Project Value</p>
                  <p className="text-sm text-muted-foreground">
                    LKR {project.adminPrice.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
            
            {project.adminDuration && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-sm text-muted-foreground">
                    {project.adminDuration} {project.adminDurationUnit}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Assigned Date</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(project.assignedDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Skills Required */}
          {project.skillsRequired.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-3">Required Skills</p>
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

          {/* Admin Notes */}
          {project.adminNotes && (
            <>
              <Separator />
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Admin Instructions
                  </p>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200 ml-7">
                  {project.adminNotes}
                </p>
              </div>
            </>
          )}

          {/* Revision Notes */}
          {project.adminReviewNotes && project.status === 'needs_revision' && (
            <>
              <Separator />
              <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">
                    Revision Required
                  </p>
                </div>
                <p className="text-sm text-red-800 dark:text-red-200 ml-7">
                  {project.adminReviewNotes}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Client Information */}
      {clientInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={clientInfo.photoURL} alt={clientInfo.displayName} />
                <AvatarFallback className="text-lg">
                  {clientInfo.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{clientInfo.displayName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{clientInfo.email}</span>
                </div>
                {clientInfo.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{clientInfo.phoneNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Buyer Documents Section */}
      {project.documents && project.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Buyer's Project Documents
            </CardTitle>
            <CardDescription>
              Reference documents uploaded by the buyer for this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {project.documents.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
                    className="flex-shrink-0"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Work Section */}
      {project.status !== 'completed' && project.status !== 'completed_by_employee' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Submit Completed Work</CardTitle>
                <CardDescription>
                  Upload your completed files and submit for admin review
                </CardDescription>
              </div>
              {!showSubmitSection && (
                <Button onClick={() => setShowSubmitSection(true)}>
                  Submit Work
                </Button>
              )}
            </div>
          </CardHeader>
          {showSubmitSection && (
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Upload Files</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, DOC, DOCX, ZIP (max 10MB per file)
                    </p>
                  </label>
                </div>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Files ({uploadedFiles.length})</Label>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <File className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes for Admin (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes or comments about the completed work..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSubmitSection(false);
                    setUploadedFiles([]);
                    setNotes('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || uploadedFiles.length === 0}
                  className="flex-1"
                >
                  {submitting ? 'Submitting...' : 'Submit Work'}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Already Submitted Notice */}
      {project.status === 'completed_by_employee' && (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-2">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Work Submitted Successfully</h3>
              <p className="text-sm text-muted-foreground">
                Your work is pending admin review. You'll be notified once it's reviewed.
              </p>
              {project.submittedToAdminAt && (
                <p className="text-xs text-muted-foreground">
                  Submitted on: {new Date(project.submittedToAdminAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Notice */}
      {project.status === 'completed' && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-2">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                Project Completed
              </h3>
              <p className="text-sm text-green-800 dark:text-green-200">
                This project has been successfully completed and approved by the admin.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, X, CheckCircle } from 'lucide-react';
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
  serverTimestamp 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export function SubmitWorkView() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState<AssignedProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.warn('No authenticated user found');
          toast({
            variant: 'destructive',
            title: 'Authentication Required',
            description: 'Please ensure you are logged in.',
          });
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
            setProject({
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
            });
          }
        }
      } catch (error) {
        console.error('Error loading project:', error);
        toast({
          title: 'Error',
          description: 'Failed to load project details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId, navigate, toast]);

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{project.title}</CardTitle>
              <CardDescription className="mt-2">
                {project.description}
              </CardDescription>
            </div>
            <Badge>
              {project.status === 'completed_by_employee' ? 'Submitted' : 'In Progress'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Category</p>
              <p className="text-sm">{project.category}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Deadline</p>
              <p className="text-sm">{new Date(project.deadline).toLocaleDateString()}</p>
            </div>
            {project.adminPrice && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Project Value</p>
                                <p className="text-xs text-muted-foreground">Project Price</p>
                <p className="text-sm">LKR {project.adminPrice.toLocaleString()}</p>
              </div>
            )}
            {project.adminDuration && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Duration</p>
                <p className="text-sm">
                  {project.adminDuration} {project.adminDurationUnit}
                </p>
              </div>
            )}
          </div>

          {project.adminNotes && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Admin Notes:</p>
              <p className="text-sm text-muted-foreground">{project.adminNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submit Completed Work</CardTitle>
          <CardDescription>
            Upload your completed files and add any notes for the admin
          </CardDescription>
        </CardHeader>
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
                disabled={project.status === 'completed_by_employee'}
              />
              <label
                htmlFor="file-upload"
                className={`cursor-pointer flex flex-col items-center ${
                  project.status === 'completed_by_employee' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
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
                      disabled={project.status === 'completed_by_employee'}
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
              disabled={project.status === 'completed_by_employee'}
            />
          </div>

          {project.status === 'completed_by_employee' ? (
            <div className="flex items-center justify-center p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-green-500">
                Work already submitted and pending admin review
              </span>
            </div>
          ) : (
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/employee/projects')}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

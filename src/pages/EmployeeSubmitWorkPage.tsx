import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '@/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  ArrowLeft,
  Package,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  submitPart,
  getProjectSubmissions,
} from '@/Services/partSubmissionService';
import type { PartSubmission } from '@/types/partSubmission';

export default function EmployeeSubmitWorkPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [projectTitle, setProjectTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [partTag, setPartTag] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  
  // Submissions history
  const [submissions, setSubmissions] = useState<PartSubmission[]>([]);

  useEffect(() => {
    loadProjectAndSubmissions();
  }, [projectId]);

  const loadProjectAndSubmissions = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user || !projectId) return;

      // Load project
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (projectDoc.exists()) {
        setProjectTitle(projectDoc.data().title);
      }

      // Load existing submissions
      const subs = await getProjectSubmissions(projectId);
      setSubmissions(subs);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!partTag.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a part tag (e.g., "Part 1")',
        variant: 'destructive',
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a description',
        variant: 'destructive',
      });
      return;
    }

    if (files.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please upload at least one file',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      console.log("📨 Submitting part:", { partTag, description, fileCount: files.length });
      
      const result = await submitPart({
        projectId: projectId!,
        partTag: partTag.trim(),
        description: description.trim(),
        files,
      });

      console.log("✅ Submission successful:", result);

      toast({
        title: 'Success!',
        description: 'Part submitted successfully for admin review',
      });

      // Reset form
      setPartTag('');
      setDescription('');
      setFiles([]);
      (document.getElementById('file-upload') as HTMLInputElement).value = '';

      // Reload submissions
      await loadProjectAndSubmissions();
      console.log("🔄 Submissions reloaded");
    } catch (error) {
      console.error('❌ Error in component submit:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit part',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (submission: PartSubmission) => {
    switch (submission.status) {
      case 'pending_review':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending Review
          </Badge>
        );
      case 'approved':
        return submission.paymentStatus === 'paid' ? (
          <Badge variant="default" className="bg-emerald-600 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Paid
          </Badge>
        ) : (
          <Badge variant="default" className="bg-blue-600 gap-1">
            <DollarSign className="h-3 w-3" />
            Awaiting Payment
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Needs Revision
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Submit New Part Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Submit New Part
            </CardTitle>
            <CardDescription>
              Submit your work in parts with tags like "Part 1", "Part 2", etc.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Input
                  id="project"
                  value={projectTitle}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="partTag">
                  Part Tag <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="partTag"
                  placeholder="e.g., Part 1, Milestone A, Revision 1"
                  value={partTag}
                  onChange={(e) => setPartTag(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Give this submission a clear identifier
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe what you've completed in this part..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file-upload">
                  Files <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    required
                  />
                </div>
                {files.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {files.length} file(s) selected
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Submit Part
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Submission History */}
        <Card>
          <CardHeader>
            <CardTitle>Submission History</CardTitle>
            <CardDescription>
              Track all parts you've submitted for this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No submissions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{sub.partTag}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(sub)}
                    </div>

                    <p className="text-sm">{sub.description}</p>

                    {sub.status === 'approved' && sub.adminPrice && (
                      <>
                        <Separator />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Admin Price:</span>
                          <span className="font-semibold text-emerald-600">
                            LKR {sub.adminPrice.toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}

                    {sub.adminNotes && (
                      <>
                        <Separator />
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                          <p className="text-xs font-medium text-yellow-900 mb-1">
                            Admin Notes:
                          </p>
                          <p className="text-xs text-yellow-800">{sub.adminNotes}</p>
                        </div>
                      </>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      {sub.documents.length} file(s)
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

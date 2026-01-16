import React, { useState, useEffect } from 'react';
import { auth } from '@/firebaseConfig';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  DollarSign,
  Eye,
  Calendar,
  User,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getAllPendingSubmissions,
  reviewPartSubmission,
} from '@/Services/partSubmissionService';
import type { PartSubmission } from '@/types/partSubmission';

export default function PartSubmissionsView() {
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<PartSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<PartSubmission | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  
  // Review form state
  const [adminPrice, setAdminPrice] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const subs = await getAllPendingSubmissions();
      setSubmissions(subs);
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load submissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openReviewDialog = (submission: PartSubmission, action: 'approved' | 'rejected') => {
    setSelectedSubmission(submission);
    setReviewAction(action);
    setAdminPrice('');
    setAdminNotes('');
    setReviewDialogOpen(true);
  };

  const handleReview = async () => {
    if (!selectedSubmission) return;

    // Validate: approval requires price
    if (reviewAction === 'approved' && !adminPrice) {
      toast({
        title: 'Validation Error',
        description: 'Price is required for approval',
        variant: 'destructive',
      });
      return;
    }

    const priceValue = parseFloat(adminPrice);
    if (reviewAction === 'approved' && (isNaN(priceValue) || priceValue <= 0)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid price',
        variant: 'destructive',
      });
      return;
    }

    try {
      setReviewing(true);

      await reviewPartSubmission({
        submissionId: selectedSubmission.id,
        status: reviewAction,
        adminPrice: reviewAction === 'approved' ? priceValue : undefined,
        adminNotes: adminNotes.trim() || undefined,
      });

      toast({
        title: 'Success!',
        description: `Part ${reviewAction === 'approved' ? 'approved' : 'rejected'} successfully`,
      });

      setReviewDialogOpen(false);
      setSelectedSubmission(null);
      
      // Reload submissions
      await loadSubmissions();
    } catch (error) {
      console.error('Error reviewing submission:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to review submission',
        variant: 'destructive',
      });
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-muted-foreground">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Part Submissions</CardTitle>
          <CardDescription>
            Review and approve employee part submissions with pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No pending submissions</p>
              <p className="text-sm">All parts have been reviewed</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Tag</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Files</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">
                        {submission.partTag}
                      </TableCell>
                      <TableCell>{submission.projectId.substring(0, 8)}...</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {submission.employeeName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {submission.documents.length} file(s)
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSubmission(submission);
                              // Could open a preview dialog here
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => openReviewDialog(submission, 'approved')}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openReviewDialog(submission, 'rejected')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approved' ? 'Approve Part' : 'Reject Part'}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approved'
                ? 'Set the price for this part and optionally add notes for the buyer'
                : 'Provide feedback on why this part needs revision'}
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Part Tag</Label>
                <Input value={selectedSubmission.partTag} disabled className="bg-muted" />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={selectedSubmission.description}
                  disabled
                  className="bg-muted"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Files Submitted</Label>
                <div className="text-sm text-muted-foreground">
                  {selectedSubmission.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-2 py-1">
                      <FileText className="h-4 w-4" />
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {doc.name}
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {reviewAction === 'approved' && (
                <div className="space-y-2">
                  <Label htmlFor="price">
                    Price (LKR) <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      placeholder="e.g., 5000"
                      value={adminPrice}
                      onChange={(e) => setAdminPrice(e.target.value)}
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Buyer will pay this amount to download files for this part
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Admin Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder={
                    reviewAction === 'approved'
                      ? 'Any additional notes for the buyer...'
                      : 'Explain what needs to be revised...'
                  }
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              disabled={reviewing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={reviewing}
              variant={reviewAction === 'approved' ? 'default' : 'destructive'}
              className={reviewAction === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              {reviewing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {reviewAction === 'approved' ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approve & Set Price
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject & Request Revision
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

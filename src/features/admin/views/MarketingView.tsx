import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from '@/features/admin/models/UserModel';
import { useToast } from '@/hooks/use-toast';
import { getAllUsers, updateUserMarketerStatus } from '@/Services/authService';
import { getProjectsByPromoCode, Project } from '@/Services/projectService';
import { emailService } from '@/Services/emailService';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { RefreshCw, Edit, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function MarketingView() {
  const [marketers, setMarketers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMarketer, setSelectedMarketer] = useState<User | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [commissionRate, setCommissionRate] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Accordion state
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [projectsCache, setProjectsCache] = useState<Record<string, Project[]>>({});
  const [loadingProjects, setLoadingProjects] = useState<Record<string, boolean>>({});

  const { toast } = useToast();

  const fetchMarketers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllUsers();
      const marketerUsers = response.users.filter(user => !!user.isMarketer);
      setMarketers(marketerUsers);
    } catch (error) {
      console.error("Error fetching marketers:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch marketers",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMarketers();
  }, [fetchMarketers]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMarketers();
  };

  const handleEditClick = (user: User) => {
    setSelectedMarketer(user);
    setPromoCode(user.promoCode || '');
    setCommissionRate(user.commissionRate || 0);
    setEditDialogOpen(true);
  };

  const handleUpdateMarketer = async () => {
    if (!selectedMarketer) return;

    try {
      setActionLoading(true);
      await updateUserMarketerStatus({
        targetUserId: selectedMarketer.id,
        isMarketer: true,
        promoCode,
        commissionRate,
      });

      // Send welcome email if it's a new marketer or details changed
      try {
        await emailService.sendMarketerWelcomeEmail({
          email: selectedMarketer.email,
          name: selectedMarketer.name,
          promoCode,
          commissionRate,
          profileId: selectedMarketer.id,
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't block the UI update if email fails, but maybe show a warning toast
      }

      toast({
        title: "Success",
        description: "Marketer details updated and email sent successfully",
      });
      setEditDialogOpen(false);
      fetchMarketers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update marketer details",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const generateProjectReport = async (project: Project, marketer: User) => {
    const commission = calculateCommission(project.adminPrice || 0, marketer.commissionRate || 0);
    const reportDate = new Date().toLocaleDateString();
    const reportId = `REP-${project.id.substring(0, 8).toUpperCase()}-${Date.now()}`;

    // Create a temporary container for the report HTML
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '210mm'; // A4 width
    container.style.minHeight = '297mm'; // A4 height
    container.style.backgroundColor = 'white';
    container.style.fontFamily = '"Inter", "Segoe UI", sans-serif';

    container.innerHTML = `
      <div style="padding: 0; color: #333; font-family: 'Inter', sans-serif; width: 210mm; min-height: 297mm; position: relative; box-sizing: border-box;">
        
        <!-- Header Background -->
        <div style="background-color: #059669; height: 35mm; width: 100%; position: absolute; top: 0; left: 0; z-index: 0;"></div>
        
        <!-- Header Content -->
        <div style="position: relative; z-index: 1; padding: 6mm 15mm; display: flex; justify-content: space-between; align-items: flex-start;">
           <div style="color: white;">
             <h1 style="font-size: 22pt; font-weight: bold; margin: 0; line-height: 1;">Bidhora</h1>
             <p style="margin: 4px 0 0 0; font-size: 9pt; opacity: 0.9;">Marketing Partner Program</p>
           </div>
           <div style="text-align: right; padding-top: 6mm;">
             <h2 style="font-size: 18pt; font-weight: bold; margin: 0; color: white;">COMMISSION REPORT</h2>
           </div>
        </div>

        <div style="padding: 6mm 20mm;">
          <!-- Info Box -->
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 4mm; border-radius: 3mm; margin-bottom: 6mm; display: flex; justify-content: space-between;">
            <div>
              <div style="font-size: 8pt; color: #6b7280; text-transform: uppercase; font-weight: 600;">Report ID</div>
              <div style="font-size: 10pt; font-weight: bold; color: #1f2937;">${reportId}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 8pt; color: #6b7280; text-transform: uppercase; font-weight: 600;">Date Generated</div>
              <div style="font-size: 10pt; font-weight: bold; color: #1f2937;">${reportDate}</div>
            </div>
          </div>

          <!-- Marketer Details -->
          <div style="margin-bottom: 8mm;">
            <h3 style="color: #059669; font-size: 11pt; font-weight: bold; margin-bottom: 4mm; border-bottom: 2px solid #059669; padding-bottom: 1mm;">MARKETER DETAILS</h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; margin-bottom: 4mm;">
              <div>
                <div style="font-size: 8pt; color: #6b7280; margin-bottom: 1mm;">Name</div>
                <div style="font-size: 11pt; font-weight: 600; color: #1f2937;">${marketer.name}</div>
              </div>
              <div>
                <div style="font-size: 8pt; color: #6b7280; margin-bottom: 1mm;">Email</div>
                <div style="font-size: 11pt; font-weight: 600; color: #1f2937;">${marketer.email}</div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 4mm;">
              <div>
                <div style="font-size: 8pt; color: #6b7280; margin-bottom: 1mm;">Promo Code</div>
                <div style="font-size: 14pt; font-weight: 700; color: #059669; font-family: monospace; background: #f0fdf4; padding: 3mm 5mm; border-radius: 5px; border: 1px dashed #059669; display: inline-block; letter-spacing: 1px;">${marketer.promoCode || 'N/A'}</div>
              </div>
              <div>
                <div style="font-size: 8pt; color: #6b7280; margin-bottom: 1mm;">Commission Rate</div>
                <div style="font-size: 14pt; font-weight: 700; color: #1f2937;">${marketer.commissionRate || 0}%</div>
              </div>
            </div>
          </div>

          <!-- Project Details -->
          <div style="margin-bottom: 8mm;">
            <h3 style="color: #059669; font-size: 11pt; font-weight: bold; margin-bottom: 3mm; border-bottom: 2px solid #059669; padding-bottom: 1mm;">PROJECT DETAILS</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 2mm 0; border-bottom: 1px solid #e5e7eb; width: 40%; font-size: 9pt; color: #4b5563;">Project ID</td>
                <td style="padding: 2mm 0; border-bottom: 1px solid #e5e7eb; font-size: 9pt; font-weight: 600; color: #1f2937;">${project.id}</td>
              </tr>
              <tr>
                <td style="padding: 2mm 0; border-bottom: 1px solid #e5e7eb; font-size: 9pt; color: #4b5563;">Buyer Name</td>
                <td style="padding: 2mm 0; border-bottom: 1px solid #e5e7eb; font-size: 9pt; font-weight: 600; color: #1f2937;">${project.buyerName || project.buyerEmail || "Unknown"}</td>
              </tr>
              <tr>
                <td style="padding: 2mm 0; border-bottom: 1px solid #e5e7eb; font-size: 9pt; color: #4b5563;">Project Status</td>
                <td style="padding: 2mm 0; border-bottom: 1px solid #e5e7eb; font-size: 9pt; font-weight: 600; color: #1f2937; text-transform: capitalize;">${project.status.replace(/_/g, ' ')}</td>
              </tr>
              <tr>
                <td style="padding: 2mm 0; border-bottom: 1px solid #e5e7eb; font-size: 9pt; color: #4b5563;">Total Project Price (Admin Defined)</td>
                <td style="padding: 2mm 0; border-bottom: 1px solid #e5e7eb; font-size: 9pt; font-weight: 600; color: #1f2937;">${project.adminPrice ? `LKR ${project.adminPrice.toLocaleString()}` : "Not Set"}</td>
              </tr>
            </table>
          </div>

          <!-- Payment Status -->
          <div style="margin-bottom: 8mm;">
            <h3 style="color: #059669; font-size: 11pt; font-weight: bold; margin-bottom: 3mm; border-bottom: 2px solid #059669; padding-bottom: 1mm;">PAYMENT STATUS</h3>
            
            <div style="display: flex; gap: 8mm;">
              <div style="flex: 1; background: #f9fafb; padding: 4mm; border-radius: 3mm; border: 1px solid #e5e7eb;">
                <div style="font-size: 8pt; color: #6b7280; margin-bottom: 1mm;">Deposit Payment</div>
                <div style="display: flex; align-items: center; gap: 2mm;">
                  <div style="width: 3mm; height: 3mm; border-radius: 50%; background-color: ${project.initialPaymentStatus === 'paid' ? '#10b981' : '#ef4444'};"></div>
                  <span style="font-weight: 700; font-size: 10pt; color: #1f2937;">${project.initialPaymentStatus === 'paid' ? 'PAID' : 'PENDING/FAILED'}</span>
                </div>
              </div>
              <div style="flex: 1; background: #f9fafb; padding: 4mm; border-radius: 3mm; border: 1px solid #e5e7eb;">
                <div style="font-size: 8pt; color: #6b7280; margin-bottom: 1mm;">Final Payment</div>
                <div style="display: flex; align-items: center; gap: 2mm;">
                  <div style="width: 3mm; height: 3mm; border-radius: 50%; background-color: ${project.finalPaymentStatus === 'paid' ? '#10b981' : '#ef4444'};"></div>
                  <span style="font-weight: 700; font-size: 10pt; color: #1f2937;">${project.finalPaymentStatus === 'paid' ? 'PAID' : 'PENDING/FAILED'}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Commission Calculation -->
          <div style="margin-bottom: 8mm;">
            <h3 style="color: #059669; font-size: 11pt; font-weight: bold; margin-bottom: 4mm;">COMMISSION CALCULATION</h3>
            
            <div style="background-color: #1f2937; color: white; padding: 6mm 8mm; border-radius: 4mm; display: flex; flex-direction: column; gap: 3mm; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 3mm;">
                <div style="font-size: 10pt; opacity: 0.9;">Commission Base (Project Price)</div>
                <div style="font-size: 11pt; font-weight: 600;">LKR ${project.adminPrice ? project.adminPrice.toLocaleString() : '0'}</div>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: 11pt; font-weight: 700; color: #34d399; letter-spacing: 0.5px;">TOTAL COMMISSION PAYABLE</div>
                  <div style="font-size: 8pt; opacity: 0.7; margin-top: 1mm;">Calculated at ${marketer.commissionRate}% rate</div>
                </div>
                <div style="font-size: 20pt; font-weight: 800; color: #34d399;">LKR ${commission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>
            
            <div style="margin-top: 3mm; text-align: right; font-size: 9pt; color: #6b7280;">
              Payout Status: <span style="font-weight: 700; color: ${project.finalPaymentStatus === 'paid' ? '#059669' : '#d97706'}; background: ${project.finalPaymentStatus === 'paid' ? '#ecfdf5' : '#fffbeb'}; padding: 2px 8px; border-radius: 4px;">${project.finalPaymentStatus === 'paid' ? 'ELIGIBLE FOR PAYOUT' : 'PENDING FINAL PAYMENT'}</span>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div style="position: absolute; bottom: 0; left: 0; width: 100%;">
          <div style="padding: 0 20mm 8mm 20mm;">
            <div style="border-top: 2px solid #e5e7eb; margin-bottom: 4mm;"></div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
              <div style="color: #6b7280; font-size: 8pt;">
                <div style="font-weight: 700; color: #1f2937; margin-bottom: 1mm; font-size: 9pt;">Bidhora Admin System</div>
                <div>Official Commission Report</div>
                <div>Generated by Administrator</div>
              </div>
              <div style="text-align: right; color: #9ca3af; font-size: 7pt;">
                <div>© ${new Date().getFullYear()} Bidhora. All rights reserved.</div>
                <div>www.bidhora.com</div>
              </div>
            </div>
          </div>
          <div style="height: 3mm; background: linear-gradient(90deg, #059669 0%, #10b981 100%); width: 100%;"></div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    try {
      // Wait for fonts/images
      await document.fonts.ready;

      const canvas = await html2canvas(container, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`commission_report_${project.id}.pdf`);
    } catch (error) {
      console.error("Error generating report PDF:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PDF report",
      });
    } finally {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }
  };


  const toggleRow = async (user: User) => {
    const isExpanded = expandedRows[user.id];
    
    setExpandedRows(prev => ({
      ...prev,
      [user.id]: !isExpanded
    }));

    if (!isExpanded && user.promoCode && !projectsCache[user.promoCode]) {
      // Fetch projects if expanding and not cached
      setLoadingProjects(prev => ({ ...prev, [user.id]: true }));
      try {
        const projects = await getProjectsByPromoCode(user.promoCode);
        setProjectsCache(prev => ({
          ...prev,
          [user.promoCode!]: projects
        }));
      } catch (error) {
        console.error("Error fetching projects for promo code:", user.promoCode, error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch projects for this marketer",
        });
      } finally {
        setLoadingProjects(prev => ({ ...prev, [user.id]: false }));
      }
    }
  };

  const calculateCommission = (projectPrice: number, rate: number) => {
    if (!projectPrice || !rate) return 0;
    return (projectPrice * rate) / 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Marketing Management</h2>
          <p className="text-muted-foreground">
            Manage marketers, promo codes, and commission rates.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Marketers List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border m-4">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="font-bold text-foreground">Marketer</TableHead>
                  <TableHead className="font-bold text-foreground">Promo Code</TableHead>
                  <TableHead className="font-bold text-foreground">Commission Rate</TableHead>
                  <TableHead className="text-right font-bold text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marketers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No marketers found. Set users as marketers from the Users page.
                    </TableCell>
                  </TableRow>
                ) : (
                  marketers.map((user) => (
                    <>
                      <TableRow key={user.id} className={`border-b transition-colors hover:bg-muted/50 ${expandedRows[user.id] ? "bg-muted/50" : ""}`}>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => toggleRow(user)}
                            disabled={!user.promoCode}
                          >
                            {expandedRows[user.id] ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">{user.name}</span>
                              <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono bg-background">
                            {user.promoCode || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {user.commissionRate ? `${user.commissionRate}%` : "0%"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Edit Details"
                              onClick={() => handleEditClick(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedRows[user.id] && (
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell colSpan={5} className="p-4">
                            <div className="rounded-md border bg-background p-4 shadow-sm">
                              <h4 className="mb-4 text-sm font-semibold leading-none tracking-tight flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-primary"></span>
                                Referred Projects
                              </h4>
                              {loadingProjects[user.id] ? (
                                <div className="flex justify-center py-4">
                                  <LoadingSpinner />
                                </div>
                              ) : !user.promoCode || !projectsCache[user.promoCode] || projectsCache[user.promoCode].length === 0 ? (
                                <div className="text-center py-8 text-sm text-muted-foreground border rounded-md border-dashed">
                                  No projects found for this promo code.
                                </div>
                              ) : (
                                <div className="rounded-md border">
                                  <Table>
                                    <TableHeader className="bg-secondary/40">
                                      <TableRow>
                                        <TableHead className="font-semibold text-foreground">Project ID</TableHead>
                                        <TableHead className="font-semibold text-foreground">Buyer Name</TableHead>
                                        <TableHead className="font-semibold text-foreground">Status</TableHead>
                                        <TableHead className="font-semibold text-foreground">Deposit</TableHead>
                                        <TableHead className="font-semibold text-foreground">Final Payment</TableHead>
                                        <TableHead className="text-right font-semibold text-foreground">Total Price</TableHead>
                                        <TableHead className="text-right font-semibold text-foreground">Commission</TableHead>
                                        <TableHead className="text-right font-semibold text-foreground">Report</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {projectsCache[user.promoCode].map((project) => {
                                        const commission = calculateCommission(project.adminPrice, user.commissionRate || 0);
                                        const isEarned = project.finalPaymentStatus === 'paid';
                                        
                                        return (
                                          <TableRow key={project.id} className="border-b hover:bg-muted/20">
                                            <TableCell className="font-mono text-xs">
                                              <TooltipProvider>
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <span className="cursor-help underline decoration-dotted decoration-muted-foreground/50">
                                                      {project.id.substring(0, 8)}...
                                                    </span>
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                    <p className="font-mono">{project.id}</p>
                                                  </TooltipContent>
                                                </Tooltip>
                                              </TooltipProvider>
                                            </TableCell>
                                            <TableCell className="font-medium">{project.buyerName || project.buyerEmail || "Unknown"}</TableCell>
                                            <TableCell>
                                              <Badge variant="secondary" className="text-xs font-normal">
                                                {project.status}
                                              </Badge>
                                            </TableCell>
                                            <TableCell>
                                              <Badge 
                                                variant={project.initialPaymentStatus === 'paid' ? 'default' : 'outline'}
                                                className={project.initialPaymentStatus === 'paid' ? 'bg-green-600 hover:bg-green-700' : ''}
                                              >
                                                {project.initialPaymentStatus || 'Pending'}
                                              </Badge>
                                            </TableCell>
                                            <TableCell>
                                              <Badge 
                                                variant={project.finalPaymentStatus === 'paid' ? 'default' : 'outline'}
                                                className={project.finalPaymentStatus === 'paid' ? 'bg-green-600 hover:bg-green-700' : ''}
                                              >
                                                {project.finalPaymentStatus || 'Pending'}
                                              </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                              {project.adminPrice ? `LKR ${project.adminPrice.toLocaleString()}` : '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              <div className="flex flex-col items-end">
                                                <span className={`font-bold ${isEarned ? 'text-green-600' : 'text-muted-foreground'}`}>
                                                  LKR {commission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                                                  {isEarned ? 'Earned' : 'Pending'}
                                                </span>
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Download Report"
                                                disabled={project.initialPaymentStatus !== 'paid'}
                                                onClick={() => generateProjectReport(project, user)}
                                              >
                                                <FileText className="h-4 w-4" />
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Marketer Details</DialogTitle>
            <DialogDescription>
              Update promo code and commission rate for {selectedMarketer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="promoCode">Promo Code</Label>
              <Input
                id="promoCode"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="e.g. MARKETER2024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commissionRate">Commission Rate (%)</Label>
              <Input
                id="commissionRate"
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                placeholder="e.g. 10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMarketer} disabled={actionLoading}>
              {actionLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

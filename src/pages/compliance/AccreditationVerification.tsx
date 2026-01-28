import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CheckCircle, AlertTriangle, XCircle, FileText, Download } from 'lucide-react';

/**
 * Accreditation Application data structure
 */
interface AccreditationApplication {
  id: string;
  investor_id: string;
  verification_status: 'pending' | 'approved' | 'rejected' | 'expired';
  verification_method: 'income' | 'net_worth' | 'professional';
  annual_income: number | null;
  net_worth: number | null;
  professional_certification: string | null;
  expiry_date?: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  documents: Array<{
    id: string;
    type: string;
    url: string;
  }>;
  submitted_at: string;
  investor: {
    id: string;
    full_name: string;
    email: string;
  };
}

/**
 * Status badge configuration
 */
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface StatusConfig {
  variant: BadgeVariant;
  icon: React.ComponentType<{ className?: string }> | null;
  text: string;
}

const STATUS_CONFIGS: Record<string, StatusConfig> = {
  pending: { variant: 'secondary', icon: null, text: 'Pending' },
  approved: { variant: 'default', icon: CheckCircle, text: 'Approved' },
  rejected: { variant: 'destructive', icon: XCircle, text: 'Rejected' },
  expired: { variant: 'outline', icon: AlertTriangle, text: 'Expired' }
};

const VERIFICATION_METHOD_LABELS: Record<string, string> = {
  income: 'Income Based',
  net_worth: 'Net Worth Based',
  professional: 'Professional Certification'
};

/**
 * Formats Indian currency (Rupees)
 */
const formatIndianCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Renders a status badge with appropriate styling and icon
 */
const StatusBadge = ({ status }: { status: string }) => {
  const config = STATUS_CONFIGS[status] || STATUS_CONFIGS.pending;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant}>
      {Icon && <Icon className="w-3 h-3 mr-1" />}
      {config.text}
    </Badge>
  );
};

/**
 * Accreditation Verification Component
 * 
 * Allows compliance officers to:
 * - View accreditation applications
 * - Review submitted documents
 * - Approve applications with expiry date
 * - Reject applications with detailed reasons
 * - Filter applications by status
 */
export default function AccreditationVerification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Dialog state
  const [selectedApplication, setSelectedApplication] = useState<AccreditationApplication | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  
  // Form state
  const [expiryDate, setExpiryDate] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch accreditation applications
  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: ['accreditation-applications'],
    queryFn: async () => await apiClient.get<AccreditationApplication[]>('/api/compliance/accreditation'),
    enabled: !!user
  });

  // Approve application mutation
  const approveApplication = useMutation({
    mutationFn: async ({ id, expiry_date }: { id: string; expiry_date: string }) => {
      return await apiClient.patch<{ certificate_sent?: boolean }>(`/api/compliance/accreditation/${id}/approve`, { expiry_date });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['accreditation-applications'] });
      setApproveDialogOpen(false);
      setExpiryDate('');
      toast.success('Application approved successfully');
      if (response.certificate_sent) {
        toast.success('Verification certificate sent to investor');
      }
    },
    onError: () => {
      toast.error('Failed to approve application');
    }
  });

  // Reject application mutation
  const rejectApplication = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return await apiClient.patch(`/api/compliance/accreditation/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accreditation-applications'] });
      setRejectDialogOpen(false);
      setRejectionReason('');
      toast.success('Application rejected');
    },
    onError: () => {
      toast.error('Failed to reject application');
    }
  });

  const handleApproveClick = (application: AccreditationApplication) => {
    setSelectedApplication(application);
    // Default expiry date: 1 year from now
    const defaultExpiry = new Date();
    defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
    setExpiryDate(defaultExpiry.toISOString().split('T')[0]);
    setApproveDialogOpen(true);
  };

  const handleRejectClick = (application: AccreditationApplication) => {
    setSelectedApplication(application);
    setRejectDialogOpen(true);
  };

  const handleViewDocuments = (application: AccreditationApplication) => {
    setSelectedApplication(application);
    setDocumentsDialogOpen(true);
  };

  const handleApproveSubmit = () => {
    if (selectedApplication && expiryDate) {
      approveApplication.mutate({ id: selectedApplication.id, expiry_date: expiryDate });
    }
  };

  const handleRejectSubmit = () => {
    if (selectedApplication && rejectionReason.trim()) {
      rejectApplication.mutate({ id: selectedApplication.id, reason: rejectionReason });
    }
  };

  // Filter applications by status
  const filteredApplications = applications.filter(application => {
    if (statusFilter === 'all') return true;
    return application.verification_status === statusFilter;
  });

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <XCircle className="w-12 h-12 mx-auto mb-4" />
              <p>Error loading accreditation applications</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Accreditation Verification</h1>
        <p className="text-muted-foreground">
          Verify investor accreditation requirements and issue certificates
        </p>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <Label htmlFor="status-filter">Filter by Status</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger id="status-filter" className="w-[200px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Loading accreditations...</p>
          </CardContent>
        </Card>
      ) : filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No accreditation applications found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredApplications.map((application) => (
            <Card key={application.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{application.investor.full_name}</CardTitle>
                    <CardDescription>{application.investor.email}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={application.verification_status} />
                    <Badge variant="outline">
                      {VERIFICATION_METHOD_LABELS[application.verification_method]}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Verification Details */}
                  <div className="grid grid-cols-2 gap-4">
                    {application.annual_income && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Annual Income</Label>
                        <p className="font-medium">{formatIndianCurrency(application.annual_income)}</p>
                      </div>
                    )}
                    {application.net_worth && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Net Worth</Label>
                        <p className="font-medium">{formatIndianCurrency(application.net_worth)}</p>
                      </div>
                    )}
                    {application.professional_certification && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Certification</Label>
                        <p className="font-medium">{application.professional_certification}</p>
                      </div>
                    )}
                    {application.expiry_date && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Expiry Date</Label>
                        <p className="font-medium">
                          {new Date(application.expiry_date).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleViewDocuments(application)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Documents
                    </Button>
                    {application.verification_status === 'pending' && (
                      <>
                        <Button
                          onClick={() => handleApproveClick(application)}
                          disabled={approveApplication.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleRejectClick(application)}
                          disabled={rejectApplication.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Documents Dialog */}
      <Dialog open={documentsDialogOpen} onOpenChange={setDocumentsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Application Documents</DialogTitle>
            <DialogDescription>
              Review submitted documents for {selectedApplication?.investor.full_name}
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              {selectedApplication.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{doc.type}</p>
                      <p className="text-sm text-muted-foreground">Document ID: {doc.id}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(doc.url, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Accreditation</DialogTitle>
            <DialogDescription>
              Set expiry date for {selectedApplication?.investor.full_name}'s accreditation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="expiry-date">Expiry Date</Label>
              <Input
                id="expiry-date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Typically set to 1 year from approval date
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApproveSubmit}
              disabled={!expiryDate || approveApplication.isPending}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide detailed reasons for rejection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this application is being rejected..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={!rejectionReason.trim() || rejectApplication.isPending}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

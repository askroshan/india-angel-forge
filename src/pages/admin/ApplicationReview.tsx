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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Users, Building2, ExternalLink } from 'lucide-react';

/**
 * Application data structure
 */
interface Application {
  id: string;
  user_id: string;
  application_type: 'investor' | 'founder';
  status: 'pending' | 'approved' | 'rejected';
  full_name: string;
  email: string;
  phone: string;
  // Investor fields
  investment_capacity?: number;
  investment_experience?: string;
  linkedin_url?: string;
  // Founder fields
  company_name?: string;
  company_stage?: string;
  funding_amount?: number;
  pitch_deck_url?: string;
  submitted_at: string;
  reviewed_at?: string;
  rejection_reason?: string;
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
  rejected: { variant: 'destructive', icon: XCircle, text: 'Rejected' }
};

const EXPERIENCE_LABELS: Record<string, string> = {
  angel_investor: 'Angel Investor',
  vc_fund: 'VC Fund',
  family_office: 'Family Office',
  first_time: 'First Time Investor'
};

const STAGE_LABELS: Record<string, string> = {
  pre_seed: 'Pre-Seed',
  seed: 'Seed',
  series_a: 'Series A',
  series_b: 'Series B+'
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
 * Application Review Component
 * 
 * Allows admins to:
 * - View pending investor and founder applications
 * - Review application details
 * - Approve applications (grants access + sends email)
 * - Reject applications with feedback
 * - Filter by application type
 */
export default function ApplicationReview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Dialog state
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  
  // Form state
  const [rejectionReason, setRejectionReason] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Fetch applications
  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: ['admin-applications'],
    queryFn: async () => await apiClient.get<Application[]>('/api/admin/applications'),
    enabled: !!user
  });

  // Approve application mutation
  const approveApplication = useMutation({
    mutationFn: async (applicationId: string) => {
      return await apiClient.patch(`/api/admin/applications/${applicationId}/approve`, {});
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
      toast.success('Application approved successfully');
      if (response.email_sent) {
        toast.success('Approval email sent to applicant');
      }
    },
    onError: () => {
      toast.error('Failed to approve application');
    }
  });

  // Reject application mutation
  const rejectApplication = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return await apiClient.patch(`/api/admin/applications/${id}/reject`, { reason });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
      setRejectDialogOpen(false);
      setRejectionReason('');
      toast.success('Application rejected');
      if (response.notification_sent) {
        toast.success('Applicant notified with feedback');
      }
    },
    onError: () => {
      toast.error('Failed to reject application');
    }
  });

  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
    setDetailsDialogOpen(true);
  };

  const handleApprove = (application: Application) => {
    approveApplication.mutate(application.id);
  };

  const handleRejectClick = (application: Application) => {
    setSelectedApplication(application);
    setRejectDialogOpen(true);
  };

  const handleRejectSubmit = () => {
    if (selectedApplication && rejectionReason.trim()) {
      rejectApplication.mutate({ id: selectedApplication.id, reason: rejectionReason });
    }
  };

  // Filter applications by type
  const filteredApplications = applications.filter(application => {
    if (typeFilter === 'all') return true;
    return application.application_type === typeFilter;
  });

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <XCircle className="w-12 h-12 mx-auto mb-4" />
              <p>Error loading applications</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Application Review</h1>
        <p className="text-muted-foreground">
          Review and approve member applications for platform access
        </p>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <Label htmlFor="type-filter">Filter by Type</Label>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger id="type-filter" className="w-[220px]">
            <SelectValue placeholder="All Applications" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Applications</SelectItem>
            <SelectItem value="investor">Investor Applications</SelectItem>
            <SelectItem value="founder">Founder Applications</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Loading applications...</p>
          </CardContent>
        </Card>
      ) : filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No applications found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredApplications.map((application) => (
            <Card key={application.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{application.full_name}</CardTitle>
                    <CardDescription>{application.email}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={application.status} />
                    <Badge variant="outline">
                      {application.application_type === 'investor' ? (
                        <>
                          <Users className="w-3 h-3 mr-1" />
                          Investor
                        </>
                      ) : (
                        <>
                          <Building2 className="w-3 h-3 mr-1" />
                          Founder
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Application-specific details */}
                  <div className="grid grid-cols-2 gap-4">
                    {application.investment_capacity && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Investment Capacity</Label>
                        <p className="font-medium">{formatIndianCurrency(application.investment_capacity)}</p>
                      </div>
                    )}
                    {application.investment_experience && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Experience</Label>
                        <p className="font-medium">{EXPERIENCE_LABELS[application.investment_experience] || application.investment_experience}</p>
                      </div>
                    )}
                    {application.company_name && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Company</Label>
                        <p className="font-medium">{application.company_name}</p>
                      </div>
                    )}
                    {application.company_stage && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Stage</Label>
                        <p className="font-medium">{STAGE_LABELS[application.company_stage] || application.company_stage}</p>
                      </div>
                    )}
                    {application.funding_amount && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Funding Target</Label>
                        <p className="font-medium">{formatIndianCurrency(application.funding_amount)}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleViewDetails(application)}
                    >
                      View Details
                    </Button>
                    {application.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => handleApprove(application)}
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

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Complete application information for {selectedApplication?.full_name}
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <p className="font-medium">{selectedApplication.full_name}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="font-medium">{selectedApplication.email}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="font-medium">{selectedApplication.phone}</p>
                </div>
                <div>
                  <Label>Application Type</Label>
                  <p className="font-medium capitalize">{selectedApplication.application_type}</p>
                </div>
              </div>

              {selectedApplication.application_type === 'investor' && (
                <>
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Investor Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedApplication.investment_capacity && (
                        <div>
                          <Label>Investment Capacity</Label>
                          <p className="font-medium">{formatIndianCurrency(selectedApplication.investment_capacity)}</p>
                        </div>
                      )}
                      {selectedApplication.investment_experience && (
                        <div>
                          <Label>Investment Experience</Label>
                          <p className="font-medium">{EXPERIENCE_LABELS[selectedApplication.investment_experience]}</p>
                        </div>
                      )}
                      {selectedApplication.linkedin_url && (
                        <div className="col-span-2">
                          <Label>LinkedIn Profile</Label>
                          <a 
                            href={selectedApplication.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:underline"
                          >
                            {selectedApplication.linkedin_url}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {selectedApplication.application_type === 'founder' && (
                <>
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Company Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedApplication.company_name && (
                        <div>
                          <Label>Company Name</Label>
                          <p className="font-medium">{selectedApplication.company_name}</p>
                        </div>
                      )}
                      {selectedApplication.company_stage && (
                        <div>
                          <Label>Company Stage</Label>
                          <p className="font-medium">{STAGE_LABELS[selectedApplication.company_stage]}</p>
                        </div>
                      )}
                      {selectedApplication.funding_amount && (
                        <div>
                          <Label>Funding Amount</Label>
                          <p className="font-medium">{formatIndianCurrency(selectedApplication.funding_amount)}</p>
                        </div>
                      )}
                      {selectedApplication.pitch_deck_url && (
                        <div className="col-span-2">
                          <Label>Pitch Deck</Label>
                          <a 
                            href={selectedApplication.pitch_deck_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:underline"
                          >
                            View Pitch Deck
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Submitted</Label>
                    <p className="font-medium">
                      {new Date(selectedApplication.submitted_at).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <p><StatusBadge status={selectedApplication.status} /></p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide feedback for {selectedApplication?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide detailed feedback for the applicant..."
                rows={4}
              />
              <p className="text-sm text-muted-foreground mt-1">
                This feedback will be sent to the applicant
              </p>
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

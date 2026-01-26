import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, IndianRupee, Users, CheckCircle2, AlertCircle, Clock, Edit, Trash2, Info } from 'lucide-react';
import { useState } from 'react';

// Types
interface SPV {
  id: string;
  spv_name: string;
  deal_id: string;
  lead_investor_id: string;
  target_raise_amount: number;
  total_committed: number;
  total_paid: number;
  carry_percentage: number;
  minimum_investment: number;
  status: string;
  deal: {
    company_name: string;
    sector: string;
    equity_percentage: number;
  };
}

interface SPVMember {
  id: string;
  spv_id: string;
  investor_id: string;
  commitment_amount: number;
  paid_amount: number;
  allocation_percentage: number;
  payment_status: 'PENDING' | 'PARTIAL' | 'PAID';
  joined_at: string;
  investor: {
    full_name: string;
    email: string;
  };
}

// Helper functions
const formatIndianCurrency = (amount: number): string => {
  const absAmount = Math.abs(amount);
  if (absAmount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)} Cr`;
  } else if (absAmount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)} Lac`;
  } else if (absAmount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount.toFixed(0)}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const TrackSPVAllocations = () => {
  const { spvId } = useParams<{ spvId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<SPVMember | null>(null);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [memberToAdjust, setMemberToAdjust] = useState<SPVMember | null>(null);
  const [newAllocation, setNewAllocation] = useState('');

  // Fetch SPV details
  const { data: spv, isLoading: isLoadingSPV, error: spvError } = useQuery<SPV>({
    queryKey: ['spv', spvId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/spvs/${spvId}`);
      return response.data;
    },
    enabled: !!spvId,
  });

  // Fetch SPV members
  const { data: members = [], isLoading: isLoadingMembers } = useQuery<SPVMember[]>({
    queryKey: ['spv-members', spvId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/spvs/${spvId}/members`);
      return response.data;
    },
    enabled: !!spvId,
  });

  // Mark payment as received mutation
  const markPaymentMutation = useMutation({
    mutationFn: async ({ memberId, paymentStatus }: { memberId: string; paymentStatus: string }) => {
      const response = await apiClient.put(`/api/spv-members/${memberId}/payment`, {
        payment_status: paymentStatus,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Payment marked as received');
      queryClient.invalidateQueries({ queryKey: ['spv', spvId] });
      queryClient.invalidateQueries({ queryKey: ['spv-members', spvId] });
    },
    onError: () => {
      toast.error('Failed to update payment status');
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await apiClient.delete(`/api/spv-members/${memberId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Member removed successfully');
      queryClient.invalidateQueries({ queryKey: ['spv', spvId] });
      queryClient.invalidateQueries({ queryKey: ['spv-members', spvId] });
      setRemoveDialogOpen(false);
      setMemberToRemove(null);
    },
    onError: () => {
      toast.error('Failed to remove member');
    },
  });

  // Adjust allocation mutation
  const adjustAllocationMutation = useMutation({
    mutationFn: async ({ memberId, newAmount }: { memberId: string; newAmount: number }) => {
      const response = await apiClient.put(`/api/spv-members/${memberId}/allocation`, {
        commitment_amount: newAmount,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Allocation adjusted successfully');
      queryClient.invalidateQueries({ queryKey: ['spv', spvId] });
      queryClient.invalidateQueries({ queryKey: ['spv-members', spvId] });
      setAdjustDialogOpen(false);
      setMemberToAdjust(null);
      setNewAllocation('');
    },
    onError: () => {
      toast.error('Failed to adjust allocation');
    },
  });

  const handleMarkPayment = (member: SPVMember) => {
    markPaymentMutation.mutate({
      memberId: member.id,
      paymentStatus: 'PAID',
    });
  };

  const handleRemoveMember = (member: SPVMember) => {
    setMemberToRemove(member);
    setRemoveDialogOpen(true);
  };

  const confirmRemoveMember = () => {
    if (memberToRemove) {
      removeMemberMutation.mutate(memberToRemove.id);
    }
  };

  const handleAdjustAllocation = (member: SPVMember) => {
    setMemberToAdjust(member);
    setNewAllocation(member.commitment_amount.toString());
    setAdjustDialogOpen(true);
  };

  const confirmAdjustAllocation = () => {
    if (memberToAdjust && newAllocation) {
      const amount = parseFloat(newAllocation);
      if (!isNaN(amount) && amount > 0) {
        adjustAllocationMutation.mutate({
          memberId: memberToAdjust.id,
          newAmount: amount,
        });
      } else {
        toast.error('Please enter a valid amount');
      }
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            PAID
          </Badge>
        );
      case 'PARTIAL':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            PARTIAL
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="outline">
            <AlertCircle className="h-3 w-3 mr-1" />
            PENDING
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoadingSPV || isLoadingMembers) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading SPV details...</div>
      </div>
    );
  }

  if (spvError || !spv) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading SPV details. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const commitmentPercentage = (spv.total_committed / spv.target_raise_amount) * 100;
  const paymentPercentage = (spv.total_paid / spv.total_committed) * 100;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/investor/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold mb-2">Track SPV Allocations</h1>
        <p className="text-muted-foreground">
          Monitor member commitments and payment status
        </p>
      </div>

      {/* SPV Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>{spv.spv_name}</CardTitle>
            <CardDescription>
              {spv.deal.company_name} • {spv.deal.sector}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Commitment Progress
                  </span>
                  <span className="text-sm font-semibold">{commitmentPercentage.toFixed(0)}%</span>
                </div>
                <Progress value={commitmentPercentage} className="h-2" />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm">
                    {formatIndianCurrency(spv.total_committed)} committed
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Target: {formatIndianCurrency(spv.target_raise_amount)}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Payment Progress
                  </span>
                  <span className="text-sm font-semibold">{paymentPercentage.toFixed(0)}%</span>
                </div>
                <Progress value={paymentPercentage} className="h-2" />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm">
                    {formatIndianCurrency(spv.total_paid)} received
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Committed: {formatIndianCurrency(spv.total_committed)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SPV Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Carry</span>
              <span className="font-semibold">{spv.carry_percentage}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Equity Stake</span>
              <span className="font-semibold">{spv.deal.equity_percentage}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Min Investment</span>
              <span className="font-semibold">{formatIndianCurrency(spv.minimum_investment)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Members</span>
              <span className="font-semibold">{members.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex gap-2">
        <Button onClick={() => handleAdjustAllocation(members[0])} disabled={members.length === 0}>
          <Edit className="h-4 w-4 mr-2" />
          Adjust Allocations
        </Button>
      </div>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            SPV Members
          </CardTitle>
          <CardDescription>
            Track commitment amounts, payments, and ownership percentages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No members have joined this SPV yet
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <Card key={member.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{member.investor.full_name}</h3>
                          {getPaymentStatusBadge(member.payment_status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {member.investor.email}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">
                              Commitment
                            </div>
                            <div className="font-semibold">
                              {formatIndianCurrency(member.commitment_amount)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">
                              Paid Amount
                            </div>
                            <div className="font-semibold">
                              {formatIndianCurrency(member.paid_amount)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">
                              Ownership
                            </div>
                            <div className="font-semibold">
                              {member.allocation_percentage.toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">
                              Joined
                            </div>
                            <div className="text-sm">
                              {formatDate(member.joined_at)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        {member.payment_status !== 'PAID' && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkPayment(member)}
                            disabled={markPaymentMutation.isPending}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Mark as Paid
                          </Button>
                        )}
                        {spv.status === 'OPEN' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveMember(member)}
                            disabled={removeMemberMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Sidebar */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Management Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Payment Tracking</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Monitor which members have paid their commitments</li>
              <li>• Mark payments as received when confirmed</li>
              <li>• Track overall payment collection progress</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Allocation Management</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Adjust member commitments before SPV closes</li>
              <li>• Remove members who can't fulfill commitments</li>
              <li>• Pro-rata ownership automatically recalculated</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Pro-rata Ownership</h3>
            <p className="text-sm text-muted-foreground">
              Each member's ownership percentage is calculated based on their
              commitment relative to the total committed amount. This determines
              their share of the SPV's equity stake in the company.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Remove Member Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {memberToRemove?.investor.full_name} from this SPV?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemoveMember}
              disabled={removeMemberMutation.isPending}
            >
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Allocation Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Allocation</DialogTitle>
            <DialogDescription>
              Adjust the commitment amount for {memberToAdjust?.investor.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-allocation">New Commitment Amount (₹)</Label>
              <Input
                id="new-allocation"
                type="number"
                placeholder="Enter amount"
                value={newAllocation}
                onChange={(e) => setNewAllocation(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Current: {memberToAdjust && formatIndianCurrency(memberToAdjust.commitment_amount)}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmAdjustAllocation}
              disabled={adjustAllocationMutation.isPending}
            >
              Update Allocation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrackSPVAllocations;

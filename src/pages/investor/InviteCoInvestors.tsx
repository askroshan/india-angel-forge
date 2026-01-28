import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Mail, Calendar, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';

/**
 * SPV data structure
 */
interface SPV {
  id: string;
  spv_name: string;
  deal_id: string;
  lead_investor_id: string;
  target_raise_amount: number;
  carry_percentage: number;
  minimum_investment: number;
  status: string;
  current_commitments: number;
  deal: {
    company_name: string;
    sector: string;
  };
}

/**
 * SPV member data structure
 */
interface SPVMember {
  id: string;
  spv_id: string;
  investor_id: string;
  commitment_amount: number;
  status: 'COMMITTED' | 'PENDING' | 'DECLINED';
  joined_at?: string;
  invited_at?: string;
  investor: {
    full_name: string;
    email: string;
  };
}

/**
 * Invitation response
 */
interface Invitation {
  id: string;
  spv_id: string;
  investor_email: string;
  status: string;
}

/**
 * Format a number as Indian currency (INR)
 */
function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * InviteCoInvestors component - allows SPV lead to invite co-investors
 */
export default function InviteCoInvestors() {
  const { spvId } = useParams<{ spvId: string }>();
  const queryClient = useQueryClient();
  
  const [investorEmail, setInvestorEmail] = useState('');
  const [commitmentDeadline, setCommitmentDeadline] = useState('');
  const [formError, setFormError] = useState('');

  // Fetch SPV details
  const { data: spv, isLoading: loadingSPV, error: spvError } = useQuery<SPV>({
    queryKey: ['spv', spvId],
    queryFn: async () => {
      const data = await apiClient.get<SPV>(`/api/spvs/${spvId}`);
      return data;
    },
    enabled: !!spvId,
  });

  // Fetch SPV members
  const { data: members = [], isLoading: loadingMembers } = useQuery<SPVMember[]>({
    queryKey: ['spv-members', spvId],
    queryFn: async () => {
      const data = await apiClient.get<SPVMember[]>(`/api/spvs/${spvId}/members`);
      return data ?? [];
    },
    enabled: !!spvId,
  });

  // Send invitation mutation
  const sendInvitationMutation = useMutation({
    mutationFn: async (inviteData: {
      spv_id: string;
      investor_email: string;
      commitment_deadline: string;
    }) => {
      const result = await apiClient.post<Invitation>('/api/spv-invitations', inviteData);
      if (result.error) throw new Error(result.error.message);
      return result.data as Invitation;
    },
    onSuccess: () => {
      toast.success('Invitation sent successfully');
      toast.success('Investor will receive email with SPV details');
      queryClient.invalidateQueries({ queryKey: ['spv-members', spvId] });
      
      // Reset form
      setInvestorEmail('');
      setCommitmentDeadline('');
      setFormError('');
    },
    onError: () => {
      toast.error('Failed to send invitation');
    },
  });

  // Adjust allocations mutation
  const adjustAllocationsMutation = useMutation({
    mutationFn: async (allocData: { spv_id: string; allocations: Record<string, number> }) => {
      const result = await apiClient.put<{ success: boolean }>(`/api/spvs/${allocData.spv_id}/allocations`, {
        allocations: allocData.allocations,
      });
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Allocations adjusted successfully');
      queryClient.invalidateQueries({ queryKey: ['spv-members', spvId] });
    },
    onError: () => {
      toast.error('Failed to adjust allocations');
    },
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!investorEmail.trim()) {
      setFormError('Email is required');
      return;
    }

    if (!validateEmail(investorEmail)) {
      setFormError('Please enter a valid email address');
      return;
    }

    if (!commitmentDeadline) {
      setFormError('Commitment deadline is required');
      return;
    }

    if (!spvId) return;

    sendInvitationMutation.mutate({
      spv_id: spvId,
      investor_email: investorEmail,
      commitment_deadline: commitmentDeadline,
    });
  };

  const handleAdjustAllocations = () => {
    if (!spvId) return;
    // In a real implementation, this would open a dialog to adjust allocations
    // For now, we'll just show the button
    adjustAllocationsMutation.mutate({
      spv_id: spvId,
      allocations: {}, // Would be populated from a form
    });
  };

  const isOversubscribed = spv && spv.current_commitments > spv.target_raise_amount;
  const commitmentProgress = spv 
    ? (spv.current_commitments / spv.target_raise_amount) * 100 
    : 0;

  if (spvError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Error loading SPV details</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loadingSPV) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading SPV details...</p>
      </div>
    );
  }

  if (!spv) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>SPV not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Invite Co-Investors to SPV</h1>
        <p className="text-muted-foreground">
          Build your investment syndicate for {spv.deal.company_name}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* SPV Overview */}
          <Card>
            <CardHeader>
              <CardTitle>{spv.spv_name}</CardTitle>
              <CardDescription>
                {spv.deal.company_name} • {spv.deal.sector}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Commitment Progress</span>
                  <span className="font-medium">
                    {formatIndianCurrency(spv.current_commitments)} / {formatIndianCurrency(spv.target_raise_amount)}
                  </span>
                </div>
                <Progress value={Math.min(commitmentProgress, 100)} />
                <p className="text-xs text-muted-foreground">
                  {commitmentProgress.toFixed(0)}% of target raised
                </p>
              </div>

              {isOversubscribed && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>
                        <strong>Oversubscribed!</strong> SPV has exceeded target raise amount.
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAdjustAllocations}
                        disabled={adjustAllocationsMutation.isPending}
                      >
                        Adjust Allocations
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Minimum Investment</p>
                  <p className="text-lg font-semibold">
                    {formatIndianCurrency(spv.minimum_investment)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Carry</p>
                  <p className="text-lg font-semibold">{spv.carry_percentage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invitation Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send Invitation</CardTitle>
              <CardDescription>
                Invite investors to join this SPV
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="investor-email">
                    Investor Email
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="investor-email"
                    type="email"
                    placeholder="investor@example.com"
                    value={investorEmail}
                    onChange={(e) => {
                      setInvestorEmail(e.target.value);
                      setFormError('');
                    }}
                    aria-label="Investor Email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commitment-deadline">
                    Commitment Deadline
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="commitment-deadline"
                    type="date"
                    value={commitmentDeadline}
                    onChange={(e) => {
                      setCommitmentDeadline(e.target.value);
                      setFormError('');
                    }}
                    aria-label="Commitment Deadline"
                  />
                  <p className="text-xs text-muted-foreground">
                    Deadline for investor to accept and commit funds
                  </p>
                </div>

                {formError && (
                  <Alert variant="destructive">
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={sendInvitationMutation.isPending}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {sendInvitationMutation.isPending ? 'Sending...' : 'Send Invitation'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Members List */}
          <Card>
            <CardHeader>
              <CardTitle>SPV Members</CardTitle>
              <CardDescription>
                Current members and pending invitations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMembers ? (
                <p className="text-sm text-muted-foreground">Loading members...</p>
              ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No members yet. Send your first invitation!
                </p>
              ) : (
                <div className="space-y-3">
                  {members.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">{member.investor.full_name}</p>
                          <p className="text-sm text-muted-foreground">{member.investor.email}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm font-medium">
                              {formatIndianCurrency(member.commitment_amount)}
                            </span>
                            <Badge
                              variant={
                                member.status === 'COMMITTED'
                                  ? 'default'
                                  : member.status === 'PENDING'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {member.status === 'COMMITTED' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {member.status === 'PENDING' && <Clock className="h-3 w-3 mr-1" />}
                              {member.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {member.joined_at && formatDate(member.joined_at)}
                        {member.invited_at && !member.joined_at && `Invited ${formatDate(member.invited_at)}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How it Works</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground">1.</span>
                  <span>Enter investor's email address</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground">2.</span>
                  <span>Set commitment deadline</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground">3.</span>
                  <span>Investor receives invitation email</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground">4.</span>
                  <span>They review SPV details and terms</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground">5.</span>
                  <span>They accept and commit their amount</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground">6.</span>
                  <span>You track all commitments here</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invitation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Email Invitation</p>
                  <p className="text-xs text-muted-foreground">
                    Includes SPV details, deal information, and commitment terms
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Commitment Deadline</p>
                  <p className="text-xs text-muted-foreground">
                    Investors must accept and commit by this date
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Allocation Management</p>
                  <p className="text-xs text-muted-foreground">
                    Adjust allocations if SPV becomes oversubscribed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

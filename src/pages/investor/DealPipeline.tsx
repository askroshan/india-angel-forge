/**
 * US-INVESTOR-005: Track Deal Pipeline
 * 
 * Dashboard for investors to track all deals they've expressed interest in,
 * with status updates, SPV details, and next steps.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface DealInterest {
  id: string;
  dealId: string;
  investorId: string;
  status: 'pending' | 'accepted' | 'rejected';
  commitmentAmount: number;
  notes?: string;
  rejectionReason?: string;
  spvId?: string;
  createdAt: string;
  updatedAt?: string;
  deal: {
    id: string;
    title: string;
    companyName: string;
    slug: string;
    description?: string;
    industrySector?: string;
    dealSize: number;
    minInvestment: number;
    dealStatus: 'open' | 'closing_soon' | 'closed';
    closingDate?: string;
  };
}

interface SPV {
  id: string;
  name: string;
  targetAmount: number;
  committedAmount: number;
}

const DealPipeline = () => {
  const [interests, setInterests] = useState<DealInterest[]>([]);
  const [filteredInterests, setFilteredInterests] = useState<DealInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [spvDetails, setSPVDetails] = useState<Record<string, SPV>>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token } = useAuth();

  useEffect(() => {
    checkAccessAndLoadPipeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterInterests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interests, statusFilter]);

  const checkAccessAndLoadPipeline = async () => {
    if (!token) {
      navigate('/auth');
      return;
    }

    await fetchPipeline();
  };

  const fetchPipeline = async () => {
    try {
      setLoading(true);
      if (!token) return;

      // Note: This endpoint needs to be created
      const response = await fetch('/api/deals/interests', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch interests');
      }

      const data = await response.json();
      setInterests(data || []);

      // Fetch SPV details for accepted interests
      const acceptedWithSPV = data?.filter((i: DealInterest) => i.status === 'accepted' && i.spvId) || [];
      if (acceptedWithSPV.length > 0) {
        await fetchSPVDetails(acceptedWithSPV.map((i: DealInterest) => i.spvId!));
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load deal pipeline',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSPVDetails = async (spvIds: string[]) => {
    try {
      if (!token) return;

      // Fetch each SPV individually - could be optimized with bulk endpoint
      const promises = spvIds.map(id => 
        fetch(`/api/spv/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.ok ? r.json() : null)
      );

      const results = await Promise.all(promises);
      const spvMap: Record<string, SPV> = {};
      results.forEach(spv => {
        if (spv) {
          spvMap[spv.id] = spv;
        }
      });
      setSPVDetails(spvMap);
    } catch (err) {
      console.error('Failed to fetch SPV details:', err);
    }
  };

  const filterInterests = () => {
    let filtered = [...interests];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(i => i.status === statusFilter);
    }

    setFilteredInterests(filtered);
  };

  const formatAmount = (amount: number) => {
    const crores = amount / 10000000;
    if (crores >= 1) {
      return `₹${crores.toFixed(2)} Cr`;
    }
    const lakhs = amount / 100000;
    return `₹${lakhs.toFixed(2)} L`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Accepted
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const getDealStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="default">Open</Badge>;
      case 'closing_soon':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Closing Soon</Badge>;
      case 'closed':
        return <Badge variant="outline">Closed</Badge>;
      default:
        return null;
    }
  };

  const getDaysUntilClosing = (closingDate?: string) => {
    if (!closingDate) return null;
    const days = Math.ceil((new Date(closingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const stats = {
    total: interests.length,
    pending: interests.filter(i => i.status === 'pending').length,
    accepted: interests.filter(i => i.status === 'accepted').length,
    rejected: interests.filter(i => i.status === 'rejected').length,
    totalCommitment: interests
      .filter(i => i.status === 'accepted')
      .reduce((sum, i) => sum + Number(i.commitmentAmount), 0),
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p>Loading pipeline...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Deal Pipeline</h1>
        <p className="text-muted-foreground">
          Track your investment interests and commitments
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Commitment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatAmount(stats.totalCommitment)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Filter by Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]" aria-label="Status Filter">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline List */}
      {filteredInterests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Deals in Pipeline</h3>
            <p className="text-muted-foreground mb-4">
              {statusFilter !== 'all' 
                ? `No ${statusFilter} deals found`
                : "You haven't expressed interest in any deals yet"}
            </p>
            <Button onClick={() => navigate('/deals')}>
              Browse Deals
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInterests.map((interest) => {
            const deal = interest.deal;
            const daysLeft = getDaysUntilClosing(deal.closingDate);
            const spv = interest.spvId ? spvDetails[interest.spvId] : null;

            return (
              <Card key={interest.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{deal.title}</CardTitle>
                        {getStatusBadge(interest.status)}
                        {getDealStatusBadge(deal.dealStatus)}
                      </div>
                      <CardDescription className="text-base">
                        {deal.companyName}
                        {deal.industrySector && ` • ${deal.industrySector}`}
                      </CardDescription>
                    </div>
                    {daysLeft !== null && daysLeft > 0 && deal.dealStatus !== 'closed' && (
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Closes in</div>
                        <div className="text-xl font-bold text-primary">{daysLeft}d</div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <DollarSign className="h-4 w-4" />
                        My Commitment
                      </div>
                      <div className="font-semibold">{formatAmount(Number(interest.commitmentAmount))}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <TrendingUp className="h-4 w-4" />
                        Deal Size
                      </div>
                      <div className="font-semibold">{formatAmount(Number(deal.dealSize))}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        Expressed On
                      </div>
                      <div className="font-semibold">
                        {new Date(interest.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {deal.closingDate && (
                      <div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                          <Calendar className="h-4 w-4" />
                          Closing Date
                        </div>
                        <div className="font-semibold">
                          {new Date(deal.closingDate).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SPV Details for Accepted */}
                  {interest.status === 'accepted' && spv && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        SPV Allocation Confirmed
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-green-700">SPV Name:</span>{' '}
                          <span className="font-medium">{spv.name}</span>
                        </div>
                        <div>
                          <span className="text-green-700">Target:</span>{' '}
                          <span className="font-medium">{formatAmount(Number(spv.targetAmount))}</span>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                        <h5 className="text-sm font-semibold text-blue-900 mb-1">Next Steps:</h5>
                        <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                          <li>Review and sign SPV documents</li>
                          <li>Complete investment commitment form</li>
                          <li>Transfer funds before closing date</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {interest.status === 'rejected' && interest.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-red-900 mb-1 flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Interest Not Accepted
                      </h4>
                      <p className="text-sm text-red-800">{interest.rejectionReason}</p>
                    </div>
                  )}

                  {/* Notes */}
                  {interest.notes && (
                    <div className="text-sm text-muted-foreground mb-4">
                      <span className="font-medium">Your Notes:</span> {interest.notes}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={() => navigate(`/deals/${deal.slug}`)}>
                      View Deal Details
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    {interest.status === 'accepted' && deal.dealStatus !== 'closed' && (
                      <Button variant="outline" onClick={() => navigate(`/investor/commitments/${interest.id}`)}>
                        Complete Commitment
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DealPipeline;

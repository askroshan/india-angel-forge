/**
 * US-INVESTOR-005: Track Deal Pipeline
 * 
 * Dashboard for investors to track all deals they've expressed interest in,
 * with status updates, SPV details, and next steps.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
  deal_id: string;
  investor_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  commitment_amount: number;
  notes?: string;
  rejection_reason?: string;
  spv_id?: string;
  created_at: string;
  updated_at?: string;
  deal: {
    id: string;
    title: string;
    company_name: string;
    slug: string;
    description?: string;
    industry_sector?: string;
    deal_size: number;
    min_investment: number;
    deal_status: 'open' | 'closing_soon' | 'closed';
    closing_date?: string;
  };
}

interface SPV {
  id: string;
  name: string;
  target_amount: number;
  committed_amount: number;
}

const DealPipeline = () => {
  const [interests, setInterests] = useState<DealInterest[]>([]);
  const [filteredInterests, setFilteredInterests] = useState<DealInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [spvDetails, setSPVDetails] = useState<Record<string, SPV>>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAccessAndLoadPipeline();
  }, []);

  useEffect(() => {
    filterInterests();
  }, [interests, statusFilter]);

  const checkAccessAndLoadPipeline = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    await fetchPipeline();
  };

  const fetchPipeline = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('deal_interests')
        .select(`
          *,
          deal:deal_id(
            id,
            title,
            company_name,
            slug,
            description,
            industry_sector,
            deal_size,
            min_investment,
            deal_status,
            closing_date
          )
        `)
        .eq('investor_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInterests(data || []);

      // Fetch SPV details for accepted interests
      const acceptedWithSPV = data?.filter(i => i.status === 'accepted' && i.spv_id) || [];
      if (acceptedWithSPV.length > 0) {
        await fetchSPVDetails(acceptedWithSPV.map(i => i.spv_id!));
      }
    } catch (err: any) {
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
      const { data, error } = await supabase
        .from('spvs')
        .select('*')
        .in('id', spvIds);

      if (error) throw error;

      if (data) {
        const spvMap: Record<string, SPV> = {};
        data.forEach(spv => {
          spvMap[spv.id] = spv;
        });
        setSPVDetails(spvMap);
      }
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
      .reduce((sum, i) => sum + i.commitment_amount, 0),
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
            const daysLeft = getDaysUntilClosing(deal.closing_date);
            const spv = interest.spv_id ? spvDetails[interest.spv_id] : null;

            return (
              <Card key={interest.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{deal.title}</CardTitle>
                        {getStatusBadge(interest.status)}
                        {getDealStatusBadge(deal.deal_status)}
                      </div>
                      <CardDescription className="text-base">
                        {deal.company_name}
                        {deal.industry_sector && ` • ${deal.industry_sector}`}
                      </CardDescription>
                    </div>
                    {daysLeft !== null && daysLeft > 0 && deal.deal_status !== 'closed' && (
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
                      <div className="font-semibold">{formatAmount(interest.commitment_amount)}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <TrendingUp className="h-4 w-4" />
                        Deal Size
                      </div>
                      <div className="font-semibold">{formatAmount(deal.deal_size)}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        Expressed On
                      </div>
                      <div className="font-semibold">
                        {new Date(interest.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {deal.closing_date && (
                      <div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                          <Calendar className="h-4 w-4" />
                          Closing Date
                        </div>
                        <div className="font-semibold">
                          {new Date(deal.closing_date).toLocaleDateString()}
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
                          <span className="font-medium">{formatAmount(spv.target_amount)}</span>
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
                  {interest.status === 'rejected' && interest.rejection_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-red-900 mb-1 flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Interest Not Accepted
                      </h4>
                      <p className="text-sm text-red-800">{interest.rejection_reason}</p>
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
                    {interest.status === 'accepted' && deal.deal_status !== 'closed' && (
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

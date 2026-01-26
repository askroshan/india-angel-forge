/**
 * US-INVESTOR-003: Browse Available Deals
 * 
 * As an: Investor
 * I want to: Browse and filter investment deals
 * So that: I can discover opportunities matching my criteria
 * 
 * Priority: High
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, Calendar, DollarSign, Users, Search, Filter } from 'lucide-react';

interface Deal {
  id: string;
  title: string;
  company_name: string;
  slug: string;
  description: string;
  industry_sector: string;
  stage: string;
  deal_size: number;
  min_investment: number;
  valuation?: number;
  deal_lead?: string;
  deal_status: string;
  closing_date?: string;
  featured: boolean;
  created_at: string;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSector, setFilterSector] = useState<string>('all');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('open');
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const SECTORS = ['SaaS', 'AI & Deep Tech', 'Fintech', 'Healthcare', 'Consumer', 'Climate Tech', 'D2C', 'B2B'];
  const STAGES = ['Pre-seed', 'Seed', 'Series A', 'Series B+'];

  useEffect(() => {
    checkAccessAndLoadDeals();
  }, []);

  useEffect(() => {
    filterDeals();
  }, [deals, searchQuery, filterSector, filterStage, filterStatus]);

  const checkAccessAndLoadDeals = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    // Check if user is approved investor
    const { data: application } = await supabase
      .from('investor_applications')
      .select('status')
      .eq('user_id', session.user.id)
      .single();

    if (!application || application.status !== 'approved') {
      toast({
        title: 'Access Restricted',
        description: 'Please complete your investor application first',
        variant: 'destructive',
      });
      navigate('/apply/investor');
      return;
    }

    await fetchDeals();
  };

  const fetchDeals = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .in('deal_status', ['open', 'closing_soon', 'closed'])
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDeals(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load deals',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterDeals = () => {
    let filtered = [...deals];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(d => d.deal_status === filterStatus);
    }

    if (filterSector !== 'all') {
      filtered = filtered.filter(d => d.industry_sector === filterSector);
    }

    if (filterStage !== 'all') {
      filtered = filtered.filter(d => d.stage === filterStage);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d => 
        d.company_name.toLowerCase().includes(query) ||
        d.title.toLowerCase().includes(query) ||
        d.description.toLowerCase().includes(query)
      );
    }

    setFilteredDeals(filtered);
  };

  const formatAmount = (amount: number) => {
    const crores = amount / 10000000;
    if (crores >= 1) {
      return `₹${crores.toFixed(2)} Cr`;
    }
    const lakhs = amount / 100000;
    return `₹${lakhs.toFixed(2)} L`;
  };

  const getDaysUntilClosing = (closingDate?: string) => {
    if (!closingDate) return null;
    const days = Math.ceil((new Date(closingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Investment Deals</h1>
        <p className="text-muted-foreground">
          Browse and discover vetted investment opportunities
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">Search Deals</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Company or deal name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="sector">Sector</Label>
              <Select value={filterSector} onValueChange={setFilterSector}>
                <SelectTrigger id="sector">
                  <SelectValue placeholder="All Sectors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  {SECTORS.map(sector => (
                    <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="stage">Stage</Label>
              <Select value={filterStage} onValueChange={setFilterStage}>
                <SelectTrigger id="stage">
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {STAGES.map(stage => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closing_soon">Closing Soon</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Open Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deals.filter(d => d.deal_status === 'open').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Closing Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deals.filter(d => d.deal_status === 'closing_soon').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Deal Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(deals.reduce((sum, d) => sum + d.deal_size, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deals List */}
      {loading ? (
        <div className="text-center py-8">Loading deals...</div>
      ) : filteredDeals.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No deals found matching your filters
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDeals.map((deal) => {
            const daysLeft = getDaysUntilClosing(deal.closing_date);
            
            return (
              <Card key={deal.id} className={deal.featured ? 'border-primary' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {deal.featured && (
                          <Badge className="bg-amber-500">Featured</Badge>
                        )}
                        <Badge variant={
                          deal.deal_status === 'open' ? 'default' :
                          deal.deal_status === 'closing_soon' ? 'secondary' : 'outline'
                        }>
                          {deal.deal_status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline">{deal.stage}</Badge>
                      </div>
                      <CardTitle className="text-xl">{deal.title}</CardTitle>
                      <CardDescription className="text-base">
                        {deal.company_name} • {deal.industry_sector}
                      </CardDescription>
                    </div>
                    {daysLeft !== null && daysLeft > 0 && deal.deal_status !== 'closed' && (
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Closing in</div>
                        <div className="text-2xl font-bold text-primary">{daysLeft}d</div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {deal.description}
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <DollarSign className="h-4 w-4" />
                        Deal Size
                      </div>
                      <div className="font-semibold">{formatAmount(deal.deal_size)}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <TrendingUp className="h-4 w-4" />
                        Min Investment
                      </div>
                      <div className="font-semibold">{formatAmount(deal.min_investment)}</div>
                    </div>
                    {deal.valuation && (
                      <div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                          <TrendingUp className="h-4 w-4" />
                          Valuation
                        </div>
                        <div className="font-semibold">{formatAmount(deal.valuation)}</div>
                      </div>
                    )}
                    {deal.deal_lead && (
                      <div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                          <Users className="h-4 w-4" />
                          Lead
                        </div>
                        <div className="font-semibold">{deal.deal_lead}</div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => navigate(`/deals/${deal.slug}`)}>
                      View Details
                    </Button>
                    {deal.deal_status === 'open' && (
                      <Button variant="outline">
                        Express Interest
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
}

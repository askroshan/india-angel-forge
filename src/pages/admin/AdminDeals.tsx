/**
 * US-ADMIN-017: Admin Deal Oversight View
 *
 * As an Admin, I want read-only access to browse all active deals so that
 * I can oversee investment activity without needing an investor application.
 *
 * Route: /admin/deals
 * Access: admin only (read-only — no commit actions)
 *
 * data-testid attributes:
 *   admin-deals-page, admin-deals-loading, admin-deals-error, admin-deals-empty,
 *   admin-deal-row, deal-interest-count, deal-commitment-count, deal-total-committed,
 *   deal-status-badge, deal-stage-badge
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, TrendingUp, Users, DollarSign, Briefcase } from 'lucide-react';

interface AdminDeal {
  id: string;
  title: string;
  companyName: string;
  description: string;
  industrySector: string;
  stage: string;
  dealSize: number;
  dealStatus: string;
  createdAt: string;
  interestCount: number;
  commitmentCount: number;
  totalCommitted: number;
}

const STAGE_OPTIONS = ['Seed', 'Pre-Seed', 'Series A', 'Series B', 'Series C', 'Growth', 'Bridge'];
const STATUS_OPTIONS = ['open', 'closed', 'draft', 'cancelled'];

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'open': return 'default';
    case 'closed': return 'secondary';
    case 'cancelled': return 'destructive';
    default: return 'outline';
  }
}

export default function AdminDeals() {
  const { token } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');

  const { data: deals = [], isLoading, isError } = useQuery<AdminDeal[]>({
    queryKey: ['admin-deals'],
    queryFn: async () => {
      const res = await fetch('/api/admin/deals', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch deals');
      return res.json();
    },
    enabled: !!token,
  });

  const filtered = deals.filter(d => {
    if (statusFilter !== 'all' && d.dealStatus !== statusFilter) return false;
    if (stageFilter !== 'all' && d.stage !== stageFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.title.toLowerCase().includes(q) || d.industrySector.toLowerCase().includes(q);
    }
    return true;
  });

  const totalDeals = deals.length;
  const openDeals = deals.filter(d => d.dealStatus === 'open').length;
  const totalInterests = deals.reduce((s, d) => s + d.interestCount, 0);
  const totalCommitted = deals.reduce((s, d) => s + d.totalCommitted, 0);

  return (
    <div className="min-h-screen bg-background" data-testid="admin-deals-page">
      <Navigation />
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Deal Oversight</h1>
          <p className="text-muted-foreground">
            Read-only view of all active deals and investor engagement — US-ADMIN-017
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> Total Deals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="total-deals-count">{totalDeals}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" /> Open
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="open-deals-count">{openDeals}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" /> Total Interests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="total-interests-count">{totalInterests}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" /> Committed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600" data-testid="total-committed-amount">{formatINR(totalCommitted)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="deal-search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="deal-search"
                    placeholder="Company or sector..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                    data-testid="deal-search-input"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="deal-status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="deal-status-filter" data-testid="deal-status-filter">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {STATUS_OPTIONS.map(s => (
                      <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="deal-stage-filter">Stage</Label>
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger id="deal-stage-filter" data-testid="deal-stage-filter">
                    <SelectValue placeholder="All Stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {STAGE_OPTIONS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deal list */}
        {isLoading ? (
          <div className="space-y-4" data-testid="admin-deals-loading">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : isError ? (
          <Card data-testid="admin-deals-error">
            <CardContent className="py-8 text-center text-destructive">
              Failed to load deals. Please try again.
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card data-testid="admin-deals-empty">
            <CardContent className="py-8 text-center text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="font-medium">No deals found</p>
              <p className="text-sm">Deals will appear here once they are created by investors.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map(deal => (
              <Card key={deal.id} data-testid="admin-deal-row">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold">{deal.title}</h3>
                        <Badge variant={statusVariant(deal.dealStatus)} data-testid="deal-status-badge">
                          {deal.dealStatus}
                        </Badge>
                        <Badge variant="outline" data-testid="deal-stage-badge">
                          {deal.stage}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{deal.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-1">
                        <span>Sector: <span className="font-medium text-foreground">{deal.industrySector}</span></span>
                        <span>Deal Size: <span className="font-medium text-foreground">{formatINR(deal.dealSize)}</span></span>
                        <span>Created: <span className="font-medium text-foreground">{new Date(deal.createdAt).toLocaleDateString('en-IN')}</span></span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 text-right shrink-0">
                      <div>
                        <div className="text-xl font-bold" data-testid="deal-interest-count">{deal.interestCount}</div>
                        <div className="text-xs text-muted-foreground">Interests</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold" data-testid="deal-commitment-count">{deal.commitmentCount}</div>
                        <div className="text-xs text-muted-foreground">Commitments</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-blue-600" data-testid="deal-total-committed">{formatINR(deal.totalCommitted)}</div>
                        <div className="text-xs text-muted-foreground">Committed</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

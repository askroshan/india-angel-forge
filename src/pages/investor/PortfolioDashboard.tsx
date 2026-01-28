import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, IndianRupee, Calendar, Percent, AlertCircle, Building2, Info, Clock } from 'lucide-react';

// Types
interface PortfolioCompany {
  id: string;
  investor_id: string;
  deal_id: string;
  investment_amount: number;
  investment_date: string;
  ownership_percentage: number;
  current_valuation: number | null;
  irr: number | null;
  multiple: number | null;
  status: 'ACTIVE' | 'EXITED';
  deal: {
    id: string;
    company_name: string;
    sector: string;
    funding_stage: string;
    company_logo?: string;
  };
  latest_update: {
    id: string;
    title: string;
    posted_at: string;
    summary: string;
  } | null;
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
  });
};

const STAGE_LABELS: Record<string, string> = {
  SEED: 'Seed',
  SERIES_A: 'Series A',
  SERIES_B: 'Series B',
  SERIES_C: 'Series C',
  SERIES_D: 'Series D',
  PRE_SEED: 'Pre-Seed',
};

const PortfolioDashboard = () => {
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch portfolio companies
  const { data: companies = [], isLoading, error } = useQuery<PortfolioCompany[]>({
    queryKey: ['portfolio-companies'],
    queryFn: async () => {
      const response = await apiClient.get<PortfolioCompany[]>('/api/portfolio/companies');
      return response;
    },
  });

  // Calculate portfolio statistics
  const portfolioStats = useMemo(() => {
    const totalInvested = companies.reduce((sum, company) => sum + company.investment_amount, 0);
    const totalCurrentValue = companies.reduce((sum, company) => {
      return sum + (company.current_valuation || company.investment_amount);
    }, 0);
    const unrealizedGain = totalCurrentValue - totalInvested;
    const gainPercentage = totalInvested > 0 ? (unrealizedGain / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrentValue,
      unrealizedGain,
      gainPercentage,
      totalCompanies: companies.length,
      activeCompanies: companies.filter(c => c.status === 'ACTIVE').length,
      exitedCompanies: companies.filter(c => c.status === 'EXITED').length,
    };
  }, [companies]);

  // Filter companies
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      if (sectorFilter !== 'all' && company.deal.sector !== sectorFilter) return false;
      if (stageFilter !== 'all' && company.deal.funding_stage !== stageFilter) return false;
      if (statusFilter !== 'all' && company.status !== statusFilter) return false;
      return true;
    });
  }, [companies, sectorFilter, stageFilter, statusFilter]);

  // Get unique sectors and stages for filters
  const sectors = useMemo(() => {
    const uniqueSectors = new Set(companies.map(c => c.deal.sector));
    return Array.from(uniqueSectors);
  }, [companies]);

  const stages = useMemo(() => {
    const uniqueStages = new Set(companies.map(c => c.deal.funding_stage));
    return Array.from(uniqueStages);
  }, [companies]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading portfolio...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading portfolio. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Portfolio Dashboard</h1>
            <p className="text-muted-foreground">
              Track all your investments in one place
            </p>
          </div>
        </div>

        {/* Portfolio Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Portfolio Value
              </CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatIndianCurrency(portfolioStats.totalCurrentValue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {portfolioStats.totalCompanies} companies
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Invested
              </CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatIndianCurrency(portfolioStats.totalInvested)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Capital deployed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Unrealized Gain
              </CardTitle>
              {portfolioStats.unrealizedGain >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${portfolioStats.unrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatIndianCurrency(portfolioStats.unrealizedGain)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {portfolioStats.gainPercentage >= 0 ? '+' : ''}{portfolioStats.gainPercentage.toFixed(1)}% return
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Portfolio Status
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {portfolioStats.activeCompanies}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Active • {portfolioStats.exitedCompanies} Exited
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sector-filter">Sector</Label>
                <Select value={sectorFilter} onValueChange={setSectorFilter}>
                  <SelectTrigger id="sector-filter">
                    <SelectValue placeholder="All Sectors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sectors</SelectItem>
                    {sectors.map(sector => (
                      <SelectItem key={sector} value={sector}>
                        {sector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage-filter">Stage</Label>
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger id="stage-filter">
                    <SelectValue placeholder="All Stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {stages.map(stage => (
                      <SelectItem key={stage} value={stage}>
                        {STAGE_LABELS[stage] || stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="EXITED">Exited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Companies List */}
        {filteredCompanies.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No portfolio companies yet</h3>
              <p className="text-muted-foreground mb-4">
                Start investing in deals to build your portfolio
              </p>
              <Button asChild>
                <Link to="/events">Browse Deals</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredCompanies.map((company) => (
              <Card key={company.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Company Logo */}
                    <div className="flex-shrink-0">
                      {company.deal.company_logo ? (
                        <img
                          src={company.deal.company_logo}
                          alt={company.deal.company_name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Company Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">
                            {company.deal.company_name}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline">{company.deal.sector}</Badge>
                            <Badge variant="secondary">
                              {STAGE_LABELS[company.deal.funding_stage] || company.deal.funding_stage}
                            </Badge>
                            <Badge variant={company.status === 'ACTIVE' ? 'default' : 'secondary'}>
                              {company.status}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Investment Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" />
                            Investment
                          </div>
                          <div className="font-semibold">
                            {formatIndianCurrency(company.investment_amount)}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Invested
                          </div>
                          <div className="font-semibold">
                            {formatDate(company.investment_date)}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" />
                            Current Value
                          </div>
                          <div className="font-semibold">
                            {company.current_valuation
                              ? formatIndianCurrency(company.current_valuation)
                              : 'Not Available'}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <Percent className="h-3 w-3" />
                            Ownership
                          </div>
                          <div className="font-semibold">
                            {company.ownership_percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">IRR</div>
                          <div className={`font-semibold text-lg ${company.irr && company.irr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {company.irr !== null ? `${company.irr >= 0 ? '+' : ''}${company.irr.toFixed(1)}%` : 'Not Available'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Multiple</div>
                          <div className="font-semibold text-lg">
                            {company.multiple !== null ? `${company.multiple.toFixed(1)}x` : 'Not Available'}
                          </div>
                        </div>
                      </div>

                      {/* Latest Update */}
                      {company.latest_update && (
                        <div className="border-t pt-3">
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">
                                  {company.latest_update.title}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(company.latest_update.posted_at)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {company.latest_update.summary}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Portfolio Metrics Explained
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-1">IRR (Internal Rate of Return)</h4>
              <p className="text-sm text-muted-foreground">
                Measures the annualized rate of return on your investment, accounting for the time value of money.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Multiple</h4>
              <p className="text-sm text-muted-foreground">
                Shows how many times your investment has grown. For example, 2.5x means your investment is worth 2.5 times your initial capital.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Unrealized Gain</h4>
              <p className="text-sm text-muted-foreground">
                The difference between current valuation and your invested amount for active investments that haven't been exited yet.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PortfolioDashboard;

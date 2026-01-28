import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, TrendingUp, Building2, Target, IndianRupee } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/api/client';

/**
 * Deal data structure from the API
 */
interface Deal {
  id: string;
  company_id: string;
  deal_status: string;
  amount_raising: number;
  valuation: number;
  equity_percentage: number;
  minimum_investment: number;
  deal_terms: string;
  posted_date: string;
  closing_date: string;
  company: {
    id: string;
    name: string;
    sector: string;
    stage: string;
    description: string;
    logo_url: string;
  };
}

/**
 * Stage display labels
 */
const STAGE_LABELS: Record<string, string> = {
  'pre-seed': 'Pre-Seed',
  'seed': 'Seed',
  'series-a': 'Series A',
  'series-b': 'Series B',
  'series-c': 'Series C',
};

/**
 * Format a number as Indian currency (INR)
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * BrowseDeals component - allows verified investors to browse available deals
 */
export default function BrowseDeals() {
  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [checkSizeFilter, setCheckSizeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');

  // Fetch deals from API
  const { data: deals = [], isLoading, error } = useQuery<Deal[]>({
    queryKey: ['deals'],
    queryFn: async () => {
      const data = await apiClient.get<Deal[]>('/api/deals');
      return data ?? [];
    },
  });

  // Extract unique sectors for filter dropdown
  const uniqueSectors = useMemo(() => {
    const sectors = new Set(deals.map(deal => deal.company.sector));
    return Array.from(sectors).sort();
  }, [deals]);

  // Extract unique stages for filter dropdown
  const uniqueStages = useMemo(() => {
    const stages = new Set(deals.map(deal => deal.company.stage));
    return Array.from(stages).sort();
  }, [deals]);

  // Apply filters and sorting
  const filteredAndSortedDeals = useMemo(() => {
    let filtered = deals;

    // Filter by search term (company name)
    if (searchTerm) {
      filtered = filtered.filter(deal =>
        deal.company.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by sector
    if (sectorFilter !== 'all') {
      filtered = filtered.filter(deal => deal.company.sector === sectorFilter);
    }

    // Filter by stage
    if (stageFilter !== 'all') {
      filtered = filtered.filter(deal => deal.company.stage === stageFilter);
    }

    // Filter by check size
    if (checkSizeFilter !== 'all') {
      const ranges: Record<string, [number, number]> = {
        'under-5l': [0, 500000],
        '5l-10l': [500000, 1000000],
        '10l-25l': [1000000, 2500000],
        'above-25l': [2500000, Infinity],
      };
      
      const [min, max] = ranges[checkSizeFilter] || [0, Infinity];
      filtered = filtered.filter(deal => 
        deal.minimum_investment >= min && deal.minimum_investment < max
      );
    }

    // Sort deals
    const sorted = [...filtered];
    switch (sortBy) {
      case 'date_desc':
        sorted.sort((a, b) => new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime());
        break;
      case 'date_asc':
        sorted.sort((a, b) => new Date(a.posted_date).getTime() - new Date(b.posted_date).getTime());
        break;
      case 'amount_desc':
        sorted.sort((a, b) => b.amount_raising - a.amount_raising);
        break;
      case 'amount_asc':
        sorted.sort((a, b) => a.amount_raising - b.amount_raising);
        break;
      default:
        break;
    }

    return sorted;
  }, [deals, searchTerm, sectorFilter, stageFilter, checkSizeFilter, sortBy]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-red-500">Error loading deals</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Available Deals</h1>
        <p className="text-muted-foreground">
          Browse active investment opportunities from verified startups
        </p>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <Label htmlFor="search">Search Startups</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by company name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Sector Filter */}
            <div>
              <Label htmlFor="sector">Sector</Label>
              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger id="sector">
                  <SelectValue placeholder="All Sectors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  {uniqueSectors.map(sector => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stage Filter */}
            <div>
              <Label htmlFor="stage">Stage</Label>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger id="stage">
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {uniqueStages.map(stage => (
                    <SelectItem key={stage} value={stage}>
                      {STAGE_LABELS[stage] || stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Check Size Filter */}
            <div>
              <Label htmlFor="checkSize">Check Size</Label>
              <Select value={checkSizeFilter} onValueChange={setCheckSizeFilter}>
                <SelectTrigger id="checkSize">
                  <SelectValue placeholder="All Sizes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  <SelectItem value="under-5l">Under ₹5L</SelectItem>
                  <SelectItem value="5l-10l">₹5L - ₹10L</SelectItem>
                  <SelectItem value="10l-25l">₹10L - ₹25L</SelectItem>
                  <SelectItem value="above-25l">Above ₹25L</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sort */}
          <div className="mt-4 flex items-center gap-2">
            <Label htmlFor="sort">Sort by:</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger id="sort" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Newest First</SelectItem>
                <SelectItem value="date_asc">Oldest First</SelectItem>
                <SelectItem value="amount_desc">Highest Amount</SelectItem>
                <SelectItem value="amount_asc">Lowest Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Deals Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p>Loading deals...</p>
        </div>
      ) : filteredAndSortedDeals.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No deals available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAndSortedDeals.map(deal => (
            <Card key={deal.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">
                      {deal.company.name}
                    </CardTitle>
                    <CardDescription className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4" />
                        <span>{deal.company.sector}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4" />
                        <span>{STAGE_LABELS[deal.company.stage] || deal.company.stage}</span>
                      </div>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {deal.company.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Raising</p>
                    <p className="font-semibold flex items-center gap-1">
                      <IndianRupee className="h-4 w-4" />
                      {formatIndianCurrency(deal.amount_raising)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Valuation</p>
                    <p className="font-semibold flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      {formatIndianCurrency(deal.valuation)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Equity</p>
                    <p className="font-semibold">{deal.equity_percentage}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Min. Investment</p>
                    <p className="font-semibold flex items-center gap-1">
                      <IndianRupee className="h-4 w-4" />
                      {formatIndianCurrency(deal.minimum_investment)}
                    </p>
                  </div>
                </div>

                <Button asChild className="w-full">
                  <Link to={`/deals/${deal.id}`}>
                    View Deal Details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

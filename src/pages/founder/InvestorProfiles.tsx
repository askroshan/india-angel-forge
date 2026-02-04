import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Target, TrendingUp, Briefcase, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/api/client';

/**
 * Investor profile data structure from the API
 */
interface InvestorProfile {
  id: string;
  email: string;
  full_name: string;
  profile: {
    investment_focus: string[];
    stages: string[];
    check_size_min: number;
    check_size_max: number;
    notable_investments: string;
    operator_background: string | null;
    bio: string;
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
 * InvestorProfiles component - allows approved founders to view and filter investor profiles
 */
export default function InvestorProfiles() {
  const [sectorFilter, setSectorFilter] = useState('all');
  const [checkSizeFilter, setCheckSizeFilter] = useState('all');

  // Fetch investor profiles
  const { data: investors = [], isLoading, error } = useQuery<InvestorProfile[]>({
    queryKey: ['investors'],
    queryFn: async () => {
      return await apiClient.get<InvestorProfile[]>('/api/investors');
    },
  });

  // Extract unique sectors for filter dropdown
  const uniqueSectors = useMemo(() => {
    const sectors = new Set<string>();
    investors.forEach(investor => {
      investor.profile.investment_focus.forEach(sector => sectors.add(sector));
    });
    return Array.from(sectors).sort();
  }, [investors]);

  // Apply filters
  const filteredInvestors = useMemo(() => {
    let filtered = investors;

    // Filter by sector
    if (sectorFilter !== 'all') {
      filtered = filtered.filter(investor =>
        investor.profile.investment_focus.includes(sectorFilter)
      );
    }

    // Filter by check size
    if (checkSizeFilter !== 'all') {
      const ranges: Record<string, [number, number]> = {
        'under-10l': [0, 1000000],
        '10l-50l': [1000000, 5000000],
        '50l-1cr': [5000000, 10000000],
        'above-1cr': [10000000, Infinity],
      };

      const [min, max] = ranges[checkSizeFilter] || [0, Infinity];
      filtered = filtered.filter(investor => {
        const investorMin = investor.profile.check_size_min;
        const investorMax = investor.profile.check_size_max;
        // Check if investor's range overlaps with selected range
        return investorMax >= min && investorMin < max;
      });
    }

    return filtered;
  }, [investors, sectorFilter, checkSizeFilter]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-red-500">Error loading investors</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Investor Directory</h1>
        <p className="text-muted-foreground">
          Browse verified angel investors to find the perfect match for your startup
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sector Filter */}
            <div>
              <Label htmlFor="sector">Filter by Sector</Label>
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

            {/* Check Size Filter */}
            <div>
              <Label htmlFor="checkSize">Filter by Check Size</Label>
              <Select value={checkSizeFilter} onValueChange={setCheckSizeFilter}>
                <SelectTrigger id="checkSize">
                  <SelectValue placeholder="All Sizes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  <SelectItem value="under-10l">Under ₹10L</SelectItem>
                  <SelectItem value="10l-50l">₹10L - ₹50L</SelectItem>
                  <SelectItem value="50l-1cr">₹50L - ₹1Cr</SelectItem>
                  <SelectItem value="above-1cr">Above ₹1Cr</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investor Profiles Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p>Loading investors...</p>
        </div>
      ) : filteredInvestors.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No investors found matching your criteria</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredInvestors.map(investor => (
            <Card key={investor.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">
                      {investor.full_name}
                    </CardTitle>
                    <CardDescription>
                      {investor.profile.bio}
                    </CardDescription>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Investment Focus */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Target className="h-4 w-4" />
                    <span>Investment Focus</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {investor.profile.investment_focus.map((sector, index) => (
                      <Badge key={index} variant="secondary">
                        {sector}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Investment Stages */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Investment Stages</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {investor.profile.stages.map((stage, index) => (
                      <Badge key={index} variant="outline">
                        {STAGE_LABELS[stage] || stage}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Check Size Range */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Check Size Range</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatIndianCurrency(investor.profile.check_size_min)} - {formatIndianCurrency(investor.profile.check_size_max)}
                  </p>
                </div>

                {/* Notable Investments */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Award className="h-4 w-4" />
                    <span>Notable Investments</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {investor.profile.notable_investments}
                  </p>
                </div>

                {/* Operator Background */}
                {investor.profile.operator_background && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Briefcase className="h-4 w-4" />
                      <span>Operator Background</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {investor.profile.operator_background}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

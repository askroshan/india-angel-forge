import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Plus, IndianRupee, AlertCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';

interface SPV {
  id: string;
  name: string;
  dealId: string;
  leadInvestorId: string;
  targetAmount: number;
  carryPercentage: number;
  description?: string;
  status: string;
  createdAt: string;
  memberCount: number;
  committedAmount: number;
}

const formatCurrency = (amount: number): string => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} Lac`;
  return `₹${amount.toLocaleString('en-IN')}`;
};

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  forming: 'secondary',
  active: 'default',
  closed: 'outline',
};

export default function InvestorSPVList() {
  const { data: spvs = [], isLoading, error } = useQuery<SPV[]>({
    queryKey: ['investor-spvs'],
    queryFn: () => apiClient.get<SPV[]>('/api/spvs'),
  });

  return (
    <>
      <Navigation />
      <main className="container mx-auto px-4 py-8" data-testid="investor-spv-list">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">My SPVs</h1>
            <p className="text-muted-foreground mt-1">
              Special Purpose Vehicles you lead or participate in
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-12 text-muted-foreground" data-testid="spv-list-loading">
            Loading SPVs…
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to load SPVs. Please try again.</AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && spvs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground" data-testid="spv-list-empty">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No SPVs yet</p>
            <p className="text-sm mt-2">
              Express interest in a deal to create an SPV.
            </p>
            <Button asChild className="mt-4">
              <Link to="/deals">Browse Deals</Link>
            </Button>
          </div>
        )}

        {spvs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="spv-grid">
            {spvs.map(spv => (
              <Card key={spv.id} className="hover:shadow-md transition-shadow" data-testid={`spv-card-${spv.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">{spv.name}</CardTitle>
                    <Badge variant={STATUS_COLORS[spv.status] ?? 'secondary'}>
                      {spv.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Target</p>
                      <p className="font-semibold">{formatCurrency(spv.targetAmount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Committed</p>
                      <p className="font-semibold">{formatCurrency(spv.committedAmount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Members</p>
                      <p className="font-semibold flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {spv.memberCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Carry</p>
                      <p className="font-semibold">{spv.carryPercentage}%</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to={`/investor/spv/${spv.id}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

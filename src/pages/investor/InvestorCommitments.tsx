import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Briefcase, IndianRupee, AlertCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';

interface Deal {
  id: string;
  companyName?: string;
  sector?: string;
  stage?: string;
}

interface Commitment {
  id: string;
  dealId: string;
  userId: string;
  amount: string | number;
  status: string;
  notes?: string;
  createdAt: string;
  deal: Deal;
}

const formatCurrency = (amount: string | number): string => {
  const n = Number(amount);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} Lac`;
  return `₹${n.toLocaleString('en-IN')}`;
};

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completed: 'default',
  pending: 'secondary',
  cancelled: 'destructive',
};

export default function InvestorCommitments() {
  const { data: commitments = [], isLoading, error } = useQuery<Commitment[]>({
    queryKey: ['investor-commitments'],
    queryFn: () => apiClient.get<Commitment[]>('/api/commitments'),
  });

  const totalCommitted = commitments
    .filter(c => c.status === 'completed')
    .reduce((s, c) => s + Number(c.amount), 0);

  return (
    <>
      <Navigation />
      <main className="container mx-auto px-4 py-8" data-testid="investor-commitments-page">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Commitments</h1>
            <p className="text-muted-foreground mt-1">
              Investment commitments you have made
            </p>
          </div>
          {totalCommitted > 0 && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Committed</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalCommitted)}</p>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="text-center py-12 text-muted-foreground" data-testid="commitments-loading">
            Loading commitments…
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to load commitments. Please try again.</AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && commitments.length === 0 && (
          <div className="text-center py-12 text-muted-foreground" data-testid="commitments-empty">
            <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No commitments yet</p>
            <p className="text-sm mt-2">Browse deals and express interest to make commitments.</p>
            <Button asChild className="mt-4">
              <Link to="/deals">Browse Deals</Link>
            </Button>
          </div>
        )}

        {commitments.length > 0 && (
          <div className="space-y-3" data-testid="commitments-list">
            {commitments.map(commitment => (
              <Card key={commitment.id} className="hover:shadow-sm transition-shadow" data-testid={`commitment-${commitment.id}`}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-semibold">
                          {commitment.deal?.companyName || 'Unknown Company'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {commitment.deal?.sector && `${commitment.deal.sector} · `}
                          {commitment.deal?.stage || 'Unknown Stage'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-lg flex items-center gap-1">
                          <IndianRupee className="h-4 w-4" />
                          {formatCurrency(commitment.amount).replace('₹', '')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(commitment.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <Badge variant={STATUS_COLORS[commitment.status] ?? 'secondary'}>
                        {commitment.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

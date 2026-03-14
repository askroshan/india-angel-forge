import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  TrendingUp,
  IndianRupee,
  Calendar,
  Info,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import Navigation from '@/components/Navigation';

interface Deal {
  id: string;
  title: string;
  companyName: string;
  slug: string;
  description: string;
  industrySector: string;
  stage: string;
  dealSize: number;
  minInvestment: number;
  valuation?: number;
  dealStatus: string;
  createdAt: string;
}

interface DealInterest {
  id: string;
  dealId: string;
  status: string;
}

const formatCurrency = (amount: number): string => {
  const absAmount = Math.abs(amount);
  if (absAmount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (absAmount >= 100000) return `₹${(amount / 100000).toFixed(1)} Lac`;
  return `₹${amount.toLocaleString('en-IN')}`;
};

const STAGE_LABELS: Record<string, string> = {
  SEED: 'Seed',
  SERIES_A: 'Series A',
  SERIES_B: 'Series B',
  SERIES_C: 'Series C',
  PRE_SEED: 'Pre-Seed',
  GROWTH: 'Growth',
};

export default function DealDetail() {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [interestSuccess, setInterestSuccess] = useState(false);

  const { data: deal, isLoading, error } = useQuery<Deal>({
    queryKey: ['deal', dealId],
    queryFn: () => apiClient.get<Deal>(`/api/deals/${dealId}`),
    enabled: !!dealId,
  });

  const { data: existingInterests = [] } = useQuery<DealInterest[]>({
    queryKey: ['deal-interests'],
    queryFn: () => apiClient.get<DealInterest[]>('/api/deals/interests'),
  });

  const alreadyInterested = deal
    ? existingInterests.some(i => i.dealId === deal.id)
    : false;

  const expressInterestMutation = useMutation({
    mutationFn: () =>
      apiClient.post(`/api/deals/${deal!.id}/interest`, { commitmentAmount: deal!.minInvestment }),
    onSuccess: () => {
      setInterestSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['deal-interests'] });
      queryClient.invalidateQueries({ queryKey: ['deal-pipeline'] });
    },
  });

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto px-4 py-12 text-center" data-testid="deal-detail-loading">
          <p className="text-muted-foreground">Loading deal details…</p>
        </div>
      </>
    );
  }

  if (error || !deal) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <Alert variant="destructive" data-testid="deal-detail-error">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Deal not found. It may have been removed or the link is invalid.
            </AlertDescription>
          </Alert>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/deals')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Deals
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="container mx-auto px-4 py-8" data-testid="deal-detail-page">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
          <Link to="/deals" className="hover:text-foreground transition-colors">
            Deals
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{deal.companyName}</span>
        </div>

        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-6"
          data-testid="deal-detail-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold" data-testid="deal-company-name">
                  {deal.companyName}
                </h1>
                <Badge
                  variant={deal.dealStatus === 'open' ? 'default' : 'secondary'}
                  data-testid="deal-status-badge"
                >
                  {deal.dealStatus.toUpperCase()}
                </Badge>
              </div>
              <p className="text-muted-foreground text-lg">{deal.description}</p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Sector</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold" data-testid="deal-sector">
                    {deal.industrySector}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Stage</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold" data-testid="deal-stage">
                    {STAGE_LABELS[deal.stage] || deal.stage}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    Deal Size
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold" data-testid="deal-size">
                    {formatCurrency(deal.dealSize)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    Min Investment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold" data-testid="deal-min-investment">
                    {formatCurrency(deal.minInvestment)}
                  </p>
                </CardContent>
              </Card>
              {deal.valuation && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Valuation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold" data-testid="deal-valuation">
                      {formatCurrency(deal.valuation)}
                    </p>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Posted
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">
                    {new Date(deal.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* SEBI Regulatory Disclosure — US-INV-113 */}
            <Alert className="border-amber-200 bg-amber-50">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-sm" data-testid="sebi-disclosure">
                <strong>SEBI Regulatory Disclosure:</strong> This investment opportunity is available only to
                SEBI-registered Accredited Investors (AI) as per SEBI AIF Regulations 2012. Minimum
                ticket size for Category I/II AIF is ₹1 crore. Past performance does not guarantee
                future returns. Please read the Private Placement Memorandum (PPM) carefully before
                investing. Investments in unlisted securities carry higher risk.
              </AlertDescription>
            </Alert>
          </div>

          {/* Action panel */}
          <div className="space-y-4">
            <Card data-testid="deal-interest-panel">
              <CardHeader>
                <CardTitle>Express Interest</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {interestSuccess || alreadyInterested ? (
                  <div className="flex items-center gap-2 text-green-700" data-testid="deal-interest-success">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Interest Registered</span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Registering interest notifies the deal team and adds this deal to your pipeline.
                    </p>
                    <Button
                      className="w-full"
                      onClick={() => expressInterestMutation.mutate()}
                      disabled={expressInterestMutation.isPending || deal.dealStatus !== 'open'}
                      data-testid="express-interest-button"
                    >
                      {expressInterestMutation.isPending ? 'Registering…' : 'Express Interest'}
                    </Button>
                    {expressInterestMutation.isError && (
                      <p className="text-sm text-destructive" data-testid="deal-interest-error">
                        Failed to register interest. Please try again.
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Related Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={`/deals/${deal.id}/documents`}>View Documents</Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={`/investor/due-diligence/${deal.id}`}>Due Diligence</Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/investor/pipeline">My Pipeline</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}

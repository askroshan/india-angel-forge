import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Target, TrendingUp, IndianRupee, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
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
 * Deal interest response from API
 */
interface DealInterest {
  id: string;
  deal_id: string;
  investor_id: string;
  investment_amount: number;
  status: string;
  sponsor_notified?: boolean;
  data_room_access?: boolean;
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
 * ExpressInterest component - allows verified investors to express interest in a deal
 */
export default function ExpressInterest() {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [formError, setFormError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Fetch deal details
  const { data: deal, isLoading, error } = useQuery<Deal>({
    queryKey: ['deal', dealId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/deals/${dealId}`);
      return response.data;
    },
    enabled: !!dealId,
  });

  // Submit interest mutation
  const submitInterestMutation = useMutation({
    mutationFn: async (data: { deal_id: string; investment_amount: number }) => {
      const response = await apiClient.post('/api/deal-interests', data);
      return response.data;
    },
    onSuccess: (data: DealInterest) => {
      setSubmitted(true);
      toast.success('Interest submitted successfully');
      
      // Show additional success messages based on response
      if (data.sponsor_notified) {
        toast.success('Deal sponsor has been notified');
      }
      if (data.data_room_access) {
        toast.success('You now have access to the data room');
      }
      toast.success('Deal added to your pipeline');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to submit interest';
      setFormError(message);
      toast.error(message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validate investment amount
    if (!investmentAmount || investmentAmount === '0') {
      setFormError('Investment amount is required');
      return;
    }

    const amount = parseFloat(investmentAmount);
    if (isNaN(amount)) {
      setFormError('Please enter a valid amount');
      return;
    }

    if (deal && amount < deal.minimum_investment) {
      setFormError('Investment amount below minimum');
      return;
    }

    // Submit interest
    if (dealId) {
      submitInterestMutation.mutate({
        deal_id: dealId,
        investment_amount: amount,
      });
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-red-500">Error loading deal</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p>Loading deal details...</p>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p>Deal not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-center text-2xl">Interest Submitted Successfully!</CardTitle>
            <CardDescription className="text-center">
              Your interest in {deal.company.name} has been recorded
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <p className="text-sm text-green-800">
                ✓ Interest submitted successfully
              </p>
              <p className="text-sm text-green-800">
                ✓ Deal sponsor has been notified
              </p>
              <p className="text-sm text-green-800">
                ✓ You now have access to the data room
              </p>
              <p className="text-sm text-green-800">
                ✓ Deal added to your pipeline
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => navigate('/pipeline')} className="flex-1">
                View Pipeline
              </Button>
              <Button onClick={() => navigate('/deals')} variant="outline" className="flex-1">
                Browse More Deals
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/deals')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Deals
      </Button>

      {/* Deal Summary Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">{deal.company.name}</CardTitle>
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
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {deal.company.description}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        </CardContent>
      </Card>

      {/* Express Interest Form */}
      <Card>
        <CardHeader>
          <CardTitle>Express Interest</CardTitle>
          <CardDescription>
            Specify your intended investment amount to proceed with this opportunity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="investment-amount">
                Investment Amount (INR)
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="investment-amount"
                type="number"
                placeholder="Enter amount"
                value={investmentAmount}
                onChange={(e) => {
                  setInvestmentAmount(e.target.value);
                  setFormError('');
                }}
                min={deal.minimum_investment}
                step="1000"
                aria-label="Investment Amount"
              />
              <p className="text-xs text-muted-foreground">
                Minimum: {formatIndianCurrency(deal.minimum_investment)}
              </p>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{formError}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium mb-2">
                What happens next:
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Deal sponsor will be notified of your interest</li>
                <li>• You'll gain access to data room documents</li>
                <li>• Deal will be added to your pipeline</li>
                <li>• You can proceed with due diligence</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitInterestMutation.isPending}
            >
              {submitInterestMutation.isPending ? 'Submitting...' : 'Submit Interest'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

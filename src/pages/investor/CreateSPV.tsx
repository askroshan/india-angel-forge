import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, TrendingUp, DollarSign, Percent } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';

/**
 * Deal data structure
 */
interface Deal {
  id: string;
  company_name: string;
  sector: string;
  funding_stage: string;
  target_amount: number;
}

/**
 * SPV response from API
 */
interface SPV {
  id: string;
  spv_name: string;
  deal_id: string;
  lead_investor_id: string;
  target_raise_amount: number;
  carry_percentage: number;
  hurdle_rate: number;
  minimum_investment: number;
  status: string;
}

/**
 * Funding stage labels
 */
const STAGE_LABELS: Record<string, string> = {
  PRE_SEED: 'Pre-Seed',
  SEED: 'Seed',
  SERIES_A: 'Series A',
  SERIES_B: 'Series B',
  SERIES_C: 'Series C',
  BRIDGE: 'Bridge',
};

/**
 * Format a number as Indian currency (INR)
 */
function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * CreateSPV component - allows lead investors to create SPVs for deals
 */
export default function CreateSPV() {
  const queryClient = useQueryClient();
  const [selectedDealId, setSelectedDealId] = useState<string>('');
  const [spvName, setSpvName] = useState('');
  const [targetRaiseAmount, setTargetRaiseAmount] = useState('');
  const [carryPercentage, setCarryPercentage] = useState('');
  const [hurdleRate, setHurdleRate] = useState('');
  const [minimumInvestment, setMinimumInvestment] = useState('');
  const [formError, setFormError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch available deals
  const { data: deals = [], isLoading, error } = useQuery<Deal[]>({
    queryKey: ['deals'],
    queryFn: async () => {
      const response = await apiClient.get('/api/deals');
      return response.data;
    },
  });

  // Create SPV mutation
  const createSPVMutation = useMutation({
    mutationFn: async (data: {
      spv_name: string;
      deal_id: string;
      target_raise_amount: number;
      carry_percentage: number;
      hurdle_rate: number;
      minimum_investment: number;
    }) => {
      const response = await apiClient.post('/api/spvs', data);
      return response.data;
    },
    onSuccess: (data: SPV) => {
      toast.success('SPV created successfully');
      toast.success('You can now invite co-investors to join');
      toast.success('Track allocation status from the SPV dashboard');
      queryClient.invalidateQueries({ queryKey: ['spvs'] });
      
      // Reset form
      setSpvName('');
      setSelectedDealId('');
      setTargetRaiseAmount('');
      setCarryPercentage('');
      setHurdleRate('');
      setMinimumInvestment('');
      setFormError('');
      setValidationErrors({});
    },
    onError: () => {
      toast.error('Failed to create SPV');
    },
  });

  const selectedDeal = deals.find(deal => deal.id === selectedDealId);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!spvName.trim()) {
      errors.spvName = 'SPV name is required';
    }

    if (!selectedDealId) {
      errors.deal = 'Please select a deal';
    }

    if (!targetRaiseAmount || parseFloat(targetRaiseAmount) <= 0) {
      errors.targetRaiseAmount = 'Target raise amount is required';
    }

    if (!carryPercentage) {
      errors.carryPercentage = 'Carry percentage is required';
    } else {
      const carry = parseFloat(carryPercentage);
      if (carry < 0 || carry > 100) {
        errors.carryPercentage = 'Carry percentage must be between 0 and 100';
      }
    }

    if (!hurdleRate) {
      errors.hurdleRate = 'Hurdle rate is required';
    }

    if (!minimumInvestment) {
      errors.minimumInvestment = 'Minimum investment is required';
    } else if (parseFloat(minimumInvestment) <= 0) {
      errors.minimumInvestment = 'Minimum investment must be positive';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!validateForm()) {
      setFormError('All fields are required. Please fill in all the details.');
      return;
    }

    createSPVMutation.mutate({
      spv_name: spvName,
      deal_id: selectedDealId,
      target_raise_amount: parseFloat(targetRaiseAmount),
      carry_percentage: parseFloat(carryPercentage),
      hurdle_rate: parseFloat(hurdleRate),
      minimum_investment: parseFloat(minimumInvestment),
    });
  };

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
        <h1 className="text-3xl font-bold mb-2">Create Special Purpose Vehicle (SPV)</h1>
        <p className="text-muted-foreground">
          Create an SPV to pool investments from multiple investors for a specific deal
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>SPV Details</CardTitle>
              <CardDescription>
                Configure your Special Purpose Vehicle structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* SPV Name */}
                <div className="space-y-2">
                  <Label htmlFor="spv-name">
                    SPV Name
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="spv-name"
                    type="text"
                    placeholder="e.g., TechStartup SPV 2026"
                    value={spvName}
                    onChange={(e) => {
                      setSpvName(e.target.value);
                      setFormError('');
                      setValidationErrors({});
                    }}
                    aria-label="SPV Name"
                  />
                  {validationErrors.spvName && (
                    <p className="text-sm text-red-500">{validationErrors.spvName}</p>
                  )}
                </div>

                {/* Deal Selection */}
                <div className="space-y-2">
                  <Label htmlFor="deal-select">
                    Select Deal
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select value={selectedDealId} onValueChange={setSelectedDealId}>
                    <SelectTrigger id="deal-select" aria-label="Select Deal">
                      <SelectValue placeholder="Choose a deal for this SPV" />
                    </SelectTrigger>
                    <SelectContent>
                      {deals.map(deal => (
                        <SelectItem key={deal.id} value={deal.id}>
                          {deal.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.deal && (
                    <p className="text-sm text-red-500">{validationErrors.deal}</p>
                  )}
                </div>

                {/* Selected Deal Info */}
                {selectedDeal && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-2">Selected Deal</p>
                    <div className="space-y-1 text-sm text-blue-800">
                      <p><strong>Company:</strong> {selectedDeal.company_name}</p>
                      <p><strong>Sector:</strong> {selectedDeal.sector}</p>
                      <p><strong>Stage:</strong> {STAGE_LABELS[selectedDeal.funding_stage]}</p>
                      <p><strong>Target:</strong> {formatIndianCurrency(selectedDeal.target_amount)}</p>
                    </div>
                  </div>
                )}

                {/* Target Raise Amount */}
                <div className="space-y-2">
                  <Label htmlFor="target-amount">
                    Target Raise Amount (₹)
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="target-amount"
                    type="number"
                    placeholder="10000000"
                    value={targetRaiseAmount}
                    onChange={(e) => {
                      setTargetRaiseAmount(e.target.value);
                      setFormError('');
                      setValidationErrors({});
                    }}
                    aria-label="Target Raise Amount"
                  />
                  {validationErrors.targetRaiseAmount && (
                    <p className="text-sm text-red-500">{validationErrors.targetRaiseAmount}</p>
                  )}
                </div>

                {/* Carry Percentage */}
                <div className="space-y-2">
                  <Label htmlFor="carry-percentage">
                    Carry Percentage (%)
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="carry-percentage"
                    type="number"
                    placeholder="20"
                    min="0"
                    max="100"
                    step="0.1"
                    value={carryPercentage}
                    onChange={(e) => {
                      setCarryPercentage(e.target.value);
                      setFormError('');
                      setValidationErrors({});
                    }}
                    aria-label="Carry Percentage"
                  />
                  <p className="text-xs text-muted-foreground">
                    Percentage of profits that go to the SPV lead
                  </p>
                  {validationErrors.carryPercentage && (
                    <p className="text-sm text-red-500">{validationErrors.carryPercentage}</p>
                  )}
                </div>

                {/* Hurdle Rate */}
                <div className="space-y-2">
                  <Label htmlFor="hurdle-rate">
                    Hurdle Rate (%)
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="hurdle-rate"
                    type="number"
                    placeholder="15"
                    min="0"
                    step="0.1"
                    value={hurdleRate}
                    onChange={(e) => {
                      setHurdleRate(e.target.value);
                      setFormError('');
                      setValidationErrors({});
                    }}
                    aria-label="Hurdle Rate"
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum return threshold before carry is applied
                  </p>
                  {validationErrors.hurdleRate && (
                    <p className="text-sm text-red-500">{validationErrors.hurdleRate}</p>
                  )}
                </div>

                {/* Minimum Investment */}
                <div className="space-y-2">
                  <Label htmlFor="minimum-investment">
                    Minimum Investment per Member (₹)
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="minimum-investment"
                    type="number"
                    placeholder="500000"
                    value={minimumInvestment}
                    onChange={(e) => {
                      setMinimumInvestment(e.target.value);
                      setFormError('');
                      setValidationErrors({});
                    }}
                    aria-label="Minimum Investment"
                  />
                  {validationErrors.minimumInvestment && (
                    <p className="text-sm text-red-500">{validationErrors.minimumInvestment}</p>
                  )}
                </div>

                {/* Form Error */}
                {formError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">{formError}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createSPVMutation.isPending}
                >
                  {createSPVMutation.isPending ? 'Creating SPV...' : 'Create SPV'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What is an SPV?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-1">Pool Investments</p>
                  <p className="text-xs text-muted-foreground">
                    Combine capital from multiple investors into a single entity
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-1">Lead Deal</p>
                  <p className="text-xs text-muted-foreground">
                    Act as the lead investor while sharing the opportunity
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Percent className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-1">Earn Carry</p>
                  <p className="text-xs text-muted-foreground">
                    Receive carried interest on returns above the hurdle rate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How it Works</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground">1.</span>
                  <span>Create the SPV with terms and target amount</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground">2.</span>
                  <span>Invite co-investors to participate</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground">3.</span>
                  <span>Track commitments and allocations</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground">4.</span>
                  <span>Close SPV when target is reached</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground">5.</span>
                  <span>Complete investment in the deal</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

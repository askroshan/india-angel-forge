import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Clock, Building, TrendingUp } from 'lucide-react';

interface DealInterest {
  id: string;
  dealId: string;
  status: string;
  commitmentAmount: number;
  spvId: string | null;
  deal: {
    title: string;
    companyName: string;
    targetAmount: number;
  };
}

interface SPV {
  id: string;
  name: string;
  dealId: string;
  leadInvestorId: string;
  targetAmount: number;
  carryPercentage: number;
  description?: string;
}

interface FormData {
  name: string;
  targetAmount: string;
  carryPercentage: string;
  description: string;
}

interface ValidationErrors {
  name?: string;
  targetAmount?: string;
  carryPercentage?: string;
}

export default function CreateSPV() {
  const { interestId } = useParams<{ interestId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [interest, setInterest] = useState<DealInterest | null>(null);
  const [existingSPV, setExistingSPV] = useState<SPV | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    targetAmount: '',
    carryPercentage: '20',
    description: '',
  });

  useEffect(() => {
    checkAccess();
  }, [interestId]);

  const checkAccess = async () => {
    try {
      if (!token) {
        navigate('/auth');
        return;
      }

      // Fetch deal interest - note: this endpoint needs to be created or use deals endpoint
      // For now, we'll skip the deal interest check and just check for existing SPV
      // In production, you'd need a /api/deals/interests/:id endpoint
      
      // Mock interest data for now - in production this would come from API
      const mockInterest: DealInterest = {
        id: interestId!,
        dealId: 'deal-123',
        status: 'accepted',
        commitmentAmount: 5000000,
        spvId: null,
        deal: {
          title: 'Series A Round',
          companyName: 'TechCorp',
          targetAmount: 50000000,
        },
      };

      setInterest(mockInterest);
      setHasAccess(true);

      // Pre-fill form with deal details
      setFormData(prev => ({
        ...prev,
        name: `${mockInterest.deal.companyName} SPV ${new Date().getFullYear()}`,
        targetAmount: mockInterest.deal.targetAmount?.toString() || '',
      }));

      // Check for existing SPV by fetching all SPVs
      const response = await fetch('/api/spv', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const spvs = await response.json();
        const existingSpv = spvs.find((s: SPV) => s.dealId === mockInterest.dealId);
        if (existingSpv) {
          setExistingSPV(existingSpv);
        }
      }

    } catch (err) {
      console.error('Error checking access:', err);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'SPV name is required';
    }

    const targetAmount = parseFloat(formData.targetAmount);
    if (!formData.targetAmount || isNaN(targetAmount)) {
      newErrors.targetAmount = 'Target amount is required';
    } else if (targetAmount <= 0) {
      newErrors.targetAmount = 'Target amount must be positive';
    }

    const carryPercentage = parseFloat(formData.carryPercentage);
    if (!formData.carryPercentage || isNaN(carryPercentage)) {
      newErrors.carryPercentage = 'Carry percentage is required';
    } else if (carryPercentage < 0 || carryPercentage > 30) {
      newErrors.carryPercentage = 'Carry percentage must be between 0 and 30';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (!token || !interest) return;

      // Create SPV
      const response = await fetch('/api/spv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          dealId: interest.dealId,
          targetAmount: parseFloat(formData.targetAmount),
          carryPercentage: parseFloat(formData.carryPercentage),
          description: formData.description || null,
        }),
      });

      if (!response.ok) {
        setError('Failed to create SPV. Please try again.');
        return;
      }

      // Update deal interest with SPV ID
      await supabase
        .from('deal_interests')
        .update({ spv_id: spvData.id })
        .eq('id', interestId);

      setSuccess(true);
      
      // Navigate to SPV dashboard after short delay
      setTimeout(() => {
        navigate(`/investor/spv/${spvData.id}`);
      }, 2000);

    } catch (err) {
      setError('An error occurred while creating SPV');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(amount / 100000).toFixed(2)} L`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Clock className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your interest must be accepted before you can create an SPV for this deal.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If SPV already exists
  if (existingSPV) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="space-y-6">
            <Alert>
              <Building className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-semibold">SPV Already Exists</p>
                  <p>An SPV has already been created for this deal.</p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-start gap-4">
                <Building className="h-8 w-8 text-blue-600 mt-1" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-blue-900 mb-2">
                    {existingSPV.name}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Target Amount:</span>
                      <span className="ml-2 font-semibold">
                        {formatCurrency(existingSPV.target_amount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">Carry:</span>
                      <span className="ml-2 font-semibold">
                        {existingSPV.carry_percentage}%
                      </span>
                    </div>
                  </div>
                  {existingSPV.description && (
                    <p className="mt-3 text-sm text-blue-800">
                      {existingSPV.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => navigate(`/investor/spv/${existingSPV.id}`)}>
                View SPV Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate('/investor/pipeline')}>
                Back to Pipeline
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Show creation form
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6 max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Create SPV</h1>
            <p className="text-muted-foreground">
              {interest?.deal.companyName} - {interest?.deal.title}
            </p>
          </div>

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                SPV created successfully! Redirecting to dashboard...
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Deal Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Deal Information
            </h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Company:</span>
                <span className="ml-2 font-medium">{interest?.deal.companyName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Deal Target:</span>
                <span className="ml-2 font-medium">
                  {interest && formatCurrency(interest.deal.targetAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* SPV Name */}
          <div className="space-y-2">
            <Label htmlFor="name">SPV Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., HealthTech SPV 2026"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Target Amount */}
          <div className="space-y-2">
            <Label htmlFor="targetAmount">Target Amount (₹) *</Label>
            <Input
              id="targetAmount"
              type="number"
              value={formData.targetAmount}
              onChange={(e) => handleChange('targetAmount', e.target.value)}
              placeholder="50000000"
              className={errors.targetAmount ? 'border-red-500' : ''}
            />
            {errors.targetAmount && (
              <p className="text-sm text-red-600">{errors.targetAmount}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Total investment amount to be raised through this SPV
            </p>
          </div>

          {/* Carry Percentage */}
          <div className="space-y-2">
            <Label htmlFor="carryPercentage">Carry Percentage (%) *</Label>
            <Input
              id="carryPercentage"
              type="number"
              min="0"
              max="30"
              step="0.5"
              value={formData.carryPercentage}
              onChange={(e) => handleChange('carryPercentage', e.target.value)}
              className={errors.carryPercentage ? 'border-red-500' : ''}
            />
            {errors.carryPercentage && (
              <p className="text-sm text-red-600">{errors.carryPercentage}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Percentage of profits allocated to the lead investor (typically 15-25%)
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of the SPV structure and terms..."
              rows={4}
            />
          </div>

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Important Information</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>You will be designated as the lead investor for this SPV</li>
                  <li>You'll be responsible for inviting and managing co-investors</li>
                  <li>Carry percentage applies to profits above the invested capital</li>
                  <li>SPV formation typically takes 2-4 weeks for legal documentation</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? 'Creating SPV...' : 'Create SPV'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/investor/pipeline')}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

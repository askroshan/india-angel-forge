import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Clock, Building, TrendingUp } from 'lucide-react';

interface DealInterest {
  id: string;
  deal_id: string;
  status: string;
  commitment_amount: number;
  spv_id: string | null;
  deal: {
    title: string;
    company_name: string;
    target_amount: number;
  };
}

interface SPV {
  id: string;
  name: string;
  deal_id: string;
  lead_investor_id: string;
  target_amount: number;
  carry_percentage: number;
  description?: string;
}

interface FormData {
  name: string;
  target_amount: string;
  carry_percentage: string;
  description: string;
}

interface ValidationErrors {
  name?: string;
  target_amount?: string;
  carry_percentage?: string;
}

export default function CreateSPV() {
  const { interestId } = useParams<{ interestId: string }>();
  const navigate = useNavigate();
  
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
    target_amount: '',
    carry_percentage: '20',
    description: '',
  });

  useEffect(() => {
    checkAccess();
  }, [interestId]);

  const checkAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Fetch deal interest
      const { data: interestData, error: interestError } = await supabase
        .from('deal_interests')
        .select('*, deal:deal_id(title, company_name, target_amount)')
        .eq('id', interestId)
        .eq('investor_id', session.user.id)
        .single();

      if (interestError || !interestData) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      setInterest(interestData as any);

      // Check if interest is accepted
      if (interestData.status !== 'accepted') {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      setHasAccess(true);

      // Pre-fill form with deal details
      if (interestData.deal) {
        setFormData(prev => ({
          ...prev,
          name: `${interestData.deal.company_name} SPV ${new Date().getFullYear()}`,
          target_amount: interestData.deal.target_amount?.toString() || '',
        }));
      }

      // Check for existing SPV
      if (interestData.spv_id) {
        const { data: spvData } = await supabase
          .from('spvs')
          .select('*')
          .eq('id', interestData.spv_id)
          .single();

        if (spvData) {
          setExistingSPV(spvData);
        }
      } else {
        // Check if SPV exists for this deal
        const { data: spvData } = await supabase
          .from('spvs')
          .select('*')
          .eq('deal_id', interestData.deal_id)
          .single();

        if (spvData) {
          setExistingSPV(spvData);
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

    const targetAmount = parseFloat(formData.target_amount);
    if (!formData.target_amount || isNaN(targetAmount)) {
      newErrors.target_amount = 'Target amount is required';
    } else if (targetAmount <= 0) {
      newErrors.target_amount = 'Target amount must be positive';
    }

    const carryPercentage = parseFloat(formData.carry_percentage);
    if (!formData.carry_percentage || isNaN(carryPercentage)) {
      newErrors.carry_percentage = 'Carry percentage is required';
    } else if (carryPercentage < 0 || carryPercentage > 30) {
      newErrors.carry_percentage = 'Carry percentage must be between 0 and 30';
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !interest) return;

      // Create SPV
      const { data: spvData, error: spvError } = await supabase
        .from('spvs')
        .insert({
          name: formData.name,
          deal_id: interest.deal_id,
          lead_investor_id: session.user.id,
          target_amount: parseFloat(formData.target_amount),
          carry_percentage: parseFloat(formData.carry_percentage),
          description: formData.description || null,
          status: 'forming',
        })
        .select()
        .single();

      if (spvError) {
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
              {interest?.deal.company_name} - {interest?.deal.title}
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
                <span className="ml-2 font-medium">{interest?.deal.company_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Deal Target:</span>
                <span className="ml-2 font-medium">
                  {interest && formatCurrency(interest.deal.target_amount)}
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
            <Label htmlFor="target_amount">Target Amount (₹) *</Label>
            <Input
              id="target_amount"
              type="number"
              value={formData.target_amount}
              onChange={(e) => handleChange('target_amount', e.target.value)}
              placeholder="50000000"
              className={errors.target_amount ? 'border-red-500' : ''}
            />
            {errors.target_amount && (
              <p className="text-sm text-red-600">{errors.target_amount}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Total investment amount to be raised through this SPV
            </p>
          </div>

          {/* Carry Percentage */}
          <div className="space-y-2">
            <Label htmlFor="carry_percentage">Carry Percentage (%) *</Label>
            <Input
              id="carry_percentage"
              type="number"
              min="0"
              max="30"
              step="0.5"
              value={formData.carry_percentage}
              onChange={(e) => handleChange('carry_percentage', e.target.value)}
              className={errors.carry_percentage ? 'border-red-500' : ''}
            />
            {errors.carry_percentage && (
              <p className="text-sm text-red-600">{errors.carry_percentage}</p>
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

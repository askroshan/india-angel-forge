import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Clock, FileText, Building } from 'lucide-react';

interface DealInterest {
  id: string;
  deal_id: string;
  status: string;
  commitment_amount: number;
  spv_id: string | null;
  deal: {
    title: string;
    company_name: string;
  };
}

interface SPV {
  id: string;
  name: string;
  target_amount: number;
  carry_percentage: number;
}

interface InvestmentCommitment {
  id: string;
  status: string;
  amount: number;
  payment_reference?: string;
  wire_instructions?: string;
}

export default function InvestmentCommitment() {
  const { interestId } = useParams<{ interestId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [interest, setInterest] = useState<DealInterest | null>(null);
  const [spv, setSpv] = useState<SPV | null>(null);
  const [commitment, setCommitment] = useState<InvestmentCommitment | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [confirmTerms, setConfirmTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
        .select('*, deal:deal_id(title, company_name)')
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

      // Fetch SPV details if available
      if (interestData.spv_id) {
        const { data: spvData } = await supabase
          .from('spvs')
          .select('*')
          .eq('id', interestData.spv_id)
          .single();

        if (spvData) {
          setSpv(spvData);
        }
      }

      // Check for existing commitment
      const { data: commitmentData } = await supabase
        .from('investment_commitments')
        .select('*')
        .eq('interest_id', interestId)
        .single();

      if (commitmentData) {
        setCommitment(commitmentData);
      }

    } catch (err) {
      console.error('Error checking access:', err);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!confirmTerms) {
      setError('You must confirm your commitment before submitting');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Create commitment record
      const { error: insertError } = await supabase
        .from('investment_commitments')
        .insert({
          interest_id: interestId,
          investor_id: session.user.id,
          spv_id: interest?.spv_id,
          amount: interest?.commitment_amount,
          status: 'pending_payment',
        });

      if (insertError) {
        setError('Failed to submit commitment');
        return;
      }

      setSuccess(true);
      
      // Refresh commitment data
      setTimeout(() => {
        checkAccess();
      }, 1000);

    } catch (err) {
      setError('An error occurred while submitting');
    } finally {
      setSubmitting(false);
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
            Your interest has not yet been accepted. Please wait for approval before proceeding with commitment.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If commitment already exists, show status
  if (commitment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Investment Commitment</h1>
              <p className="text-muted-foreground">
                {interest?.deal.company_name} - {interest?.deal.title}
              </p>
            </div>

            {commitment.status === 'pending_payment' && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">Status: Pending Payment</p>
                    <p>Your commitment has been submitted. Please complete the payment to finalize your investment.</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {commitment.status === 'paid' && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold text-green-800">Status: Paid</p>
                    <p className="text-green-700">Your payment has been confirmed.</p>
                    {commitment.payment_reference && (
                      <p className="text-sm text-green-600">
                        Payment Reference: {commitment.payment_reference}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Investment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Commitment Amount:</span>
                    <span className="font-semibold">{formatCurrency(commitment.amount)}</span>
                  </div>
                  {spv && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">SPV:</span>
                        <span>{spv.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Carry:</span>
                        <span>{spv.carry_percentage}%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {commitment.status === 'pending_payment' && commitment.wire_instructions && (
                <div>
                  <h3 className="font-semibold mb-2">Wire Transfer Instructions</h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-line">
                    {commitment.wire_instructions}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button onClick={() => navigate('/investor/pipeline')}>
                Back to Pipeline
              </Button>
              {commitment.status === 'pending_payment' && (
                <Button variant="outline" onClick={() => window.print()}>
                  <FileText className="h-4 w-4 mr-2" />
                  Print Instructions
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Show commitment form
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Investment Commitment</h1>
            <p className="text-muted-foreground">
              {interest?.deal.company_name} - {interest?.deal.title}
            </p>
          </div>

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Commitment submitted successfully! You will receive payment instructions shortly.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {spv && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-blue-900">{spv.name}</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Target Amount:</span>
                      <span className="ml-2 font-semibold">{formatCurrency(spv.target_amount)}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Carry:</span>
                      <span className="ml-2 font-semibold">{spv.carry_percentage}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold">Commitment Summary</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Investment Amount:</span>
                <span className="text-2xl font-bold">
                  {interest && formatCurrency(interest.commitment_amount)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                This commitment is legally binding once submitted.
              </div>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Important Terms & Conditions</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>This is a legally binding commitment to invest</li>
                  <li>Funds must be transferred within 15 business days</li>
                  <li>Investment is subject to SPV formation and legal documentation</li>
                  <li>Commitment may be subject to carried interest terms</li>
                  <li>This is an illiquid investment with long-term holding period</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="confirm"
              checked={confirmTerms}
              onCheckedChange={(checked) => setConfirmTerms(checked as boolean)}
            />
            <label
              htmlFor="confirm"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I confirm my commitment to invest and agree to the terms and conditions
            </label>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleSubmit}
              disabled={!confirmTerms || submitting}
              className="flex-1"
            >
              {submitting ? 'Submitting...' : 'Submit Commitment'}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/investor/pipeline')}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

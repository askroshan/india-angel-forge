import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  UserPlus, 
  Mail,
  Trash2,
  Users
} from 'lucide-react';

interface SPV {
  id: string;
  name: string;
  deal_id: string;
  lead_investor_id: string;
  target_amount: number;
  carry_percentage: number;
}

interface SPVMember {
  id: string;
  spv_id: string;
  investor_id: string;
  commitment_amount: number;
  status: string;
  investor: {
    email: string;
    full_name: string;
  };
}

interface Invitation {
  email: string;
  allocation: string;
}

export default function InviteCoInvestors() {
  const { spvId } = useParams<{ spvId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [spv, setSPV] = useState<SPV | null>(null);
  const [members, setMembers] = useState<SPVMember[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [allocation, setAllocation] = useState('');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [spvId]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Fetch SPV
      const { data: spvData, error: spvError } = await supabase
        .from('spvs')
        .select('*')
        .eq('id', spvId)
        .single();

      if (spvError || !spvData) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      setSPV(spvData);

      // Check if user is lead investor
      if (spvData.lead_investor_id !== session.user.id) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      setHasAccess(true);

      // Fetch existing members
      const { data: membersData } = await supabase
        .from('spv_members')
        .select(`
          *,
          investor:investor_id(email, full_name)
        `)
        .eq('spv_id', spvId);

      if (membersData) {
        setMembers(membersData as any);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddInvestor = () => {
    setEmailError(null);

    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // Check for duplicates
    if (invitations.some(inv => inv.email.toLowerCase() === email.toLowerCase())) {
      setEmailError('This investor has already been added');
      return;
    }

    setInvitations([...invitations, { email: email.trim(), allocation: allocation || '1000000' }]);
    setEmail('');
    setAllocation('');
  };

  const handleRemoveInvestor = (index: number) => {
    setInvitations(invitations.filter((_, i) => i !== index));
  };

  const handleUpdateAllocation = (index: number, value: string) => {
    const updated = [...invitations];
    updated[index].allocation = value;
    setInvitations(updated);
  };

  const handleSendInvitations = async () => {
    if (invitations.length === 0) {
      setError('Please add at least one investor to invite');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Create invitation records
      const invitationRecords = invitations.map(inv => ({
        spv_id: spvId,
        invited_by: session.user.id,
        investor_email: inv.email,
        suggested_allocation: parseFloat(inv.allocation),
        status: 'pending',
      }));

      const { error: insertError } = await supabase
        .from('spv_invitations')
        .insert(invitationRecords);

      if (insertError) {
        setError('Failed to send invitations. Please try again.');
        return;
      }

      setSuccess(true);
      setInvitations([]);
      
      // Refresh members list after short delay
      setTimeout(() => {
        fetchData();
        setSuccess(false);
      }, 2000);

    } catch (err) {
      setError('An error occurred while sending invitations');
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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
            Only the lead investor can invite co-investors to this SPV.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const totalCommitted = members.reduce((sum, member) => sum + member.commitment_amount, 0);
  const remainingAllocation = spv ? spv.target_amount - totalCommitted : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold mb-2">Invite Co-Investors</h1>
          <p className="text-muted-foreground">{spv?.name}</p>
        </div>

        {/* SPV Overview */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-blue-700 mb-1">Target Amount</p>
              <p className="text-2xl font-bold text-blue-900">
                {spv && formatCurrency(spv.target_amount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700 mb-1">Committed</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(totalCommitted)}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700 mb-1">Remaining</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(remainingAllocation)}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex justify-between text-sm">
              <span className="text-blue-700">Carry Percentage:</span>
              <span className="font-semibold text-blue-900">{spv?.carry_percentage}%</span>
            </div>
          </div>
        </Card>

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Invitations sent successfully! Invited investors will receive email notifications.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Invitation Form */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Investors
          </h2>
          
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Investor Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(null);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddInvestor();
                    }
                  }}
                  placeholder="investor@example.com"
                  className={emailError ? 'border-red-500' : ''}
                />
                {emailError && (
                  <p className="text-sm text-red-600">{emailError}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="allocation">Allocation Amount (₹)</Label>
                <Input
                  id="allocation"
                  type="number"
                  value={allocation}
                  onChange={(e) => setAllocation(e.target.value)}
                  placeholder="1000000"
                />
              </div>
            </div>

            <Button onClick={handleAddInvestor} variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Investor
            </Button>
          </div>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground">
                Pending Invitations ({invitations.length})
              </h3>
              {invitations.map((inv, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium">{inv.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Label htmlFor={`allocation-${index}`} className="text-xs text-muted-foreground">
                        Allocation:
                      </Label>
                      <Input
                        id={`allocation-${index}`}
                        type="number"
                        value={inv.allocation}
                        onChange={(e) => handleUpdateAllocation(index, e.target.value)}
                        className="w-32 h-7 text-sm"
                      />
                      <span className="text-xs text-muted-foreground">
                        ({formatCurrency(parseFloat(inv.allocation) || 0)})
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveInvestor(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}

              <Button
                onClick={handleSendInvitations}
                disabled={submitting}
                className="w-full"
              >
                {submitting ? 'Sending...' : `Send ${invitations.length} Invitation${invitations.length > 1 ? 's' : ''}`}
              </Button>
            </div>
          )}
        </Card>

        {/* Current Members */}
        {members.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              SPV Members ({members.length})
            </h2>
            
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{member.investor.full_name || member.investor.email}</p>
                    <p className="text-sm text-muted-foreground">{member.investor.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(member.commitment_amount)}</p>
                    {getStatusBadge(member.status)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate(`/investor/spv/${spvId}`)}>
            Back to SPV Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

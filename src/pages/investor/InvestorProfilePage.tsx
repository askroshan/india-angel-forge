/**
 * InvestorProfilePage — US-INV-112 through US-INV-118
 *
 * Covers India-specific compliance fields:
 *   US-INV-112: InvestorProfile model management
 *   US-INV-113: SEBI category & accreditation status
 *   US-INV-114: DPIIT verification flag
 *   US-INV-115: FEMA/RBI applicability flag
 *   US-INV-116: TDS (deducted YTD display)
 *   US-INV-117: eSign reference
 *   US-INV-118: Nominee details
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, AlertCircle, FileText, Shield, IndianRupee, User } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useToast } from '@/hooks/use-toast';

interface InvestorProfile {
  id: string;
  userId: string;
  sebiCategory: string | null;
  accreditationStatus: string;
  kycStatus: string;
  panNumber: string | null;
  dematAccountNo: string | null;
  nriStatus: boolean;
  femaApplicable: boolean;
  eSignReference: string | null;
  nomineeName: string | null;
  nomineeRelation: string | null;
  investmentThesisUrl: string | null;
  preferredSectors: string[];
  tdsDeductedYtd: string | number;
  createdAt: string;
  updatedAt: string;
}

const SEBI_CATEGORIES = [
  { value: 'CAT_I_AIF', label: 'Category I AIF' },
  { value: 'CAT_II_AIF', label: 'Category II AIF' },
  { value: 'CAT_III_AIF', label: 'Category III AIF' },
  { value: 'ACCREDITED_INVESTOR', label: 'Accredited Investor (≥ ₹7.5 Cr net worth)' },
  { value: 'RETAIL', label: 'Retail Investor' },
];

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  VERIFIED: 'default',
  PENDING: 'secondary',
  REJECTED: 'destructive',
};

export default function InvestorProfilePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: profile, isLoading, error } = useQuery<InvestorProfile>({
    queryKey: ['investor-profile'],
    queryFn: () => apiClient.get<InvestorProfile>('/api/investor/profile'),
  });

  const [form, setForm] = useState<Partial<InvestorProfile> | null>(null);
  const [editing, setEditing] = useState(false);

  const currentData = form ?? profile ?? {};

  const updateMutation = useMutation({
    mutationFn: (data: Partial<InvestorProfile>) =>
      apiClient.patch('/api/investor/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investor-profile'] });
      setEditing(false);
      setForm(null);
      toast({ title: 'Profile Updated', description: 'Your investor profile has been saved.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save profile. Please try again.', variant: 'destructive' });
    },
  });

  const setField = <K extends keyof InvestorProfile>(key: K, value: InvestorProfile[K]) => {
    setForm(prev => ({ ...(prev ?? profile ?? {}), [key]: value }));
  };

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
          Loading profile…
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to load investor profile.</AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-3xl" data-testid="investor-profile-page">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Investor Profile</h1>
            <p className="text-muted-foreground mt-1">
              SEBI accreditation, KYC status, and India-specific compliance details
            </p>
          </div>
          {!editing ? (
            <Button onClick={() => setEditing(true)} data-testid="edit-profile-btn">
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => { setEditing(false); setForm(null); }}
                variant="outline"
                data-testid="cancel-edit-btn"
              >
                Cancel
              </Button>
              <Button
                onClick={() => form && updateMutation.mutate(form)}
                disabled={updateMutation.isPending}
                data-testid="save-profile-btn"
              >
                {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* US-INV-113: SEBI Accreditation */}
          <Card data-testid="sebi-section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                SEBI Accreditation (US-INV-113)
              </CardTitle>
              <CardDescription>
                Category and accreditation status as per SEBI AIF Regulations 2012
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Accreditation Status</p>
                  <Badge variant={STATUS_VARIANT[profile?.accreditationStatus ?? 'PENDING'] ?? 'secondary'}>
                    {profile?.accreditationStatus ?? 'PENDING'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">KYC Status</p>
                  <Badge variant={STATUS_VARIANT[profile?.kycStatus ?? 'PENDING'] ?? 'secondary'}>
                    {profile?.kycStatus ?? 'PENDING'}
                  </Badge>
                </div>
              </div>
              <div>
                <Label htmlFor="sebi-category">SEBI Category</Label>
                {editing ? (
                  <Select
                    value={(currentData as InvestorProfile).sebiCategory ?? ''}
                    onValueChange={v => setField('sebiCategory', v)}
                  >
                    <SelectTrigger id="sebi-category" data-testid="sebi-category-select">
                      <SelectValue placeholder="Select SEBI category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEBI_CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-1 font-medium" data-testid="sebi-category-display">
                    {SEBI_CATEGORIES.find(c => c.value === profile?.sebiCategory)?.label ?? 'Not set'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* US-INV-114/115: PAN, Demat, NRI, FEMA */}
          <Card data-testid="identity-section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Identity &amp; Regulatory (US-INV-114 / US-INV-115)
              </CardTitle>
              <CardDescription>
                PAN, Demat account, NRI status, and FEMA applicability (RBI compliance)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pan-number">PAN Number</Label>
                  {editing ? (
                    <Input
                      id="pan-number"
                      value={(currentData as InvestorProfile).panNumber ?? ''}
                      onChange={e => setField('panNumber', e.target.value || null)}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      data-testid="pan-input"
                    />
                  ) : (
                    <p className="mt-1 font-medium font-mono" data-testid="pan-display">
                      {profile?.panNumber ?? '—'}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="demat-account">Demat Account No.</Label>
                  {editing ? (
                    <Input
                      id="demat-account"
                      value={(currentData as InvestorProfile).dematAccountNo ?? ''}
                      onChange={e => setField('dematAccountNo', e.target.value || null)}
                      placeholder="IN1234567890123456"
                      data-testid="demat-input"
                    />
                  ) : (
                    <p className="mt-1 font-medium font-mono" data-testid="demat-display">
                      {profile?.dematAccountNo ?? '—'}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <Switch
                    id="nri-status"
                    checked={(currentData as InvestorProfile).nriStatus ?? false}
                    onCheckedChange={v => editing && setField('nriStatus', v)}
                    disabled={!editing}
                    data-testid="nri-switch"
                  />
                  <Label htmlFor="nri-status">NRI Status</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="fema-applicable"
                    checked={(currentData as InvestorProfile).femaApplicable ?? false}
                    onCheckedChange={v => editing && setField('femaApplicable', v)}
                    disabled={!editing}
                    data-testid="fema-switch"
                  />
                  <Label htmlFor="fema-applicable">FEMA Applicable (US-INV-115)</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* US-INV-116: TDS */}
          <Card data-testid="tds-section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5" />
                TDS Details (US-INV-116)
              </CardTitle>
              <CardDescription>
                Tax Deducted at Source deducted on investment returns in current financial year
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-1">TDS Deducted (YTD)</p>
              <p className="text-2xl font-bold" data-testid="tds-display">
                ₹{Number(profile?.tdsDeductedYtd ?? 0).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                TDS certificates can be downloaded from your{' '}
                <a href="/certificates" className="underline">Certificates</a> page.
              </p>
            </CardContent>
          </Card>

          {/* US-INV-117: eSign */}
          <Card data-testid="esign-section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                eSign Reference (US-INV-117)
              </CardTitle>
              <CardDescription>
                Electronic signature token for investment documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="esign-ref">eSign Reference / Token</Label>
                {editing ? (
                  <Input
                    id="esign-ref"
                    value={(currentData as InvestorProfile).eSignReference ?? ''}
                    onChange={e => setField('eSignReference', e.target.value || null)}
                    placeholder="ESAF-XXXX-XXXX"
                    data-testid="esign-input"
                  />
                ) : (
                  <p className="mt-1 font-medium font-mono" data-testid="esign-display">
                    {profile?.eSignReference ?? 'Not configured'}
                  </p>
                )}
                {profile?.eSignReference && (
                  <div className="flex items-center gap-1 mt-2 text-green-700 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    eSign configured — documents will be signed electronically
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* US-INV-118: Nominee */}
          <Card data-testid="nominee-section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Nominee Details (US-INV-118)
              </CardTitle>
              <CardDescription>
                Nominee for your investments in case of death/incapacitation (SEBI mandate)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nominee-name">Nominee Full Name</Label>
                  {editing ? (
                    <Input
                      id="nominee-name"
                      value={(currentData as InvestorProfile).nomineeName ?? ''}
                      onChange={e => setField('nomineeName', e.target.value || null)}
                      placeholder="Full legal name"
                      data-testid="nominee-name-input"
                    />
                  ) : (
                    <p className="mt-1 font-medium" data-testid="nominee-name-display">
                      {profile?.nomineeName ?? '—'}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="nominee-relation">Relationship</Label>
                  {editing ? (
                    <Input
                      id="nominee-relation"
                      value={(currentData as InvestorProfile).nomineeRelation ?? ''}
                      onChange={e => setField('nomineeRelation', e.target.value || null)}
                      placeholder="e.g. Spouse, Child, Parent"
                      data-testid="nominee-relation-input"
                    />
                  ) : (
                    <p className="mt-1 font-medium" data-testid="nominee-relation-display">
                      {profile?.nomineeRelation ?? '—'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

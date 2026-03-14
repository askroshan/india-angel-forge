import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Globe, Building2, AlertTriangle, CheckCircle2, XCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SebiCheck {
  id: string;
  userId: string;
  userName: string;
  aifCategory: string;
  minTicketSizeVerified: boolean;
  accreditedInvestorVerified: boolean;
  createdAt: string;
}

interface FemaScreening {
  id: string;
  userId: string;
  userName: string;
  sector: string;
  fdiCap: number | null;
  status: string;
  rbiApprovalReq: boolean;
  createdAt: string;
}

interface DpiitVerification {
  id: string;
  userId: string;
  userName: string;
  dpiitCertificateNo: string;
  verified: boolean;
  taxBenefitEligible: boolean;
  createdAt: string;
}

interface AmlSummary {
  totalScreened: number;
  flaggedCount: number;
  clearedCount: number;
  pendingCount: number;
  recentFlags: { userId: string; userName: string; reason: string; createdAt: string }[];
}

// ─── SEBI Tab ─────────────────────────────────────────────────────────────────

function SebiTab() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState('');
  const [aifCategory, setAifCategory] = useState('CATEGORY_I');

  const { data: checks = [], isLoading } = useQuery<SebiCheck[]>({
    queryKey: ['sebi-checks'],
    queryFn: () => apiClient.get<SebiCheck[]>('/api/moderator/compliance/sebi'),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { userId: string; aifCategory: string }) =>
      apiClient.post('/api/moderator/compliance/sebi', payload),
    onSuccess: () => {
      toast.success('SEBI check recorded');
      queryClient.invalidateQueries({ queryKey: ['sebi-checks'] });
      setUserId('');
    },
    onError: () => toast.error('Failed to record SEBI check'),
  });

  return (
    <div className="space-y-6" data-testid="compliance-sebi-tab">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            SEBI AIF Compliance Check
          </CardTitle>
          <CardDescription>
            Verify investor compliance with SEBI Alternative Investment Fund (AIF) categories.
            Minimum ticket size ₹1 crore (Cat I/II) or ₹25 lakh (Cat III).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>User ID</Label>
              <Input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID"
                data-testid="sebi-user-id-input"
              />
            </div>
            <div>
              <Label>AIF Category</Label>
              <Select value={aifCategory} onValueChange={setAifCategory}>
                <SelectTrigger data-testid="sebi-category-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CATEGORY_I">Category I</SelectItem>
                  <SelectItem value="CATEGORY_II">Category II</SelectItem>
                  <SelectItem value="CATEGORY_III">Category III</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={() => createMutation.mutate({ userId, aifCategory })}
            disabled={!userId || createMutation.isPending}
            data-testid="sebi-submit-btn"
          >
            <Plus className="h-4 w-4 mr-2" />
            Record Check
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent SEBI Checks</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground text-sm">Loading…</div>
          ) : checks.length === 0 ? (
            <div className="text-muted-foreground text-sm">No checks recorded.</div>
          ) : (
            <div className="space-y-2">
              {checks.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 border rounded" data-testid={`sebi-check-${c.id}`}>
                  <div>
                    <div className="font-medium text-sm">{c.userName}</div>
                    <div className="text-xs text-muted-foreground">{c.aifCategory} · {new Date(c.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={c.minTicketSizeVerified ? 'default' : 'destructive'}>
                      Min Ticket {c.minTicketSizeVerified ? '✓' : '✗'}
                    </Badge>
                    <Badge variant={c.accreditedInvestorVerified ? 'default' : 'destructive'}>
                      Accredited {c.accreditedInvestorVerified ? '✓' : '✗'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── FEMA Tab ─────────────────────────────────────────────────────────────────

const FDI_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  AUTOMATIC: 'default',
  APPROVAL_REQUIRED: 'secondary',
  PROHIBITED: 'destructive',
  UNDER_REVIEW: 'outline',
};

function FemaTab() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState('');
  const [sector, setSector] = useState('');

  const { data: screenings = [], isLoading } = useQuery<FemaScreening[]>({
    queryKey: ['fema-screenings'],
    queryFn: () => apiClient.get<FemaScreening[]>('/api/moderator/compliance/fema'),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { userId: string; sector: string }) =>
      apiClient.post('/api/moderator/compliance/fema', payload),
    onSuccess: () => {
      toast.success('FEMA/FDI screening recorded');
      queryClient.invalidateQueries({ queryKey: ['fema-screenings'] });
      setUserId('');
      setSector('');
    },
    onError: () => toast.error('Failed to record FEMA screening'),
  });

  return (
    <div className="space-y-6" data-testid="compliance-fema-tab">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            FEMA / FDI Screening
          </CardTitle>
          <CardDescription>
            Screen foreign investments per FEMA 1999 and RBI FDI policy. Certain sectors are
            prohibited or require government approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>User ID</Label>
              <Input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID"
                data-testid="fema-user-id-input"
              />
            </div>
            <div>
              <Label>Sector</Label>
              <Input
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="e.g. Defence, Insurance"
                data-testid="fema-sector-input"
              />
            </div>
          </div>
          <Button
            onClick={() => createMutation.mutate({ userId, sector })}
            disabled={!userId || !sector || createMutation.isPending}
            data-testid="fema-submit-btn"
          >
            <Plus className="h-4 w-4 mr-2" />
            Screen Investment
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent FDI Screenings</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground text-sm">Loading…</div>
          ) : screenings.length === 0 ? (
            <div className="text-muted-foreground text-sm">No screenings recorded.</div>
          ) : (
            <div className="space-y-2">
              {screenings.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 border rounded" data-testid={`fema-screening-${s.id}`}>
                  <div>
                    <div className="font-medium text-sm">{s.userName}</div>
                    <div className="text-xs text-muted-foreground">{s.sector} · {new Date(s.createdAt).toLocaleDateString()}</div>
                    {s.fdiCap !== null && (
                      <div className="text-xs text-muted-foreground">FDI Cap: {s.fdiCap}%</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={FDI_STATUS_VARIANT[s.status] ?? 'outline'}>{s.status.replace(/_/g, ' ')}</Badge>
                    {s.rbiApprovalReq && <Badge variant="secondary">RBI Approval Required</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── DPIIT Tab ────────────────────────────────────────────────────────────────

function DpiitTab() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState('');
  const [certNo, setCertNo] = useState('');

  const { data: verifications = [], isLoading } = useQuery<DpiitVerification[]>({
    queryKey: ['dpiit-verifications'],
    queryFn: () => apiClient.get<DpiitVerification[]>('/api/moderator/compliance/dpiit'),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { userId: string; dpiitCertificateNo: string }) =>
      apiClient.post('/api/moderator/compliance/dpiit', payload),
    onSuccess: () => {
      toast.success('DPIIT verification recorded');
      queryClient.invalidateQueries({ queryKey: ['dpiit-verifications'] });
      setUserId('');
      setCertNo('');
    },
    onError: () => toast.error('Failed to record DPIIT verification'),
  });

  return (
    <div className="space-y-6" data-testid="compliance-dpiit-tab">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            DPIIT Startup Verification
          </CardTitle>
          <CardDescription>
            Verify DPIIT startup recognition certificates under the Startup India scheme.
            DPIIT-recognized startups qualify for Section 80-IAC tax benefits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>User ID</Label>
              <Input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID"
                data-testid="dpiit-user-id-input"
              />
            </div>
            <div>
              <Label>DPIIT Certificate No.</Label>
              <Input
                value={certNo}
                onChange={(e) => setCertNo(e.target.value)}
                placeholder="e.g. DIPP12345"
                data-testid="dpiit-cert-input"
              />
            </div>
          </div>
          <Button
            onClick={() => createMutation.mutate({ userId, dpiitCertificateNo: certNo })}
            disabled={!userId || !certNo || createMutation.isPending}
            data-testid="dpiit-submit-btn"
          >
            <Plus className="h-4 w-4 mr-2" />
            Record Verification
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent DPIIT Verifications</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground text-sm">Loading…</div>
          ) : verifications.length === 0 ? (
            <div className="text-muted-foreground text-sm">No verifications recorded.</div>
          ) : (
            <div className="space-y-2">
              {verifications.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 border rounded" data-testid={`dpiit-verification-${v.id}`}>
                  <div>
                    <div className="font-medium text-sm">{v.userName}</div>
                    <div className="text-xs text-muted-foreground">{v.dpiitCertificateNo} · {new Date(v.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={v.verified ? 'default' : 'destructive'}>
                      {v.verified ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                      {v.verified ? 'Verified' : 'Unverified'}
                    </Badge>
                    {v.taxBenefitEligible && <Badge variant="secondary">80-IAC Eligible</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── AML Tab ──────────────────────────────────────────────────────────────────

function AmlTab() {
  const { data, isLoading, error } = useQuery<AmlSummary>({
    queryKey: ['aml-summary'],
    queryFn: () => apiClient.get<AmlSummary>('/api/moderator/compliance/aml-summary'),
  });

  if (isLoading) {
    return <div className="text-muted-foreground text-sm" data-testid="compliance-aml-tab">Loading AML summary…</div>;
  }

  if (error || !data) {
    return (
      <Alert data-testid="compliance-aml-tab">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Failed to load AML summary.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6" data-testid="compliance-aml-tab">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            AML Screening Summary
          </CardTitle>
          <CardDescription>
            Anti-Money Laundering screening results for all platform users.
            Compliant with PMLA 2002 and RBI KYC Master Directions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded">
              <div className="text-2xl font-bold">{data.totalScreened}</div>
              <div className="text-sm text-muted-foreground">Total Screened</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-700">{data.clearedCount}</div>
              <div className="text-sm text-muted-foreground">Cleared</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded">
              <div className="text-2xl font-bold text-yellow-700">{data.pendingCount}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded">
              <div className="text-2xl font-bold text-red-700">{data.flaggedCount}</div>
              <div className="text-sm text-muted-foreground">Flagged</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {data.recentFlags.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent AML Flags</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recentFlags.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium text-sm">{f.userName}</div>
                    <div className="text-xs text-muted-foreground">{f.reason}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(f.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function ComplianceDashboard() {
  return (
    <div className="p-6 space-y-6" data-testid="compliance-dashboard-page">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          India Regulatory Compliance
        </h1>
        <p className="text-muted-foreground mt-1">
          SEBI AIF, FEMA/FDI, DPIIT startup recognition, and AML screening
        </p>
      </div>

      <Tabs defaultValue="sebi" data-testid="compliance-tabs">
        <TabsList>
          <TabsTrigger value="sebi" data-testid="compliance-tab-sebi">SEBI AIF</TabsTrigger>
          <TabsTrigger value="fema" data-testid="compliance-tab-fema">FEMA / FDI</TabsTrigger>
          <TabsTrigger value="dpiit" data-testid="compliance-tab-dpiit">DPIIT</TabsTrigger>
          <TabsTrigger value="aml" data-testid="compliance-tab-aml">AML</TabsTrigger>
        </TabsList>

        <TabsContent value="sebi" className="mt-4">
          <SebiTab />
        </TabsContent>
        <TabsContent value="fema" className="mt-4">
          <FemaTab />
        </TabsContent>
        <TabsContent value="dpiit" className="mt-4">
          <DpiitTab />
        </TabsContent>
        <TabsContent value="aml" className="mt-4">
          <AmlTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

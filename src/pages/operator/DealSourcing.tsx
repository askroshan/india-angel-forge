import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Building2, CheckCircle, Clock, XCircle, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface DealReferral {
  id: string;
  userId: string;
  companyName: string;
  sector: string;
  stage: string;
  description: string;
  contactName: string;
  contactEmail: string;
  website?: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<DealReferral['status'], { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ReactNode }> = {
  SUBMITTED: { label: 'Submitted', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  UNDER_REVIEW: { label: 'Under Review', variant: 'default', icon: <Eye className="h-3 w-3" /> },
  ACCEPTED: { label: 'Accepted', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
  REJECTED: { label: 'Rejected', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
};

const SECTOR_OPTIONS = [
  'AI/ML', 'FinTech', 'HealthTech', 'EdTech', 'SaaS', 'CleanTech',
  'AgriTech', 'DeepTech', 'Consumer', 'Logistics', 'Enterprise', 'Other',
];

const STAGE_OPTIONS = [
  { value: 'pre_seed', label: 'Pre-Seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series_a', label: 'Series A' },
  { value: 'series_b', label: 'Series B' },
  { value: 'growth', label: 'Growth' },
];

const INITIAL_FORM = {
  companyName: '',
  sector: '',
  stage: '',
  description: '',
  contactName: '',
  contactEmail: '',
  website: '',
};

export default function DealSourcing() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<typeof INITIAL_FORM>>({});

  const { data: referrals = [], isLoading } = useQuery<DealReferral[]>({
    queryKey: ['deal-referrals'],
    queryFn: () => apiClient.get<DealReferral[]>('/api/operator/deal-referrals'),
    enabled: !!user,
  });

  const submitMutation = useMutation({
    mutationFn: (data: typeof INITIAL_FORM) =>
      apiClient.post<DealReferral>('/api/operator/deal-referrals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-referrals'] });
      queryClient.invalidateQueries({ queryKey: ['operator-performance'] });
      setForm(INITIAL_FORM);
      setOpen(false);
      toast.success('Deal referral submitted successfully!');
    },
    onError: () => {
      toast.error('Failed to submit referral. Please try again.');
    },
  });

  const validate = () => {
    const newErrors: Partial<typeof INITIAL_FORM> = {};
    if (!form.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!form.sector) newErrors.sector = 'Sector is required';
    if (!form.stage) newErrors.stage = 'Stage is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (!form.contactName.trim()) newErrors.contactName = 'Contact name is required';
    if (!form.contactEmail.trim()) newErrors.contactEmail = 'Contact email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      newErrors.contactEmail = 'Enter a valid email';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    submitMutation.mutate(form);
  };

  const stats = {
    total: referrals.length,
    accepted: referrals.filter(r => r.status === 'ACCEPTED').length,
    pending: referrals.filter(r => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length,
  };

  return (
    <div className="space-y-6" data-testid="deal-sourcing-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deal Sourcing</h1>
          <p className="text-muted-foreground mt-1">
            Refer startups from your network to the India Angel Forum
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="submit-referral-button">
              <Plus className="h-4 w-4 mr-2" />
              Submit Referral
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[540px]">
            <DialogHeader>
              <DialogTitle>Submit Deal Referral</DialogTitle>
              <DialogDescription>
                Refer a startup from your network to the India Angel Forum for review.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="referral-form">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    data-testid="company-name-input"
                    value={form.companyName}
                    onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                    placeholder="e.g. TechStartup Pvt. Ltd."
                  />
                  {errors.companyName && <p className="text-xs text-destructive">{errors.companyName}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="sector">Sector *</Label>
                  <Select value={form.sector} onValueChange={v => setForm(f => ({ ...f, sector: v }))}>
                    <SelectTrigger data-testid="sector-select">
                      <SelectValue placeholder="Select sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTOR_OPTIONS.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.sector && <p className="text-xs text-destructive">{errors.sector}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="stage">Stage *</Label>
                  <Select value={form.stage} onValueChange={v => setForm(f => ({ ...f, stage: v }))}>
                    <SelectTrigger data-testid="stage-select">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGE_OPTIONS.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.stage && <p className="text-xs text-destructive">{errors.stage}</p>}
                </div>

                <div className="col-span-2 space-y-1">
                  <Label htmlFor="description">Why This Company? *</Label>
                  <Textarea
                    id="description"
                    data-testid="description-input"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Describe the startup, traction, why you recommend them..."
                    rows={3}
                  />
                  {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="contactName">Founder / Contact Name *</Label>
                  <Input
                    id="contactName"
                    data-testid="contact-name-input"
                    value={form.contactName}
                    onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
                    placeholder="Founder name"
                  />
                  {errors.contactName && <p className="text-xs text-destructive">{errors.contactName}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="contactEmail">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    data-testid="contact-email-input"
                    type="email"
                    value={form.contactEmail}
                    onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                    placeholder="founder@startup.com"
                  />
                  {errors.contactEmail && <p className="text-xs text-destructive">{errors.contactEmail}</p>}
                </div>

                <div className="col-span-2 space-y-1">
                  <Label htmlFor="website">Website (optional)</Label>
                  <Input
                    id="website"
                    data-testid="website-input"
                    value={form.website}
                    onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                    placeholder="https://startup.com"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  data-testid="submit-referral-confirm-button"
                >
                  {submitMutation.isPending ? 'Submitting...' : 'Submit Referral'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4" data-testid="referral-stats">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold" data-testid="stat-total-referrals">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Referrals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600" data-testid="stat-pending-referrals">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Under Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600" data-testid="stat-accepted-referrals">{stats.accepted}</div>
            <p className="text-xs text-muted-foreground mt-1">Accepted</p>
          </CardContent>
        </Card>
      </div>

      {/* Referrals list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            My Referrals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : referrals.length === 0 ? (
            <Alert data-testid="no-referrals-message">
              <AlertDescription>
                You haven't submitted any referrals yet. Use the "Submit Referral" button to refer a startup from your network.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4" data-testid="referrals-list">
              {referrals.map(referral => {
                const config = STATUS_CONFIG[referral.status];
                return (
                  <div
                    key={referral.id}
                    className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 border rounded-lg"
                    data-testid="referral-item"
                    data-referral-id={referral.id}
                  >
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold" data-testid="referral-company-name">
                          {referral.companyName}
                        </h4>
                        <Badge variant={config.variant} className="flex items-center gap-1 text-xs" data-testid="referral-status-badge">
                          {config.icon}
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex gap-3 text-sm text-muted-foreground">
                        <span>{referral.sector}</span>
                        <span>·</span>
                        <span>{STAGE_OPTIONS.find(s => s.value === referral.stage)?.label || referral.stage}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{referral.description}</p>
                      {referral.adminNotes && (
                        <p className="text-sm text-blue-600 italic" data-testid="referral-admin-notes">
                          Forum notes: {referral.adminNotes}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(parseISO(referral.createdAt), 'MMM d, yyyy')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle, Shield, XCircle } from 'lucide-react';

/**
 * AML Screening data structure
 */
interface AMLScreening {
  id: string;
  investor_id: string;
  screening_status: 'pending' | 'in_progress' | 'completed' | 'flagged' | 'cleared';
  risk_score: number | null;
  screening_date: string | null;
  flagged_items: string[];
  pep_match: boolean;
  sanctions_match: boolean;
  adverse_media: boolean;
  notes?: string;
  created_at: string;
  investor: {
    id: string;
    full_name: string;
    email: string;
  };
}

/**
 * Status badge configuration
 */
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface StatusConfig {
  variant: BadgeVariant;
  icon: React.ComponentType<{ className?: string }> | null;
  text: string;
}

const STATUS_CONFIGS: Record<string, StatusConfig> = {
  pending: { variant: 'secondary', icon: null, text: 'Pending' },
  in_progress: { variant: 'default', icon: null, text: 'In Progress' },
  completed: { variant: 'default', icon: CheckCircle, text: 'Completed' },
  flagged: { variant: 'destructive', icon: AlertTriangle, text: 'Flagged' },
  cleared: { variant: 'default', icon: Shield, text: 'Cleared' }
};

const RISK_SCORE_THRESHOLD = 70;

/**
 * Renders a status badge with appropriate styling and icon
 */
const StatusBadge = ({ status }: { status: string }) => {
  const config = STATUS_CONFIGS[status] || STATUS_CONFIGS.pending;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant}>
      {Icon && <Icon className="w-3 h-3 mr-1" />}
      {config.text}
    </Badge>
  );
};

/**
 * Renders a risk score badge with color coding
 */
const RiskScoreBadge = ({ score }: { score: number | null }) => {
  if (score === null) return null;
  
  return (
    <Badge variant={score > RISK_SCORE_THRESHOLD ? 'destructive' : 'default'}>
      Risk: {score}
    </Badge>
  );
};

/**
 * AML Screening Dashboard Component
 * 
 * Allows compliance officers to:
 * - View pending AML screenings
 * - Initiate screening for investors
 * - Flag suspicious activities
 * - Clear investors after review
 * - Filter screenings by status
 */
export default function AMLScreening() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Dialog state
  const [selectedScreening, setSelectedScreening] = useState<AMLScreening | null>(null);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  // Form state
  const [flagReason, setFlagReason] = useState('');
  const [clearNotes, setClearNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch AML screenings
  const { data: screenings = [], isLoading, error } = useQuery({
    queryKey: ['aml-screenings'],
    queryFn: async () => await apiClient.get<AMLScreening[]>('/api/compliance/aml'),
    enabled: !!user
  });

  // Initiate screening mutation
  const initiateScreening = useMutation({
    mutationFn: async (screeningId: string) => {
      return await apiClient.post(`/api/compliance/aml/${screeningId}/initiate`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aml-screenings'] });
      toast.success('Screening completed successfully');
    },
    onError: () => {
      toast.error('Failed to initiate screening');
    }
  });

  // Flag screening mutation
  const flagScreening = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return await apiClient.patch(`/api/compliance/aml/${id}/flag`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aml-screenings'] });
      setFlagDialogOpen(false);
      setFlagReason('');
      toast.success('Screening flagged successfully');
    },
    onError: () => {
      toast.error('Failed to flag screening');
    }
  });

  // Clear screening mutation
  const clearScreening = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      return await apiClient.patch(`/api/compliance/aml/${id}/clear`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aml-screenings'] });
      setClearDialogOpen(false);
      setClearNotes('');
      toast.success('Investor cleared successfully');
    },
    onError: () => {
      toast.error('Failed to clear investor');
    }
  });

  const handleInitiateScreening = (screening: AMLScreening) => {
    initiateScreening.mutate(screening.id);
  };

  const handleFlagClick = (screening: AMLScreening) => {
    setSelectedScreening(screening);
    setFlagDialogOpen(true);
  };

  const handleClearClick = (screening: AMLScreening) => {
    setSelectedScreening(screening);
    setClearDialogOpen(true);
  };

  const handleViewDetails = (screening: AMLScreening) => {
    setSelectedScreening(screening);
    setDetailsDialogOpen(true);
  };

  const handleFlagSubmit = () => {
    if (selectedScreening && flagReason.trim()) {
      flagScreening.mutate({ id: selectedScreening.id, reason: flagReason });
    }
  };

  const handleClearSubmit = () => {
    if (selectedScreening && clearNotes.trim()) {
      clearScreening.mutate({ id: selectedScreening.id, notes: clearNotes });
    }
  };

  // Filter screenings by status
  const filteredScreenings = screenings.filter(screening => {
    if (statusFilter === 'all') return true;
    return screening.screening_status === statusFilter;
  });

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <XCircle className="w-12 h-12 mx-auto mb-4" />
              <p>Error loading AML screenings</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AML Screening Dashboard</h1>
        <p className="text-muted-foreground">
          Anti-Money Laundering screening and monitoring for all investors
        </p>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <Label htmlFor="status-filter">Filter by Status</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger id="status-filter" className="w-[200px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
            <SelectItem value="cleared">Cleared</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Screenings List */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Loading screenings...</p>
          </CardContent>
        </Card>
      ) : filteredScreenings.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No AML screenings found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredScreenings.map((screening) => (
            <Card key={screening.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{screening.investor.full_name}</CardTitle>
                    <CardDescription>{screening.investor.email}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={screening.screening_status} />
                    <RiskScoreBadge score={screening.risk_score} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {screening.screening_status === 'pending' && (
                    <Button
                      onClick={() => handleInitiateScreening(screening)}
                      disabled={initiateScreening.isPending}
                    >
                      Initiate Screening
                    </Button>
                  )}
                  {(screening.screening_status === 'completed' || screening.screening_status === 'flagged') && (
                    <>
                      <Button variant="outline" onClick={() => handleViewDetails(screening)}>
                        View Details
                      </Button>
                      {screening.screening_status === 'completed' && (
                        <Button
                          variant="destructive"
                          onClick={() => handleFlagClick(screening)}
                        >
                          Flag
                        </Button>
                      )}
                      {screening.screening_status === 'flagged' && (
                        <Button
                          variant="default"
                          onClick={() => handleClearClick(screening)}
                        >
                          Clear
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AML Screening Details</DialogTitle>
            <DialogDescription>
              Detailed screening results for {selectedScreening?.investor.full_name}
            </DialogDescription>
          </DialogHeader>
          {selectedScreening && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>PEP Match</Label>
                  <p className="font-medium">{selectedScreening.pep_match ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <Label>Sanctions Match</Label>
                  <p className="font-medium">{selectedScreening.sanctions_match ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <Label>Adverse Media</Label>
                  <p className="font-medium">{selectedScreening.adverse_media ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <Label>Risk Score</Label>
                  <p className="font-medium">{selectedScreening.risk_score || 'N/A'}</p>
                </div>
              </div>
              {selectedScreening.flagged_items && selectedScreening.flagged_items.length > 0 && (
                <div>
                  <Label>Flagged Items</Label>
                  <ul className="list-disc list-inside mt-2">
                    {selectedScreening.flagged_items.map((item, index) => (
                      <li key={index} className="text-sm">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedScreening.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm mt-1">{selectedScreening.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Flag Dialog */}
      <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag Suspicious Activity</DialogTitle>
            <DialogDescription>
              Provide details about the suspicious activity detected
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="flag-reason">Reason</Label>
              <Textarea
                id="flag-reason"
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Describe the suspicious activity..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlagDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleFlagSubmit}
              disabled={!flagReason.trim() || flagScreening.isPending}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Dialog */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Investor</DialogTitle>
            <DialogDescription>
              Provide notes explaining why this investor is being cleared
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="clear-notes">Review Notes</Label>
              <Textarea
                id="clear-notes"
                value={clearNotes}
                onChange={(e) => setClearNotes(e.target.value)}
                placeholder="Explain why this investor is being cleared..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleClearSubmit}
              disabled={!clearNotes.trim() || clearScreening.isPending}
            >
              Clear Investor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

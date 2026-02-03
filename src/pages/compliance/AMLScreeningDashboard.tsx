/**
 * US-COMPLIANCE-002: Perform AML Screening
 * 
 * As a: Compliance Officer
 * I want to: Screen investors against AML databases
 * So that: We comply with anti-money laundering regulations
 * 
 * Acceptance Criteria:
 * - View investors requiring AML screening
 * - Initiate automated screening check
 * - Review screening results and match scores
 * - Flag suspicious activity with reasons
 * - Clear investors after review
 * 
 * Priority: Critical
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Shield, AlertTriangle, CheckCircle, Search, Play } from 'lucide-react';

interface AMLScreening {
  id: string;
  investorId: string;
  investorName?: string;
  investorEmail?: string;
  screeningDate: string;
  screeningStatus: 'pending' | 'clear' | 'flagged' | 'rejected';
  screeningProvider?: string;
  matchScore?: number;
  screeningResults?: Record<string, unknown>;
  flaggedReasons?: string[];
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

export default function AMLScreeningDashboard() {
  const [screenings, setScreenings] = useState<AMLScreening[]>([]);
  const [filteredScreenings, setFilteredScreenings] = useState<AMLScreening[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScreening, setSelectedScreening] = useState<AMLScreening | null>(null);
  const [action, setAction] = useState<'clear' | 'flag' | null>(null);
  const [notes, setNotes] = useState('');
  const [flagReasons, setFlagReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token } = useAuth();

  const FLAG_REASONS = [
    'Politically Exposed Person (PEP)',
    'Adverse Media Coverage',
    'Sanctions List Match',
    'High-Risk Country',
    'Criminal Record',
    'Fraudulent Activity History',
  ];

  useEffect(() => {
    checkAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!accessDenied) {
      fetchScreenings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessDenied]);

  useEffect(() => {
    filterScreenings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenings, filterStatus, searchQuery]);

  const checkAccess = async () => {
    if (!token) {
      navigate('/auth');
      return;
    }

    // Check access by attempting to fetch screenings
    const response = await fetch('/api/compliance/aml-screening', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 403 || response.status === 401) {
      setAccessDenied(true);
    }
  };

  const fetchScreenings = async () => {
    try {
      setLoading(true);
      
      if (!token) return;

      const response = await fetch('/api/compliance/aml-screening', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to load AML screenings');
      }

      const data = await response.json();
      setScreenings(data || []);
    } catch (error) {
      const err = error as { message?: string };
      toast({
        title: 'Error',
        description: err.message || 'Failed to load AML screenings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterScreenings = () => {
    let filtered = [...screenings];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(s => s.screeningStatus === filterStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.investorName?.toLowerCase().includes(query) ||
        s.investorEmail?.toLowerCase().includes(query)
      );
    }

    setFilteredScreenings(filtered);
  };

  const initiateScreening = async (investorId: string) => {
    try {
      // In production, this would call external AML API
      const mockScreeningResult = {
        provider: 'WorldCheck',
        match_score: Math.random() * 100,
        matches: [],
        risk_level: 'low',
      };

      await apiClient.post('/api/compliance/aml-screening', {
        investor_id: investorId,
        screening_status: mockScreeningResult.match_score > 70 ? 'flagged' : 'clear',
        screening_provider: mockScreeningResult.provider,
        match_score: mockScreeningResult.match_score,
        screening_results: mockScreeningResult,
      });

      toast({
        title: 'Screening Initiated',
        description: 'AML screening has been completed',
      });

      fetchScreenings();
    } catch (error) {
      const err = error as { message?: string };
      toast({
        title: 'Error',
        description: err.message || 'Failed to initiate screening',
        variant: 'destructive',
      });
    }
  };

  const handleOpenAction = (screening: AMLScreening, actionType: 'clear' | 'flag') => {
    setSelectedScreening(screening);
    setAction(actionType);
    setNotes('');
    setFlagReasons([]);
    setCustomReason('');
  };

  const handleCloseDialog = () => {
    setSelectedScreening(null);
    setAction(null);
    setNotes('');
    setFlagReasons([]);
    setCustomReason('');
  };

  const handleSubmitAction = async () => {
    if (!selectedScreening) return;

    if (action === 'flag' && flagReasons.length === 0 && !customReason) {
      toast({
        title: 'Error',
        description: 'Please select at least one flag reason',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (!token) throw new Error('Not authenticated');

      const allReasons = [...flagReasons, customReason].filter(Boolean);

      const response = await fetch(`/api/compliance/aml-screening/${selectedScreening.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: action === 'clear' ? 'clear' : 'flagged',
          flaggedReasons: action === 'flag' ? allReasons : undefined,
          notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update screening');
      }

      toast({
        title: 'Success',
        description: `Investor ${action === 'clear' ? 'cleared' : 'flagged'} successfully`,
      });

      handleCloseDialog();
      fetchScreenings();
    } catch (error) {
      const err = error as { message?: string };
      toast({
        title: 'Error',
        description: err.message || 'Failed to update screening',
        variant: 'destructive',
      });
    }
  };

  if (accessDenied) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have permission to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AML Screening Dashboard</h1>
        <p className="text-muted-foreground">
          Screen investors against anti-money laundering databases
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search Investor</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="clear">Clear</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilterStatus('all');
                  setSearchQuery('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Screenings List */}
      {loading ? (
        <div className="text-center py-8">Loading screenings...</div>
      ) : filteredScreenings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No screenings found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredScreenings.map((screening) => (
            <Card key={screening.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Shield className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold">{screening.investorName || 'Unknown'}</h3>
                      <p className="text-sm text-muted-foreground">{screening.investorEmail}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={
                          screening.screeningStatus === 'clear' ? 'default' :
                          screening.screeningStatus === 'flagged' ? 'destructive' :
                          screening.screeningStatus === 'rejected' ? 'destructive' : 'secondary'
                        }>
                          {screening.screeningStatus}
                        </Badge>
                        {screening.matchScore !== null && (
                          <span className="text-sm text-muted-foreground">
                            Match Score: {screening.matchScore?.toFixed(1)}%
                          </span>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {new Date(screening.screeningDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {screening.screeningStatus === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleOpenAction(screening, 'clear')}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Clear
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleOpenAction(screening, 'flag')}
                        >
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Flag
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {screening.flaggedReasons && screening.flaggedReasons.length > 0 && (
                  <div className="mt-4 p-3 bg-destructive/10 rounded-md">
                    <p className="text-sm font-medium mb-2">Flagged Reasons:</p>
                    <ul className="text-sm list-disc list-inside">
                      {screening.flaggedReasons.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={action !== null} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'clear' ? 'Clear AML Screening' : 'Flag Investor'}
            </DialogTitle>
            <DialogDescription>
              {action === 'clear' 
                ? 'Confirm that this investor has passed AML screening.'
                : 'Select reasons for flagging this investor.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {action === 'flag' && (
              <div>
                <Label>Flag Reasons</Label>
                {FLAG_REASONS.map((reason) => (
                  <div key={reason} className="flex items-center space-x-2 mt-2">
                    <input
                      type="checkbox"
                      id={reason}
                      checked={flagReasons.includes(reason)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFlagReasons([...flagReasons, reason]);
                        } else {
                          setFlagReasons(flagReasons.filter(r => r !== reason));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={reason} className="font-normal cursor-pointer">
                      {reason}
                    </Label>
                  </div>
                ))}
                <Input
                  placeholder="Other reason..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="mt-3"
                />
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notes {action === 'clear' && '(Optional)'}</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitAction}
              variant={action === 'flag' ? 'destructive' : 'default'}
            >
              {action === 'clear' ? 'Confirm Clear' : 'Submit Flag'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

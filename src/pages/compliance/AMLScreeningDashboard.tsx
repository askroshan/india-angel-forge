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
import { supabase } from '@/integrations/supabase/client';
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
  investor_id: string;
  investor_name?: string;
  investor_email?: string;
  screening_date: string;
  screening_status: 'pending' | 'clear' | 'flagged' | 'rejected';
  screening_provider?: string;
  match_score?: number;
  screening_results?: any;
  flagged_reasons?: string[];
  reviewed_by?: string;
  reviewed_at?: string;
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
  }, []);

  useEffect(() => {
    if (!accessDenied) {
      fetchScreenings();
    }
  }, [accessDenied]);

  useEffect(() => {
    filterScreenings();
  }, [screenings, filterStatus, searchQuery]);

  const checkAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (!roleData || !['admin', 'compliance_officer'].includes(roleData.role)) {
      setAccessDenied(true);
    }
  };

  const fetchScreenings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('aml_screening')
        .select(`
          *,
          investor:investor_applications(
            full_name,
            email
          )
        `)
        .order('screening_date', { ascending: false });

      if (error) throw error;

      const screeningsWithInvestor = data.map(s => ({
        ...s,
        investor_name: s.investor?.full_name,
        investor_email: s.investor?.email,
      }));

      setScreenings(screeningsWithInvestor);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load AML screenings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterScreenings = () => {
    let filtered = [...screenings];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(s => s.screening_status === filterStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.investor_name?.toLowerCase().includes(query) ||
        s.investor_email?.toLowerCase().includes(query)
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

      const { error } = await supabase
        .from('aml_screening')
        .insert({
          investor_id: investorId,
          screening_status: mockScreeningResult.match_score > 70 ? 'flagged' : 'clear',
          screening_provider: mockScreeningResult.provider,
          match_score: mockScreeningResult.match_score,
          screening_results: mockScreeningResult,
        });

      if (error) throw error;

      toast({
        title: 'Screening Initiated',
        description: 'AML screening has been completed',
      });

      fetchScreenings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate screening',
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const allReasons = [...flagReasons, customReason].filter(Boolean);

      const updateData: any = {
        screening_status: action === 'clear' ? 'clear' : 'flagged',
        reviewed_at: new Date().toISOString(),
        reviewed_by: session.user.id,
        notes,
      };

      if (action === 'flag') {
        updateData.flagged_reasons = allReasons;
      }

      const { error: updateError } = await supabase
        .from('aml_screening')
        .update(updateData)
        .eq('id', selectedScreening.id);

      if (updateError) throw updateError;

      // Log audit trail
      await supabase.from('audit_logs').insert({
        user_id: session.user.id,
        action: action === 'clear' ? 'aml_cleared' : 'aml_flagged',
        entity_type: 'aml_screening',
        entity_id: selectedScreening.id,
        details: {
          investor_id: selectedScreening.investor_id,
          reasons: action === 'flag' ? allReasons : null,
          notes,
        },
      });

      toast({
        title: 'Success',
        description: `Investor ${action === 'clear' ? 'cleared' : 'flagged'} successfully`,
      });

      handleCloseDialog();
      fetchScreenings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update screening',
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
                      <h3 className="font-semibold">{screening.investor_name || 'Unknown'}</h3>
                      <p className="text-sm text-muted-foreground">{screening.investor_email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={
                          screening.screening_status === 'clear' ? 'default' :
                          screening.screening_status === 'flagged' ? 'destructive' :
                          screening.screening_status === 'rejected' ? 'destructive' : 'secondary'
                        }>
                          {screening.screening_status}
                        </Badge>
                        {screening.match_score !== null && (
                          <span className="text-sm text-muted-foreground">
                            Match Score: {screening.match_score?.toFixed(1)}%
                          </span>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {new Date(screening.screening_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {screening.screening_status === 'pending' && (
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

                {screening.flagged_reasons && screening.flagged_reasons.length > 0 && (
                  <div className="mt-4 p-3 bg-destructive/10 rounded-md">
                    <p className="text-sm font-medium mb-2">Flagged Reasons:</p>
                    <ul className="text-sm list-disc list-inside">
                      {screening.flagged_reasons.map((reason, idx) => (
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

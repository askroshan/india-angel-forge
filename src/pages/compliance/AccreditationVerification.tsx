/**
 * US-COMPLIANCE-003: Verify Accredited Investor Status
 * 
 * Compliance officer dashboard for verifying investor accreditation status.
 * Supports income-based and net-worth-based verification with expiry tracking.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, AlertTriangle, Calendar } from 'lucide-react';

interface AccreditationRecord {
  id: string;
  investorId: string;
  verificationType: 'income_based' | 'net_worth_based' | 'professional_certification';
  status: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;
  verifiedAt?: string;
  expiryDate?: string;
  rejectionReason?: string;
  documents: any;
  investorName: string;
  investorEmail: string;
}

const AccreditationVerification = () => {
  const [accreditations, setAccreditations] = useState<AccreditationRecord[]>([]);
  const [filteredAccreditations, setFilteredAccreditations] = useState<AccreditationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccreditation, setSelectedAccreditation] = useState<AccreditationRecord | null>(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token } = useAuth();

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    filterAccreditations();
  }, [accreditations, statusFilter, searchQuery]);

  const checkAccess = async () => {
    if (!token) {
      navigate('/auth');
      return;
    }

    // Check access by attempting to fetch accreditations
    const response = await fetch('/api/compliance/accreditation', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 403 || response.status === 401) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access this page.',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    fetchAccreditations();
  };

  const fetchAccreditations = async () => {
    try {
      setLoading(true);
      
      if (!token) return;

      const response = await fetch('/api/compliance/accreditation/all', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to load accreditations');
      }

      const data = await response.json();
      setAccreditations(data || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error',
        description: 'Failed to load accreditations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAccreditations = () => {
    let filtered = [...accreditations];

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'expiring_soon') {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        filtered = filtered.filter(acc => {
          if (!acc.expiryDate || acc.status !== 'verified') return false;
          const expiryDate = new Date(acc.expiryDate);
          const today = new Date();
          return expiryDate > today && expiryDate <= thirtyDaysFromNow;
        });
      } else if (statusFilter === 'expired') {
        filtered = filtered.filter(acc => {
          if (!acc.expiryDate) return false;
          return new Date(acc.expiryDate) < new Date();
        });
      } else {
        filtered = filtered.filter(acc => acc.status === statusFilter);
      }
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(acc =>
        acc.investorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.investorEmail?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredAccreditations(filtered);
  };

  const handleVerify = async () => {
    if (!selectedAccreditation) return;

    if (!expiryDate) {
      toast({
        title: 'Error',
        description: 'Expiry date is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (!token) throw new Error('No authentication');

      const response = await fetch(`/api/compliance/accreditation/${selectedAccreditation.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'verified',
          expiryDate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to verify accreditation');
      }

      toast({
        title: 'Success',
        description: 'Investor accreditation verified successfully',
      });

      setVerifyDialogOpen(false);
      setSelectedAccreditation(null);
      setExpiryDate('');
      fetchAccreditations();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!selectedAccreditation || !rejectionReason) return;

    try {
      if (!token) throw new Error('No authentication');

      const response = await fetch(`/api/compliance/accreditation/${selectedAccreditation.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'rejected',
          rejectionReason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject accreditation');
      }

      toast({
        title: 'Accreditation Rejected',
        description: 'Investor has been notified',
      });

      setRejectDialogOpen(false);
      setSelectedAccreditation(null);
      setRejectionReason('');
      fetchAccreditations();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (accreditation: AccreditationRecord) => {
    // Check if expired
    if (accreditation.expiryDate) {
      const expiryDate = new Date(accreditation.expiryDate);
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      if (expiryDate < today) {
        return <Badge variant="destructive">Expired</Badge>;
      }

      if (expiryDate <= thirtyDaysFromNow) {
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Expiring Soon</Badge>;
      }
    }

    switch (accreditation.status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return null;
    }
  };

  const stats = {
    total: accreditations.length,
    verified: accreditations.filter(a => a.status === 'verified' && (!a.expiryDate || new Date(a.expiryDate) > new Date())).length,
    pending: accreditations.filter(a => a.status === 'pending').length,
    expiringSoon: accreditations.filter(a => {
      if (!a.expiryDate || a.status !== 'verified') return false;
      const expiryDate = new Date(a.expiryDate);
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return expiryDate > today && expiryDate <= thirtyDaysFromNow;
    }).length,
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p>Loading accreditations...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Accreditation Verification</h1>
        <p className="text-muted-foreground">
          Verify and manage investor accreditation status
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Accreditations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expiringSoon}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search investors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]" aria-label="Status Filter">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Accreditation List */}
      <div className="space-y-4">
        {filteredAccreditations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No accreditations found
            </CardContent>
          </Card>
        ) : (
          filteredAccreditations.map((accreditation) => (
            <Card key={accreditation.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {accreditation.investorName}
                      </h3>
                      {getStatusBadge(accreditation)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {accreditation.investorEmail}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="capitalize">
                        {accreditation.verificationType.replace(/_/g, ' ')}
                      </span>
                      {accreditation.expiryDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Expires: {new Date(accreditation.expiryDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {accreditation.rejectionReason && (
                      <p className="mt-2 text-sm text-red-600">
                        Rejection Reason: {accreditation.rejectionReason}
                      </p>
                    )}
                  </div>
                  
                  {accreditation.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedAccreditation(accreditation);
                          setVerifyDialogOpen(true);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedAccreditation(accreditation);
                          setRejectDialogOpen(true);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Accreditation</DialogTitle>
            <DialogDescription>
              Set the expiry date for this accreditation. Typically 1 year from verification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="expiry-date">Expiry Date *</Label>
              <Input
                id="expiry-date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerify}>Confirm Verification</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Accreditation</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Reason for Rejection *</Label>
              <Input
                id="rejection-reason"
                placeholder="e.g., Insufficient documentation, Income below threshold"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccreditationVerification;

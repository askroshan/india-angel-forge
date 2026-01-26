/**
 * Compliance Officer KYC Review Dashboard
 * 
 * Allows compliance officers to:
 * - View pending KYC document submissions
 * - Review and verify documents
 * - Reject documents with reasons
 * - Track verification status
 * 
 * Part of US-COMPLIANCE-001
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Check, X, Filter, Search } from 'lucide-react';

interface KYCDocument {
  id: string;
  investorId: string;
  investorName?: string;
  investorEmail?: string;
  documentType: 'pan' | 'aadhaar' | 'bank_statement' | 'income_proof';
  filePath: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  uploadedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

type DocumentAction = 'verify' | 'reject' | null;

export default function KYCReviewDashboard() {
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<KYCDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<KYCDocument | null>(null);
  const [action, setAction] = useState<DocumentAction>(null);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token } = useAuth();

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (!accessDenied) {
      fetchDocuments();
    }
  }, [accessDenied]);

  useEffect(() => {
    filterDocuments();
  }, [documents, filterStatus, filterType, searchQuery]);

  const checkAccess = async () => {
    if (!token) {
      navigate('/auth');
      return;
    }

    // Check access by attempting to fetch documents
    const response = await fetch('/api/compliance/kyc-review', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 403 || response.status === 401) {
      setAccessDenied(true);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      if (!token) return;

      const response = await fetch('/api/compliance/kyc-review', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to load KYC documents');
      }

      const data = await response.json();
      setDocuments(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load KYC documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = [...documents];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(doc => doc.verificationStatus === filterStatus);
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(doc => doc.documentType === filterType);
    }

    // Search by investor name or email
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.investorName?.toLowerCase().includes(query) ||
        doc.investorEmail?.toLowerCase().includes(query)
      );
    }

    setFilteredDocs(filtered);
  };

  const handleViewDocument = async (doc: KYCDocument) => {
    try {
      window.open(`/uploads/${doc.filePath}`, '_blank');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load document',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadDocument = async (doc: KYCDocument) => {
    try {
      window.open(`/uploads/${doc.filePath}`, '_blank');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to download document',
        variant: 'destructive',
      });
    }
  };

  const handleOpenAction = (doc: KYCDocument, actionType: 'verify' | 'reject') => {
    setSelectedDoc(doc);
    setAction(actionType);
    setNotes('');
    setRejectionReason('');
  };

  const handleCloseDialog = () => {
    setSelectedDoc(null);
    setAction(null);
    setNotes('');
    setRejectionReason('');
  };

  const handleSubmitAction = async () => {
    if (!selectedDoc) return;

    if (action === 'reject' && !rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Rejection reason is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/compliance/kyc-review/${selectedDoc.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: action === 'verify' ? 'verified' : 'rejected',
          rejectionReason: action === 'reject' ? rejectionReason : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update document');
      }

      toast({
        title: 'Success',
        description: `Document ${action === 'verify' ? 'verified' : 'rejected'} successfully`,
      });

      handleCloseDialog();
      fetchDocuments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update document',
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
            <CardDescription>
              You do not have permission to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">KYC Document Review</h1>
        <p className="text-muted-foreground">
          Review and verify investor KYC documents for compliance
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type">Document Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pan">PAN Card</SelectItem>
                  <SelectItem value="aadhaar">Aadhaar</SelectItem>
                  <SelectItem value="bank_statement">Bank Statement</SelectItem>
                  <SelectItem value="income_proof">Income Proof</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilterStatus('all');
                  setFilterType('all');
                  setSearchQuery('');
                }}
              >
                <Filter className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {loading ? (
        <div className="text-center py-8">Loading documents...</div>
      ) : filteredDocs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No documents found matching your filters
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDocs.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold">{doc.investorName || 'Unknown'}</h3>
                      <p className="text-sm text-muted-foreground">{doc.investorEmail}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={
                          doc.verificationStatus === 'verified' ? 'default' :
                          doc.verificationStatus === 'rejected' ? 'destructive' : 'secondary'
                        }>
                          {doc.verificationStatus}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {doc.documentType.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDocument(doc)}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadDocument(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {doc.verificationStatus === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleOpenAction(doc, 'verify')}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Verify
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleOpenAction(doc, 'reject')}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {doc.rejectionReason && (
                  <div className="mt-4 p-3 bg-destructive/10 rounded-md">
                    <p className="text-sm font-medium">Rejection Reason:</p>
                    <p className="text-sm">{doc.rejectionReason}</p>
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
              {action === 'verify' ? 'Verify Document' : 'Reject Document'}
            </DialogTitle>
            <DialogDescription>
              {action === 'verify' 
                ? 'Confirm that you have verified this document and it meets all requirements.'
                : 'Provide a reason for rejecting this document. The investor will be notified.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {action === 'verify' ? (
              <div>
                <Label htmlFor="notes">Verification Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about the verification..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="reason">Rejection Reason *</Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why this document is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitAction}
              variant={action === 'reject' ? 'destructive' : 'default'}
            >
              {action === 'verify' ? 'Confirm Verification' : 'Submit Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

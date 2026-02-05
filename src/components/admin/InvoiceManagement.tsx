import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, RefreshCw, AlertCircle, CheckCircle2, ExternalLink, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface FailedInvoice {
  jobId: string;
  paymentId: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  attempts: number;
  lastError: string;
  failedAt: string;
}

interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
}

interface CleanupStats {
  invoices: {
    total: number;
    retentionYears: number;
  };
  archives: {
    total: number;
    retentionYears: number;
    directory: string;
  };
  diskSpace: {
    free: string;
    total: string;
    usedPercent: string;
    threshold: string;
    status: 'ok' | 'critical';
  };
}

export function InvoiceManagement() {
  const queryClient = useQueryClient();
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [batchRetryDialogOpen, setBatchRetryDialogOpen] = useState(false);

  // Fetch failed invoices
  const { data: failedInvoices = [], isLoading: loadingInvoices, error: invoicesError } = useQuery({
    queryKey: ['admin-failed-invoices'],
    queryFn: async () => {
      const response = await apiClient.get<{ failedInvoices: FailedInvoice[] }>('/api/admin/invoices/failed');
      return response.failedInvoices;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch queue metrics
  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['admin-queue-metrics'],
    queryFn: async () => {
      const response = await apiClient.get<{ metrics: QueueMetrics }>('/api/admin/invoices/queue-metrics');
      return response.metrics;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch cleanup stats
  const { data: cleanupStats, isLoading: loadingStats } = useQuery({
    queryKey: ['admin-cleanup-stats'],
    queryFn: async () => {
      const response = await apiClient.get<{ stats: CleanupStats }>('/api/admin/invoices/cleanup-stats');
      return response.stats;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Retry single invoice mutation
  const retryInvoice = useMutation({
    mutationFn: async (paymentId: string) => {
      return await apiClient.post(`/api/admin/invoices/${paymentId}/retry`, {});
    },
    onSuccess: () => {
      toast.success('Invoice generation queued for retry');
      queryClient.invalidateQueries({ queryKey: ['admin-failed-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['admin-queue-metrics'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to retry invoice generation');
    },
  });

  // Batch retry mutation
  const batchRetry = useMutation({
    mutationFn: async (paymentIds: string[]) => {
      return await apiClient.post('/api/admin/invoices/retry-batch', { paymentIds });
    },
    onSuccess: (response: any) => {
      toast.success(`Queued ${response.retried} invoices for retry`);
      if (response.failed > 0) {
        toast.warning(`${response.failed} invoices failed to queue`);
      }
      setSelectedInvoices([]);
      setBatchRetryDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-failed-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['admin-queue-metrics'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to batch retry invoices');
    },
  });

  const handleRetry = (paymentId: string) => {
    retryInvoice.mutate(paymentId);
  };

  const handleBatchRetry = () => {
    if (selectedInvoices.length === 0) {
      toast.error('Please select at least one invoice');
      return;
    }
    if (selectedInvoices.length > 50) {
      toast.error('Maximum 50 invoices can be retried at once');
      return;
    }
    setBatchRetryDialogOpen(true);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(failedInvoices.map(inv => inv.paymentId));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectInvoice = (paymentId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoices([...selectedInvoices, paymentId]);
    } else {
      setSelectedInvoices(selectedInvoices.filter(id => id !== paymentId));
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const truncateError = (error: string, maxLength: number = 60) => {
    if (!error) return 'Unknown error';
    if (error.length <= maxLength) return error;
    return error.substring(0, maxLength) + '...';
  };

  if (loadingInvoices || loadingMetrics || loadingStats) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Loading invoice management...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invoicesError) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to load invoice data. Please try again.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Invoice Management</h1>
        <p className="text-muted-foreground">
          Monitor invoice generation queue and retry failed jobs
        </p>
      </div>

      {/* Queue Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Waiting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.waiting || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics?.active || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics?.completed || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics?.failed || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Delayed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics?.delayed || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Cleanup Stats */}
      {cleanupStats && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <CardTitle>System Statistics</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Invoices</p>
                <p className="text-2xl font-bold">{cleanupStats.invoices.total}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Retention: {cleanupStats.invoices.retentionYears} years
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Archive Files</p>
                <p className="text-2xl font-bold">{cleanupStats.archives.total}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Retention: {cleanupStats.archives.retentionYears} years
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Disk Space</p>
                <p className={`text-2xl font-bold ${cleanupStats.diskSpace.status === 'critical' ? 'text-red-600' : 'text-green-600'}`}>
                  {cleanupStats.diskSpace.free}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {cleanupStats.diskSpace.usedPercent} used of {cleanupStats.diskSpace.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queue Dashboard Link */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Bull Board Queue Dashboard</h3>
              <p className="text-sm text-muted-foreground">
                View detailed queue status, job logs, and real-time processing
              </p>
            </div>
            <Button asChild variant="outline">
              <a href="/admin/queues" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Dashboard
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Failed Invoices Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Failed Invoice Generations
              </CardTitle>
              <CardDescription>
                Invoices that failed after {failedInvoices[0]?.attempts || 3} retry attempts
              </CardDescription>
            </div>
            {selectedInvoices.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedInvoices.length} selected
                </span>
                <Button
                  onClick={handleBatchRetry}
                  disabled={batchRetry.isPending}
                  size="sm"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Selected
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {failedInvoices.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Failed Invoices</h3>
              <p className="text-muted-foreground">
                All invoice generations are completing successfully
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedInvoices.length === failedInvoices.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Failed At</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failedInvoices.map((invoice) => (
                  <TableRow key={invoice.jobId}>
                    <TableCell>
                      <Checkbox
                        checked={selectedInvoices.includes(invoice.paymentId)}
                        onCheckedChange={(checked) => 
                          handleSelectInvoice(invoice.paymentId, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{invoice.userName}</div>
                      <div className="text-sm text-muted-foreground">{invoice.userEmail}</div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatAmount(invoice.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">{invoice.attempts}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(invoice.failedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-red-600 font-mono max-w-md" title={invoice.lastError}>
                        {truncateError(invoice.lastError)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetry(invoice.paymentId)}
                        disabled={retryInvoice.isPending}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Batch Retry Confirmation Dialog */}
      <AlertDialog open={batchRetryDialogOpen} onOpenChange={setBatchRetryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Batch Retry</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to retry {selectedInvoices.length} failed invoice generation{selectedInvoices.length > 1 ? 's' : ''}. 
              Each will be added to the queue with 3 retry attempts. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => batchRetry.mutate(selectedInvoices)}
              disabled={batchRetry.isPending}
            >
              {batchRetry.isPending ? 'Retrying...' : 'Confirm Retry'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Wrap with error boundary for production
export default function InvoiceManagementWithErrorBoundary() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to error tracking service
        console.error('Invoice Management Error:', error, errorInfo);
      }}
    >
      <InvoiceManagement />
    </ErrorBoundary>
  );
}

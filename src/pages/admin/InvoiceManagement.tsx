/**
 * US-ADMIN-CRUD-002: Invoice Management
 * 
 * As an: Admin
 * I want to: View failed invoices, retry generation, and monitor queue health
 * So that: I can ensure all invoices are properly generated
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react';

interface FailedInvoice {
  id: string;
  paymentId: string;
  userId: string;
  error: string;
  attempts: number;
  lastAttemptAt: string;
  payment: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    user: { email: string; fullName: string };
  };
}

interface QueueMetrics {
  pendingJobs: number;
  failedJobs: number;
  completedJobs: number;
  activeJobs: number;
}

export default function InvoiceManagement() {
  const [failedInvoices, setFailedInvoices] = useState<FailedInvoice[]>([]);
  const [queueMetrics, setQueueMetrics] = useState<QueueMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      const [failedRes, metricsRes] = await Promise.all([
        fetch('/api/admin/invoices/failed', { headers }),
        fetch('/api/admin/invoices/queue-metrics', { headers }),
      ]);

      if (!failedRes.ok) throw new Error('Failed to load invoices');

      const failedData = await failedRes.json();
      setFailedInvoices(failedData || []);

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setQueueMetrics(metricsData);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load invoice data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (paymentId: string) => {
    try {
      setRetrying(paymentId);
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/admin/invoices/${paymentId}/retry`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to retry invoice');
      }

      toast({
        title: 'Success',
        description: 'Invoice retry queued successfully',
      });

      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to retry invoice',
        variant: 'destructive',
      });
    } finally {
      setRetrying(null);
    }
  };

  const handleRetryAll = async () => {
    try {
      if (!token) throw new Error('Not authenticated');

      const paymentIds = failedInvoices.map(inv => inv.paymentId);

      const response = await fetch('/api/admin/invoices/retry-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to retry invoices');
      }

      toast({
        title: 'Success',
        description: `Batch retry queued for ${paymentIds.length} invoices`,
      });

      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to batch retry',
        variant: 'destructive',
      });
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Invoice Management</h1>
        <p className="text-muted-foreground">
          Monitor and manage invoice generation across the platform
        </p>
      </div>

      {/* Queue Metrics */}
      {queueMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" /> Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{queueMetrics.pendingJobs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" /> Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{queueMetrics.activeJobs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" /> Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{queueMetrics.failedJobs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" /> Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{queueMetrics.completedJobs}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Failed Invoices Section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Failed Invoices</h2>
        {failedInvoices.length > 0 && (
          <Button onClick={handleRetryAll} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry All Failed
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">Loading invoices...</div>
      ) : failedInvoices.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <p className="text-lg font-medium">No failed invoices</p>
            <p className="text-muted-foreground">All invoices have been generated successfully.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {failedInvoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">
                        {invoice.payment.user.fullName || invoice.payment.user.email}
                      </h3>
                      <Badge variant="destructive">Failed</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{invoice.payment.user.email}</p>
                    <p className="text-sm mt-1">
                      Amount: <span className="font-medium">{formatAmount(invoice.payment.amount)}</span>
                    </p>
                    <p className="text-sm text-destructive mt-1">
                      Error: {invoice.error}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {invoice.attempts} attempt{invoice.attempts !== 1 ? 's' : ''} · Last attempt:{' '}
                      {new Date(invoice.lastAttemptAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRetry(invoice.paymentId)}
                    disabled={retrying === invoice.paymentId}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${retrying === invoice.paymentId ? 'animate-spin' : ''}`} />
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

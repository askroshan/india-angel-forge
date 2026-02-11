/**
 * Transaction History Page Component
 * 
 * Displays paginated transaction history with filters, search, sort, and export
 * 
 * Features:
 * - Pagination (20 per page)
 * - Filters: date range, type, status, gateway, amount range
 * - Search by transaction ID or description
 * - Sort by date or amount (asc/desc)
 * - Export to CSV or PDF
 * 
 * @component
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Search, Filter, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  gateway: string;
  status: string;
  type: string;
  description: string | null;
  refundAmount: number | null;
  refundReason: string | null;
  refundedAt: string | null;
  createdAt: string;
  completedAt: string | null;
  invoice: {
    id: string;
    invoiceNumber: string;
  } | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface Filters {
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  status?: string;
  gateway?: string;
  amountMin?: string;
  amountMax?: string;
  search?: string;
  sortBy: 'date' | 'amount';
  sortOrder: 'asc' | 'desc';
}

export default function TransactionHistory() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  
  const [filters, setFilters] = useState<Filters>({
    sortBy: 'date',
    sortOrder: 'desc',
  });
  
  const [page, setPage] = useState(1);

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });
      
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.gateway) params.append('gateway', filters.gateway);
      if (filters.amountMin) params.append('amountMin', filters.amountMin);
      if (filters.amountMax) params.append('amountMax', filters.amountMax);
      if (filters.search) params.append('search', filters.search);
      
      const response = await fetch(`/api/payments/history?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.data.transactions);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (token) {
      fetchTransactions();
    }
  }, [page, filters.sortBy, filters.sortOrder, token]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Apply filters
  const applyFilters = () => {
    setPage(1);
    fetchTransactions();
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      sortBy: 'date',
      sortOrder: 'desc',
    });
    setPage(1);
  };

  // Export to CSV
  const exportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.gateway) params.append('gateway', filters.gateway);
      if (filters.search) params.append('search', filters.search);
      
      const response = await fetch(`/api/payments/history/export/csv?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setExporting(false);
    }
  };

  // Export to PDF
  const exportPDF = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.gateway) params.append('gateway', filters.gateway);
      
      const response = await fetch(`/api/payments/history/export/pdf?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setExporting(false);
    }
  };

  // Format amount in Indian notation
  const formatAmount = (amount: number, currency: string = 'INR') => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      FAILED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const hasActiveFilters = !!(
    filters.dateFrom || filters.dateTo || filters.type || 
    filters.status || filters.gateway || filters.amountMin || 
    filters.amountMax || filters.search
  );

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="transaction-history">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Transaction History</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                data-testid="filter-button"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
                disabled={exporting}
                data-testid="export-csv"
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportPDF}
                disabled={exporting}
                data-testid="export-pdf"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters Section */}
          {showFilters && (
            <div className="mb-6 p-4 border rounded-lg space-y-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium mb-1">From Date</label>
                  <Input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    data-testid="date-from"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">To Date</label>
                  <Input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    data-testid="date-to"
                  />
                </div>
                
                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <Select value={filters.type || ''} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                    <SelectTrigger data-testid="filter-type">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DEAL_COMMITMENT" data-testid="type-deal">Deal Commitment</SelectItem>
                      <SelectItem value="MEMBERSHIP_FEE" data-testid="type-membership">Membership Fee</SelectItem>
                      <SelectItem value="EVENT_REGISTRATION" data-testid="type-event">Event Registration</SelectItem>
                      <SelectItem value="SUBSCRIPTION" data-testid="type-subscription">Subscription</SelectItem>
                      <SelectItem value="OTHER" data-testid="type-other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Select value={filters.status || ''} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                    <SelectTrigger data-testid="filter-status">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING" data-testid="status-pending">Pending</SelectItem>
                      <SelectItem value="COMPLETED" data-testid="status-completed">Completed</SelectItem>
                      <SelectItem value="FAILED" data-testid="status-failed">Failed</SelectItem>
                      <SelectItem value="REFUNDED" data-testid="status-refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Gateway Filter */}
                <div>
                  <label className="block text-sm font-medium mb-1">Gateway</label>
                  <Select value={filters.gateway || ''} onValueChange={(value) => setFilters({ ...filters, gateway: value })}>
                    <SelectTrigger data-testid="filter-gateway">
                      <SelectValue placeholder="All Gateways" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RAZORPAY" data-testid="gateway-razorpay">Razorpay</SelectItem>
                      <SelectItem value="STRIPE" data-testid="gateway-stripe">Stripe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Amount Range */}
                <div>
                  <label className="block text-sm font-medium mb-1">Min Amount</label>
                  <Input
                    type="number"
                    placeholder="₹ Minimum"
                    value={filters.amountMin || ''}
                    onChange={(e) => setFilters({ ...filters, amountMin: e.target.value })}
                    data-testid="amount-min"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Amount</label>
                  <Input
                    type="number"
                    placeholder="₹ Maximum"
                    value={filters.amountMax || ''}
                    onChange={(e) => setFilters({ ...filters, amountMax: e.target.value })}
                    data-testid="amount-max"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={applyFilters} data-testid="apply-filters">
                  Apply Filters
                </Button>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} data-testid="clear-filters">
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
              
              {hasActiveFilters && (
                <div data-testid="active-filters" className="text-sm text-gray-600">
                  Active filters applied
                </div>
              )}
            </div>
          )}

          {/* Search and Sort */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by transaction ID or description..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                className="pl-10"
                data-testid="search-transactions"
              />
            </div>
            <Select 
              value={`${filters.sortBy}-${filters.sortOrder}`} 
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split('-') as ['date' | 'amount', 'asc' | 'desc'];
                setFilters({ ...filters, sortBy, sortOrder });
              }}
            >
              <SelectTrigger className="w-48" data-testid="sort-transactions">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc" data-testid="sort-newest">Newest First</SelectItem>
                <SelectItem value="date-asc" data-testid="sort-oldest">Oldest First</SelectItem>
                <SelectItem value="amount-desc" data-testid="sort-amount-high">Amount: High to Low</SelectItem>
                <SelectItem value="amount-asc" data-testid="sort-amount-low">Amount: Low to High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transaction List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500" data-testid="no-transactions">
              No transactions found
            </div>
          ) : (
            <div className="space-y-4" data-testid="transaction-list">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  data-testid="transaction-item"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStatusColor(transaction.status)} data-testid="transaction-status">
                          {transaction.status}
                        </Badge>
                        <span className="text-sm text-gray-600" data-testid="transaction-type">
                          {transaction.type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm text-gray-400" data-testid="transaction-gateway">
                          via {transaction.gateway}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1" data-testid="transaction-description">
                        {transaction.description || 'No description'}
                      </p>
                      <p className="text-xs text-gray-400" data-testid="transaction-id">
                        ID: {transaction.id}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold" data-testid="transaction-amount">
                        {formatAmount(transaction.amount)}
                      </div>
                      <div className="text-xs text-gray-500" data-testid="transaction-date">
                        {new Date(transaction.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-6" data-testid="pagination-controls">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
                {pagination.totalCount} transactions
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={!pagination.hasPreviousPage}
                  data-testid="page-previous"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!pagination.hasNextPage}
                  data-testid="page-next"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

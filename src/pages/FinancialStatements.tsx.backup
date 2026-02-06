import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileText, Download, Mail, Calendar, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FinancialStatement {
  id: number;
  statementNumber: string;
  month: number;
  year: number;
  format: 'SUMMARY' | 'DETAILED';
  totalAmount: number;
  totalTax: number;
  netAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  tds: number;
  pdfUrl: string;
  emailedAt: string | null;
  createdAt: string;
}

/**
 * Financial Statements Page Component
 * 
 * Displays user's financial statements with filters and download options.
 * Admin users can generate new statements.
 * 
 * E2E Tests: FS-E2E-002, FS-E2E-004, FS-E2E-005, FS-E2E-006
 */
export default function FinancialStatements() {
  const [statements, setStatements] = useState<FinancialStatement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterFormat, setFilterFormat] = useState<string>('all');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  useEffect(() => {
    fetchStatements();
  }, [filterYear, filterMonth, filterFormat]);

  const fetchStatements = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filterYear !== 'all') params.append('year', filterYear);
      if (filterMonth !== 'all') params.append('month', filterMonth);
      if (filterFormat !== 'all') params.append('format', filterFormat);

      const response = await fetch(`/api/financial-statements/statements?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch statements');
      }

      const data = await response.json();
      if (data.success) {
        setStatements(data.data);
      }
    } catch (error) {
      console.error('Error fetching statements:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load financial statements. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString('en-IN', { month: 'long' });
  };

  const getFormatBadge = (format: string) => {
    return format === 'DETAILED' ? (
      <Badge variant="default" data-testid={`statement-format-badge`}>Detailed</Badge>
    ) : (
      <Badge variant="secondary" data-testid={`statement-format-badge`}>Summary</Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" data-testid="statements-loader" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="financial-statements">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Financial Statements</h1>
        <p className="text-muted-foreground">
          View and download your monthly financial statements with tax details
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter statements by year, month, or format</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger data-testid="filter-year">
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Month</label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger data-testid="filter-month">
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All months</SelectItem>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Format</label>
              <Select value={filterFormat} onValueChange={setFilterFormat}>
                <SelectTrigger data-testid="filter-format">
                  <SelectValue placeholder="All formats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All formats</SelectItem>
                  <SelectItem value="SUMMARY">Summary</SelectItem>
                  <SelectItem value="DETAILED">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statements List */}
      {statements.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">No statements found</p>
            <p className="text-muted-foreground">
              {filterYear !== 'all' || filterMonth !== 'all' || filterFormat !== 'all'
                ? 'Try adjusting your filters'
                : 'Financial statements will appear here once generated'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {statements.map((statement) => (
            <Card key={statement.id} data-testid={`statement-card-${statement.statementNumber}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg" data-testid={`statement-number-${statement.id}`}>
                      {statement.statementNumber}
                    </CardTitle>
                    <CardDescription data-testid={`statement-period-${statement.id}`}>
                      {getMonthName(statement.month)} {statement.year}
                    </CardDescription>
                  </div>
                  {getFormatBadge(statement.format)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Financial Summary */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Financial Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Amount:</span>
                        <span className="font-medium" data-testid={`statement-amount-${statement.id}`}>
                          {formatAmount(statement.totalAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Tax:</span>
                        <span className="font-medium" data-testid={`statement-tax-${statement.id}`}>
                          {formatAmount(statement.totalTax)}
                        </span>
                      </div>
                      <div className="border-t pt-2 flex justify-between">
                        <span className="font-semibold">Net Amount:</span>
                        <span className="font-semibold" data-testid={`statement-net-${statement.id}`}>
                          {formatAmount(statement.netAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tax Breakdown */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Tax Breakdown
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CGST (9%):</span>
                        <span className="font-medium" data-testid={`statement-cgst-${statement.id}`}>
                          {formatAmount(statement.cgst)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">SGST (9%):</span>
                        <span className="font-medium" data-testid={`statement-sgst-${statement.id}`}>
                          {formatAmount(statement.sgst)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IGST (18%):</span>
                        <span className="font-medium" data-testid={`statement-igst-${statement.id}`}>
                          {formatAmount(statement.igst)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">TDS (1%):</span>
                        <span className="font-medium" data-testid={`statement-tds-${statement.id}`}>
                          {formatAmount(statement.tds)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    onClick={() => window.open(statement.pdfUrl, '_blank')}
                    data-testid={`statement-download-btn-${statement.id}`}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  
                  {statement.emailedAt && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 mr-2" />
                      <span data-testid={`statement-emailed-${statement.id}`}>
                        Emailed on {formatDate(statement.emailedAt)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Generated on {formatDate(statement.createdAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

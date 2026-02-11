import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, Download, Mail, Calendar, TrendingUp, Plus, CheckCircle2, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiClient as api } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';

interface FinancialStatement {
  id: string;
  statementNumber: string;
  month: number;
  year: number;
  dateFrom: Date;
  dateTo: Date;
  format: 'detailed' | 'summary';
  totalInvested: number;
  totalRefunded: number;
  netInvestment: number;
  totalTax: number;
  cgst: number;
  sgst: number;
  igst: number;
  tds: number;
  pdfUrl: string;
  emailedTo: string[];
  emailedAt: string | null;
  generatedAt: string;
  userId: string;
}

/**
 * Financial Statements Page Component
 * 
 * Displays user's financial statements with filters and download options.
 * Allows admins to generate new statements and email them to users.
 * 
 * E2E Tests: FS-E2E-001 to FS-E2E-008
 * - FS-E2E-001: Generate detailed statement
 * - FS-E2E-002: Generate summary statement
 * - FS-E2E-003: View tax breakdown
 * - FS-E2E-004: Email statement
 * - FS-E2E-005: Download PDF
 * - FS-E2E-006: View statement history
 * - FS-E2E-007: Filter statements
 * - FS-E2E-008: Verify Indian formatting
 */

export default function FinancialStatements() {
  const { user } = useAuth();
  const [statements, setStatements] = useState<FinancialStatement[]>([]);
  const [filteredStatements, setFilteredStatements] = useState<FinancialStatement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatement, setSelectedStatement] = useState<FinancialStatement | null>(null);
  
  // Filter states
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterFormat, setFilterFormat] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  
  // Generation modal states
  const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateDateFrom, setGenerateDateFrom] = useState<string>('');
  const [generateDateTo, setGenerateDateTo] = useState<string>('');
  const [generateFormat, setGenerateFormat] = useState<'summary' | 'detailed'>('detailed');
  const [generationProgress, setGenerationProgress] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  
  // Email dialog states
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailTo, setEmailTo] = useState<string>('');
  const [additionalEmail, setAdditionalEmail] = useState<string>('');
  const [isEmailing, setIsEmailing] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

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

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchStatements();
    
    // Set default date range for generation (current financial year)
    const today = new Date();
    const financialYearStart = new Date(today.getFullYear(), 3, 1); // April 1st
    setGenerateDateFrom(financialYearStart.toISOString().split('T')[0]);
    setGenerateDateTo(today.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    applyFilters();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statements, filterYear, filterMonth, filterFormat, filterDateFrom, filterDateTo]);

  const fetchStatements = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<FinancialStatement[]>('/api/financial-statements/statements');
      if (Array.isArray(data)) {
        setStatements(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if (data && (data as any).data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setStatements((data as any).data);
      }
    } catch (error) {
      console.error('Failed to fetch statements:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load financial statements',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...statements];

    // Filter by year
    if (filterYear !== 'all') {
      filtered = filtered.filter((s) => s.year === parseInt(filterYear));
    }

    // Filter by month
    if (filterMonth !== 'all') {
      filtered = filtered.filter((s) => s.month === parseInt(filterMonth));
    }

    // Filter by format
    if (filterFormat !== 'all') {
      filtered = filtered.filter((s) => s.format === filterFormat);
    }

    // Filter by date range
    if (filterDateFrom && filterDateTo) {
      const fromDate = new Date(filterDateFrom);
      const toDate = new Date(filterDateTo);
      filtered = filtered.filter((s) => {
        const statementDate = new Date(s.generatedAt);
        return statementDate >= fromDate && statementDate <= toDate;
      });
    }

    setFilteredStatements(filtered);
  };

  const clearFilters = () => {
    setFilterYear('all');
    setFilterMonth('all');
    setFilterFormat('all');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const hasActiveFilter = filterYear !== 'all' || filterMonth !== 'all' || filterFormat !== 'all' || filterDateFrom || filterDateTo;

  const handleGenerateStatement = async () => {
    if (!user) return;
    
    try {
      setIsGenerating(true);
      setGenerationProgress(true);
      setGenerationSuccess(false);

      const fromDate = new Date(generateDateFrom);
      const toDate = new Date(generateDateTo);
      
      // Use the date range to determine month/year
      const month = toDate.getMonth() + 1;
      const year = toDate.getFullYear();

      const response = await api.post<{ success: boolean; data: FinancialStatement }>('/api/financial-statements/generate', {
        userId: user.id,
        month,
        year,
        format: generateFormat,
      });

      // Handle both { success, data } and { data: { success, data } } response formats
      const success = response.success || (response.data && response.data.success);
      
      if (success) {
        setGenerationSuccess(true);
        toast({
          title: 'Success',
          description: 'Statement generated successfully',
        });
        
        // Refresh statements list
        setTimeout(() => {
          fetchStatements();
          setGenerationProgress(false);
          setIsGenerationModalOpen(false);
          setGenerationSuccess(false);
        }, 2000);
      } else {
        throw new Error('Generation failed');
      }
    } catch (error: unknown) {
      console.error('Failed to generate statement:', error);
      setGenerationProgress(false);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to generate statement'
        : 'Failed to generate statement';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEmailStatement = async (statementId: string) => {
    try {
      setIsEmailing(true);
      setEmailSuccess(false);

      const response = await api.post<{ success: boolean; data: FinancialStatement }>(`/api/financial-statements/statements/${statementId}/email`, undefined);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const success = (response as any).success || (response.data && (response.data as any).success);
      if (success) {
        setEmailSuccess(true);
        toast({
          title: 'Success',
          description: 'Statement emailed successfully',
        });
        
        // Refresh to show emailed timestamp
        setTimeout(() => {
          fetchStatements();
          setIsEmailDialogOpen(false);
          setEmailSuccess(false);
        }, 2000);
      }
    } catch (error: unknown) {
      console.error('Failed to email statement:', error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to email statement'
        : 'Failed to email statement';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsEmailing(false);
    }
  };

  const openEmailDialog = (statement: FinancialStatement) => {
    setSelectedStatement(statement);
    setEmailTo(user?.email || '');
    setAdditionalEmail('');
    setIsEmailDialogOpen(true);
  };

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
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
    return format.toLowerCase() === 'detailed' ? (
      <Badge variant="default" data-testid="statement-format">Detailed</Badge>
    ) : (
      <Badge variant="secondary" data-testid="statement-format">Summary</Badge>
    );
  };

  const downloadPDF = (statement: FinancialStatement) => {
    const link = document.createElement('a');
    link.href = statement.pdfUrl;
    link.download = `${statement.statementNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Financial Statements</h1>
          <p className="text-muted-foreground">
            View and download your financial statements with tax details
          </p>
        </div>
        
        {user?.roles?.includes('admin') && (
          <Dialog open={isGenerationModalOpen} onOpenChange={setIsGenerationModalOpen}>
            <DialogTrigger asChild>
              <Button data-testid="generate-statement">
                <Plus className="h-4 w-4 mr-2" />
                Generate New Statement
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="statement-generation-modal">
              <DialogHeader>
                <DialogTitle>Generate Financial Statement</DialogTitle>
                <DialogDescription>
                  Create a new financial statement for a specific period
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="date-from">Date From</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={generateDateFrom}
                    onChange={(e) => setGenerateDateFrom(e.target.value)}
                    data-testid="statement-date-from"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="date-to">Date To</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={generateDateTo}
                    onChange={(e) => setGenerateDateTo(e.target.value)}
                    data-testid="statement-date-to"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="format">Format</Label>
                  <Select 
                    value={generateFormat} 
                    onValueChange={(value) => setGenerateFormat(value as 'summary' | 'detailed')}
                  >
                    <SelectTrigger id="format" data-testid="statement-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="detailed" data-testid="format-detailed">
                        Detailed - Shows all transactions
                      </SelectItem>
                      <SelectItem value="summary" data-testid="format-summary">
                        Summary - Totals only
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {generationProgress && (
                  <div className="flex items-center justify-center py-4" data-testid="generation-progress">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Generating statement...</span>
                  </div>
                )}

                {generationSuccess && (
                  <div className="flex items-center justify-center py-4 text-green-600" data-testid="generation-success">
                    <CheckCircle2 className="h-6 w-6 mr-2" />
                    <span>Statement generated successfully</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setIsGenerationModalOpen(false)}
                  disabled={isGenerating}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleGenerateStatement} 
                  disabled={isGenerating || !generateDateFrom || !generateDateTo}
                  data-testid="submit-generate"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Statement'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filter Toggle */}
      <div className="mb-4">
        <Button
          variant="outline"
          data-testid="filter-statements"
          onClick={() => {}}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filter Statements
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6" data-testid="statement-filters">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Filter statements by year, month, format, or date range</CardDescription>
            </div>
            {hasActiveFilter && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                data-testid="clear-filter"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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

            <div>
              <label className="text-sm font-medium mb-2 block">From Date</label>
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                data-testid="filter-date-from"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                data-testid="filter-date-to"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              size="sm"
              onClick={applyFilters}
              data-testid="apply-filter"
            >
              Apply Filter
            </Button>
          </div>
          
          {hasActiveFilter && (
            <div className="mt-4">
              <Badge variant="secondary" data-testid="active-filter">
                Active filters applied
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent data-testid="email-dialog">
          <DialogHeader>
            <DialogTitle>Email Financial Statement</DialogTitle>
            <DialogDescription>
              Send this statement to your email address
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email-to">Email To</Label>
              <Input
                id="email-to"
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                data-testid="email-to"
                disabled
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="additional-email">Additional Email (Optional)</Label>
              <Input
                id="additional-email"
                type="email"
                value={additionalEmail}
                onChange={(e) => setAdditionalEmail(e.target.value)}
                placeholder="additional@email.com"
                data-testid="additional-email"
              />
            </div>

            {emailSuccess && (
              <div className="flex items-center justify-center py-4 text-green-600" data-testid="email-success">
                <CheckCircle2 className="h-6 w-6 mr-2" />
                <span>Statement emailed successfully</span>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsEmailDialogOpen(false)}
              disabled={isEmailing}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => selectedStatement && handleEmailStatement(selectedStatement.id)} 
              disabled={isEmailing}
              data-testid="send-email"
            >
              {isEmailing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Statements List */}
      <div data-testid="statement-list">
        {filteredStatements.length === 0 ? (
          <Card data-testid="no-statements">
            <CardContent className="pt-6 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                {hasActiveFilter ? 'No statements found' : 'No financial statements generated yet'}
              </p>
              <p className="text-muted-foreground">
                {hasActiveFilter
                  ? 'Try adjusting your filters'
                  : 'Financial statements will appear here once generated'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredStatements.map((statement) => (
              <Card 
                key={statement.id} 
                data-testid="statement-item"
                onClick={() => setSelectedStatement(statement)}
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg" data-testid="statement-number">
                        {statement.statementNumber}
                      </CardTitle>
                      <CardDescription data-testid="statement-date-range">
                        {getMonthName(statement.month)} {statement.year}
                      </CardDescription>
                    </div>
                    {getFormatBadge(statement.format)}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Summary View */}
                  {statement.format.toLowerCase() === 'summary' && selectedStatement?.id === statement.id && (
                    <div className="mb-6 p-4 bg-muted rounded-lg" data-testid="statement-summary-view">
                      <h4 className="font-semibold mb-3">Summary Totals</h4>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Invested:</span>
                          <span className="font-medium" data-testid="total-invested">
                            {formatAmount(statement.totalInvested)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Refunded:</span>
                          <span className="font-medium" data-testid="total-refunded">
                            ₹0.00
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Net Investment:</span>
                          <span className="font-medium" data-testid="net-investment">
                            {formatAmount(statement.netInvestment)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Tax:</span>
                          <span className="font-medium" data-testid="total-tax">
                            {formatAmount(statement.totalTax)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

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
                          <span className="font-medium" data-testid="statement-amount">
                            {formatAmount(statement.totalInvested)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Tax:</span>
                          <span className="font-medium" data-testid="statement-tax">
                            {formatAmount(statement.totalTax)}
                          </span>
                        </div>
                        <div className="border-t pt-2 flex justify-between">
                          <span className="font-semibold">Net Amount:</span>
                          <span className="font-semibold" data-testid="statement-net">
                            {formatAmount(statement.netInvestment)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tax Breakdown */}
                    <div className="space-y-3" data-testid="tax-breakdown">
                      <h4 className="font-semibold text-sm flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Tax Breakdown
                      </h4>
                      <div className="space-y-2 text-sm">
                        {statement.cgst > 0 && (
                          <div className="flex justify-between" data-testid="tax-cgst">
                            <span className="text-muted-foreground">CGST (9%):</span>
                            <span className="font-medium" data-testid="tax-amount">
                              {formatAmount(statement.cgst)}
                            </span>
                          </div>
                        )}
                        {statement.sgst > 0 && (
                          <div className="flex justify-between" data-testid="tax-sgst">
                            <span className="text-muted-foreground">SGST (9%):</span>
                            <span className="font-medium" data-testid="tax-amount">
                              {formatAmount(statement.sgst)}
                            </span>
                          </div>
                        )}
                        {statement.igst > 0 && (
                          <div className="flex justify-between" data-testid="tax-igst">
                            <span className="text-muted-foreground">IGST (18%):</span>
                            <span className="font-medium" data-testid="tax-amount">
                              {formatAmount(statement.igst)}
                            </span>
                          </div>
                        )}
                        {statement.tds > 0 && (
                          <div className="flex justify-between" data-testid="tax-tds">
                            <span className="text-muted-foreground">TDS (1%):</span>
                            <span className="font-medium" data-testid="tax-amount">
                              {formatAmount(statement.tds)}
                            </span>
                          </div>
                        )}
                        <div className="border-t pt-2 flex justify-between">
                          <span className="font-semibold">Total Tax:</span>
                          <span className="font-semibold" data-testid="total-tax">
                            {formatAmount(statement.totalTax)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadPDF(statement);
                      }}
                      data-testid="download-statement"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    
                    {user?.roles?.includes('admin') && (
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEmailDialog(statement);
                        }}
                        data-testid="email-statement"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Email Statement
                      </Button>
                    )}
                    
                    {statement.emailedAt && (
                      <div 
                        className="flex items-center text-sm text-muted-foreground"
                        data-testid="emailed-indicator"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                        <span data-testid="emailed-at">
                          Emailed on {formatDate(statement.emailedAt)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t text-sm text-muted-foreground" data-testid="statement-generated-at">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Generated on {formatDate(statement.generatedAt)}</span>
                    </div>
                  </div>

                  {/* Statement Details View */}
                  {selectedStatement?.id === statement.id && (
                    <div className="mt-4 pt-4 border-t" data-testid="statement-details">
                      <h4 className="font-semibold mb-3">Statement Details</h4>
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Statement Number:</span>
                          <span className="font-medium">{statement.statementNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Period:</span>
                          <span className="font-medium">{getMonthName(statement.month)} {statement.year}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Format:</span>
                          <span className="font-medium capitalize">{statement.format}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        data-testid="back-to-list"
                        onClick={(e) => { e.stopPropagation(); setSelectedStatement(null); }}
                      >
                        Back to List
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

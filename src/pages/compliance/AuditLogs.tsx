/**
 * US-COMPLIANCE-006: Compliance Audit Logs
 *
 * As a: Compliance Officer
 * I want to: View all compliance-related audit actions
 * So that: I can track KYC, AML, and accreditation decisions with full traceability
 *
 * Acceptance Criteria:
 * - View paginated audit log entries filtered to compliance actions
 * - Filter by action type (KYC / AML / Accreditation)
 * - Search by investor name or email
 * - Export to CSV for regulatory submission
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Search, FileText } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
  source: string;
}

const COMPLIANCE_ACTIONS = [
  'verify_kyc',
  'reject_kyc',
  'initiate_aml_screening',
  'clear_aml_screening',
  'flag_aml_screening',
  'verify_accreditation',
  'reject_accreditation',
];

const ACTION_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  verify_kyc: { label: 'KYC Verified', variant: 'default' },
  reject_kyc: { label: 'KYC Rejected', variant: 'destructive' },
  initiate_aml_screening: { label: 'AML Initiated', variant: 'secondary' },
  clear_aml_screening: { label: 'AML Cleared', variant: 'default' },
  flag_aml_screening: { label: 'AML Flagged', variant: 'destructive' },
  verify_accreditation: { label: 'Accreditation Approved', variant: 'default' },
  reject_accreditation: { label: 'Accreditation Rejected', variant: 'destructive' },
};

export default function ComplianceAuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [filterAction, setFilterAction] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, filterAction, searchQuery]);

  const loadLogs = async () => {
    if (!token) {
      navigate('/auth');
      return;
    }

    try {
      const response = await fetch('/api/compliance/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        setAccessDenied(true);
        return;
      }

      const data = await response.json();
      setLogs(data || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    if (filterAction !== 'all') {
      filtered = filtered.filter(l => l.action === filterAction);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(l =>
        l.userName?.toLowerCase().includes(q) ||
        l.userEmail?.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q)
      );
    }

    setFilteredLogs(filtered);
  };

  const exportCSV = () => {
    const headers = ['Date', 'Action', 'Officer', 'Officer Email', 'Resource', 'Details'];
    const rows = filteredLogs.map(l => [
      new Date(l.createdAt).toISOString(),
      l.action,
      l.userName || '',
      l.userEmail || '',
      l.resourceType || '',
      JSON.stringify(l.details || {}),
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
    <div className="container mx-auto py-8" data-testid="compliance-audit-logs">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Compliance Audit Logs</h1>
            <p className="text-muted-foreground">
              Complete audit trail of all KYC, AML, and accreditation actions
            </p>
          </div>
          <Button variant="outline" onClick={exportCSV} data-testid="export-csv-btn">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold" data-testid="total-logs-count">{logs.length}</div>
            <p className="text-sm text-muted-foreground">Total Compliance Actions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold" data-testid="today-logs-count">
              {logs.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString()).length}
            </div>
            <p className="text-sm text-muted-foreground">Actions Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold" data-testid="week-logs-count">
              {logs.filter(l => {
                const logDate = new Date(l.createdAt);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return logDate >= weekAgo;
              }).length}
            </div>
            <p className="text-sm text-muted-foreground">Actions This Week</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Officer name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="search-audit-logs"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="action-filter">Action Type</Label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger id="action-filter" data-testid="filter-action-type">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {COMPLIANCE_ACTIONS.map(a => (
                    <SelectItem key={a} value={a}>
                      {ACTION_LABELS[a]?.label || a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => { setFilterAction('all'); setSearchQuery(''); }}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Entries */}
      {loading ? (
        <div className="text-center py-8">Loading audit logs...</div>
      ) : filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No audit log entries found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2" data-testid="audit-log-list">
          {filteredLogs.map((log) => {
            const config = ACTION_LABELS[log.action];
            return (
              <Card key={log.id} data-testid={`audit-log-entry-${log.id}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          {config ? (
                            <Badge variant={config.variant}>{config.label}</Badge>
                          ) : (
                            <Badge variant="outline">{log.action}</Badge>
                          )}
                          {log.resourceType && (
                            <span className="text-sm text-muted-foreground">{log.resourceType}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          By: {log.userName || log.userEmail || 'System'} ·{' '}
                          {new Date(log.createdAt).toLocaleString('en-IN')}
                        </p>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {typeof log.details.message === 'string' ? log.details.message : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

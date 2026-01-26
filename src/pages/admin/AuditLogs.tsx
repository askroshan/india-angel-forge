/**
 * US-ADMIN-002: View Audit Logs
 * 
 * Admin dashboard for viewing and filtering system audit logs.
 * Shows all compliance, security, and admin actions with full context.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileCheck, 
  UserCog, 
  AlertCircle, 
  Clock,
  Search,
  Filter,
  Download
} from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: any;
  created_at: string;
  user?: {
    profile: {
      full_name: string;
      email: string;
    };
  };
}

const actionTypeColors: Record<string, string> = {
  verify_kyc: 'bg-green-100 text-green-800',
  reject_kyc: 'bg-red-100 text-red-800',
  verify_accreditation: 'bg-blue-100 text-blue-800',
  reject_accreditation: 'bg-red-100 text-red-800',
  assign_role: 'bg-purple-100 text-purple-800',
  remove_role: 'bg-amber-100 text-amber-800',
  flag_aml: 'bg-red-100 text-red-800',
  clear_aml: 'bg-green-100 text-green-800',
  create_deal: 'bg-blue-100 text-blue-800',
  update_deal: 'bg-indigo-100 text-indigo-800',
  delete_deal: 'bg-red-100 text-red-800',
  approve_application: 'bg-green-100 text-green-800',
  reject_application: 'bg-red-100 text-red-800',
};

const actionTypes = [
  'verify_kyc',
  'reject_kyc',
  'verify_accreditation',
  'reject_accreditation',
  'assign_role',
  'remove_role',
  'flag_aml',
  'clear_aml',
  'create_deal',
  'update_deal',
  'delete_deal',
  'approve_application',
  'reject_application',
];

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 25;
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, actionFilter, searchQuery, startDate, endDate]);

  const checkAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access this page.',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    fetchLogs();
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user:user_id(
            profile:profiles(full_name, email)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(500); // Load last 500 logs

      if (error) throw error;

      setLogs(data || []);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to load audit logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    // Action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(log => new Date(log.created_at) >= new Date(startDate));
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log => new Date(log.created_at) <= endDateTime);
    }

    // Search filter (user email, resource ID, or details)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log =>
        log.user?.profile?.email?.toLowerCase().includes(query) ||
        log.user?.profile?.full_name?.toLowerCase().includes(query) ||
        log.resource_id?.toLowerCase().includes(query) ||
        JSON.stringify(log.details).toLowerCase().includes(query)
      );
    }

    setFilteredLogs(filtered);
  };

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'User', 'Email', 'Action', 'Resource Type', 'Resource ID', 'Details'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.created_at).toLocaleString(),
        log.user?.profile?.full_name || 'Unknown',
        log.user?.profile?.email || 'Unknown',
        log.action,
        log.resource_type,
        log.resource_id || '',
        JSON.stringify(log.details).replace(/,/g, ';')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: `Exported ${filteredLogs.length} audit log entries`,
    });
  };

  const formatDetails = (details: any) => {
    if (!details || Object.keys(details).length === 0) return null;

    return (
      <div className="text-xs text-muted-foreground mt-2 space-y-1">
        {Object.entries(details).map(([key, value]) => (
          <div key={key} className="flex gap-2">
            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
            <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
          </div>
        ))}
      </div>
    );
  };

  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredLogs.length / pageSize);

  const stats = {
    total: logs.length,
    today: logs.filter(log => {
      const logDate = new Date(log.created_at);
      const today = new Date();
      return logDate.toDateString() === today.toDateString();
    }).length,
    thisWeek: logs.filter(log => {
      const logDate = new Date(log.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return logDate >= weekAgo;
    }).length,
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p>Loading audit logs...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Audit Logs</h1>
        <p className="text-muted-foreground">
          View and filter all system activities and compliance actions
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.thisWeek}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <Button onClick={exportLogs} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search" className="text-sm">Search</Label>
              <Input
                id="search"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="action-filter" className="text-sm">Action Type</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="mt-1" id="action-filter" aria-label="Action Type">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actionTypes.map(action => (
                    <SelectItem key={action} value={action}>
                      {action.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="start-date" className="text-sm">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="end-date" className="text-sm">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {paginatedLogs.length} of {filteredLogs.length} logs
        {(actionFilter !== 'all' || searchQuery || startDate || endDate) && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-2"
            onClick={() => {
              setActionFilter('all');
              setSearchQuery('');
              setStartDate('');
              setEndDate('');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Log Entries */}
      <div className="space-y-3">
        {paginatedLogs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No audit logs found
            </CardContent>
          </Card>
        ) : (
          paginatedLogs.map((log) => (
            <Card key={log.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge
                        className={
                          actionTypeColors[log.action] || 'bg-gray-100 text-gray-800'
                        }
                      >
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">
                          {log.user?.profile?.full_name || 'Unknown User'}
                        </span>
                        <span className="text-muted-foreground">
                          {' '}({log.user?.profile?.email || 'No email'})
                        </span>
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          Resource: <span className="font-medium">{log.resource_type}</span>
                        </span>
                        {log.resource_id && (
                          <span>
                            ID: <span className="font-mono text-xs">{log.resource_id}</span>
                          </span>
                        )}
                      </div>
                      {formatDetails(log.details)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;

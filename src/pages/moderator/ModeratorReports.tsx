import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart2, Flag, CheckCircle2, XCircle, Download } from 'lucide-react';

interface ReportsData {
  flagStats: { reason: string; count: number }[];
  resolutionStats: { resolution: string; count: number }[];
  applicationStats: { status: string; count: number }[];
  recentActions: {
    id: string;
    action: string;
    targetType: string;
    targetId: string;
    performedBy: string;
    createdAt: string;
  }[];
  totalFlags: number;
  pendingFlags: number;
  resolvedFlags: number;
  totalApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
}

function downloadCSV(data: ReportsData) {
  const rows = [
    ['Category', 'Label', 'Count'],
    ...data.flagStats.map((f) => ['Flag Reason', f.reason, f.count]),
    ...data.resolutionStats.map((r) => ['Resolution', r.resolution, r.count]),
    ...data.applicationStats.map((a) => ['Application Status', a.status, a.count]),
  ];
  const csv = rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'moderation-report.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function ModeratorReports() {
  const { data, isLoading, error } = useQuery<ReportsData>({
    queryKey: ['moderator-reports'],
    queryFn: () => apiClient.get<ReportsData>('/api/moderator/reports'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="moderator-reports-page">
        <div className="text-muted-foreground">Loading reports…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6" data-testid="moderator-reports-page">
        <div className="text-destructive">Failed to load moderation reports.</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="moderator-reports-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart2 className="h-6 w-6" />
            Moderation Reports
          </h1>
          <p className="text-muted-foreground mt-1">Overview of content flags and application decisions</p>
        </div>
        <Button
          variant="outline"
          onClick={() => downloadCSV(data)}
          data-testid="moderator-reports-export-csv"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4" data-testid="moderator-reports-stats">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Flag className="h-4 w-4" /> Total Flags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="moderator-reports-total-flags">
              {data.totalFlags}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Flag className="h-4 w-4 text-yellow-500" /> Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600" data-testid="moderator-reports-pending-flags">
              {data.pendingFlags}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" /> Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600" data-testid="moderator-reports-resolved-flags">
              {data.resolvedFlags}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" /> Apps Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="moderator-reports-approved-apps">
              {data.approvedApplications}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" /> Apps Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="moderator-reports-rejected-apps">
              {data.rejectedApplications}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalApplications}</div>
          </CardContent>
        </Card>
      </div>

      {/* Flag reasons breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Flags by Reason</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.flagStats.length === 0 ? (
              <div className="text-muted-foreground text-sm">No flags recorded.</div>
            ) : (
              data.flagStats.map((f) => (
                <div key={f.reason} className="flex items-center justify-between py-1 border-b last:border-0">
                  <span className="text-sm font-medium">{f.reason.replace(/_/g, ' ')}</span>
                  <Badge variant="secondary">{f.count}</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resolution breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Resolutions Applied</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.resolutionStats.length === 0 ? (
              <div className="text-muted-foreground text-sm">No resolutions yet.</div>
            ) : (
              data.resolutionStats.map((r) => (
                <div key={r.resolution} className="flex items-center justify-between py-1 border-b last:border-0">
                  <span className="text-sm font-medium">{r.resolution?.replace(/_/g, ' ') ?? 'Unknown'}</span>
                  <Badge variant="outline">{r.count}</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent moderation actions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Moderation Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentActions.length === 0 ? (
            <div className="text-muted-foreground text-sm">No recent actions.</div>
          ) : (
            <div className="space-y-2">
              {data.recentActions.map((action) => (
                <div key={action.id} className="flex items-start justify-between py-2 border-b last:border-0">
                  <div>
                    <span className="font-medium text-sm">{action.action.replace(/_/g, ' ')}</span>
                    <div className="text-xs text-muted-foreground">
                      {action.targetType} · {action.targetId} · by {action.performedBy}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(action.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

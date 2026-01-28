import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, Plus, TrendingUp, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface TimeEntry {
  id: string;
  operator_id: string;
  company_id: string;
  company_name: string;
  date: string;
  duration_hours: number;
  topic: string;
  notes: string;
  status: 'PENDING' | 'CONFIRMED';
  created_at: string;
}

interface CompanySummary {
  company_id: string;
  company_name: string;
  total_hours: number;
}

interface TopicSummary {
  topic: string;
  total_hours: number;
}

interface HoursSummary {
  total_hours: number;
  by_company: CompanySummary[];
  by_topic: TopicSummary[];
  current_month_hours: number;
  last_month_hours: number;
}

interface LogHoursFormData {
  company_id: string;
  company_name: string;
  date: string;
  duration_hours: number;
  topic: string;
  notes: string;
}

const AdvisoryHours = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<LogHoursFormData>({
    company_id: '',
    company_name: '',
    date: new Date().toISOString().split('T')[0],
    duration_hours: 1,
    topic: '',
    notes: '',
  });

  // Fetch time entries
  const {
    data: timeEntries = [],
    isLoading: entriesLoading,
    error: entriesError,
  } = useQuery<TimeEntry[]>({
    queryKey: ['advisory-hours', user?.id],
    queryFn: async () => {
      return await apiClient.get<TimeEntry[]>('/api/operator/advisory-hours');
    },
  });

  // Fetch summary
  const {
    data: summary,
    isLoading: summaryLoading,
  } = useQuery<HoursSummary>({
    queryKey: ['advisory-hours-summary', user?.id],
    queryFn: async () => {
      return await apiClient.get<HoursSummary>('/api/operator/advisory-hours/summary');
    },
  });

  // Log hours mutation
  const logHoursMutation = useMutation({
    mutationFn: async (data: LogHoursFormData) => {
      const response = await apiClient.post('/api/operator/advisory-hours', data);
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisory-hours'] });
      queryClient.invalidateQueries({ queryKey: ['advisory-hours-summary'] });
      toast.success('Advisory hours logged successfully');
      setDialogOpen(false);
      setFormData({
        company_id: '',
        company_name: '',
        date: new Date().toISOString().split('T')[0],
        duration_hours: 1,
        topic: '',
        notes: '',
      });
    },
    onError: () => {
      toast.error('Failed to log hours');
    },
  });

  const handleLogHours = (e: React.FormEvent) => {
    e.preventDefault();
    logHoursMutation.mutate(formData);
  };

  if (entriesError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Error loading advisory hours. Please try again.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isLoading = entriesLoading || summaryLoading;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Advisory Hours</h1>
          <p className="text-muted-foreground mt-2">
            Track time spent advising portfolio companies
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Log Hours
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Advisory Hours</DialogTitle>
              <DialogDescription>
                Record time spent advising a portfolio company
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleLogHours} className="space-y-4">
              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData({ ...formData, company_name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="duration_hours">Duration (hours)</Label>
                <Input
                  id="duration_hours"
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={formData.duration_hours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration_hours: parseFloat(e.target.value),
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="topic">Topic / Focus Area</Label>
                <Input
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="e.g., Product Strategy, Fundraising"
                  required
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Summary of discussion and outcomes..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={logHoursMutation.isPending}>
                  {logHoursMutation.isPending ? 'Logging...' : 'Log Hours'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary?.total_hours.toFixed(1) || '0.0'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary?.current_month_hours.toFixed(1) || '0.0'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary && summary.last_month_hours > 0
                    ? `${((summary.current_month_hours / summary.last_month_hours - 1) * 100).toFixed(0)}% vs last month`
                    : 'No comparison data'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Companies</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary?.by_company.length || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Advised this period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg per Company</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary && summary.by_company.length > 0
                    ? (summary.total_hours / summary.by_company.length).toFixed(1)
                    : '0.0'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Hours per company</p>
              </CardContent>
            </Card>
          </div>

          {/* Hours by Company */}
          {summary && summary.by_company.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Hours by Company</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {summary.by_company.map((company) => (
                    <div key={company.company_id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{company.company_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{company.total_hours.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">hours</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Time Entries List */}
          <Card>
            <CardHeader>
              <CardTitle>Time Entries</CardTitle>
            </CardHeader>
            <CardContent>
              {timeEntries.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hours logged yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Click "Log Hours" to record your first advisory session
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {timeEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{entry.company_name}</h3>
                            <Badge
                              variant={
                                entry.status === 'CONFIRMED' ? 'default' : 'secondary'
                              }
                            >
                              {entry.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">
                            {entry.duration_hours.toFixed(1)}h
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Topic</p>
                          <p className="text-sm">{entry.topic}</p>
                        </div>
                        {entry.notes && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Notes</p>
                            <p className="text-sm">{entry.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdvisoryHours;

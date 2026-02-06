import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Calendar, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Activity {
  id: number;
  type: string;
  description: string;
  timestamp: string;
  metadata: Record<string, any>;
}

interface Pagination {
  hasMore: boolean;
  nextCursor: string | null;
  count: number;
}

/**
 * Activity Timeline Page Component
 * 
 * Displays unified activity feed with infinite scroll, filtering, and CSV export.
 * Shows all user activities: payments, events, messages, documents, profile updates.
 * 
 * E2E Tests: AT-E2E-001 to AT-E2E-006
 */
export default function ActivityTimeline() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    hasMore: false,
    nextCursor: null,
    count: 0,
  });

  const [filterType, setFilterType] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');

  const observerTarget = useRef<HTMLDivElement>(null);

  const activityTypes = [
    { value: 'all', label: 'All Activities' },
    { value: 'PAYMENT_COMPLETED', label: 'Payments' },
    { value: 'EVENT_REGISTERED', label: 'Event Registrations' },
    { value: 'EVENT_ATTENDED', label: 'Event Attendance' },
    { value: 'CERTIFICATE_ISSUED', label: 'Certificates' },
    { value: 'STATEMENT_GENERATED', label: 'Statements' },
    { value: 'DOCUMENT_UPLOADED', label: 'Documents' },
    { value: 'PROFILE_UPDATED', label: 'Profile Updates' },
    { value: 'MESSAGE_SENT', label: 'Messages' },
  ];

  // Initial load and filter changes
  useEffect(() => {
    fetchActivities(true);
  }, [filterType, filterDateFrom, filterDateTo]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination.hasMore && !isLoadingMore) {
          fetchActivities(false);
        }
      },
      { threshold: 1.0 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [pagination.hasMore, isLoadingMore]);

  const fetchActivities = async (reset: boolean = false) => {
    try {
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('activityType', filterType);
      if (filterDateFrom) params.append('dateFrom', new Date(filterDateFrom).toISOString());
      if (filterDateTo) params.append('dateTo', new Date(filterDateTo).toISOString());
      if (!reset && pagination.nextCursor) params.append('cursor', pagination.nextCursor);

      const response = await fetch(`/api/activity?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const data = await response.json();
      if (data.success) {
        setActivities(reset ? data.data : [...activities, ...data.data]);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load activities. Please try again.',
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const exportToCSV = async () => {
    try {
      setIsExporting(true);

      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('activityType', filterType);
      if (filterDateFrom) params.append('dateFrom', new Date(filterDateFrom).toISOString());
      if (filterDateTo) params.append('dateTo', new Date(filterDateTo).toISOString());

      const response = await fetch(`/api/activity/export/csv?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export activities');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'Activity exported successfully',
      });
    } catch (error) {
      console.error('Error exporting activities:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to export activities. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getActivityIcon = (type: string) => {
    // Return appropriate icon based on activity type
    const iconMap: Record<string, string> = {
      PAYMENT_COMPLETED: '💳',
      EVENT_REGISTERED: '📅',
      EVENT_ATTENDED: '✅',
      CERTIFICATE_ISSUED: '🏆',
      STATEMENT_GENERATED: '📄',
      DOCUMENT_UPLOADED: '📎',
      PROFILE_UPDATED: '👤',
      MESSAGE_SENT: '✉️',
    };
    return iconMap[type] || '•';
  };

  const getActivityColor = (type: string) => {
    const colorMap: Record<string, string> = {
      PAYMENT_COMPLETED: 'bg-green-100 text-green-800',
      EVENT_REGISTERED: 'bg-blue-100 text-blue-800',
      EVENT_ATTENDED: 'bg-purple-100 text-purple-800',
      CERTIFICATE_ISSUED: 'bg-yellow-100 text-yellow-800',
      STATEMENT_GENERATED: 'bg-gray-100 text-gray-800',
      DOCUMENT_UPLOADED: 'bg-indigo-100 text-indigo-800',
      PROFILE_UPDATED: 'bg-pink-100 text-pink-800',
      MESSAGE_SENT: 'bg-cyan-100 text-cyan-800',
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" data-testid="activity-loader" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="activity-timeline-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Activity Timeline</h1>
        <p className="text-muted-foreground">
          Your complete activity history across all platform features
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
              <CardDescription>Filter activities by type and date range</CardDescription>
            </div>
            <Button
              onClick={exportToCSV}
              disabled={isExporting || activities.length === 0}
              data-testid="activity-export-btn"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Activity Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger data-testid="activity-filter-type">
                  <SelectValue placeholder="All activities" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">From Date</label>
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                data-testid="activity-filter-date-from"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                data-testid="activity-filter-date-to"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Feed */}
      {activities.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">No activities found</p>
            <p className="text-muted-foreground">
              {filterType !== 'all' || filterDateFrom || filterDateTo
                ? 'Try adjusting your filters'
                : 'Your activities will appear here'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3" data-testid="activity-feed">
          {activities.map((activity, index) => (
            <Card key={`${activity.id}-${index}`} data-testid={`activity-item-${activity.id}`}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 text-2xl" data-testid={`activity-icon-${activity.id}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getActivityColor(activity.type)} data-testid={`activity-type-${activity.id}`}>
                        {activity.type.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-sm text-muted-foreground" data-testid={`activity-time-${activity.id}`}>
                        {formatDate(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm" data-testid={`activity-description-${activity.id}`}>
                      {activity.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Infinite scroll observer */}
          {pagination.hasMore && (
            <div ref={observerTarget} className="py-4 text-center">
              {isLoadingMore && (
                <Loader2 className="h-6 w-6 animate-spin mx-auto" data-testid="activity-loading-more" />
              )}
            </div>
          )}

          {!pagination.hasMore && activities.length > 0 && (
            <p className="text-center text-muted-foreground py-4" data-testid="activity-end-message">
              You've reached the end of your activity history
            </p>
          )}
        </div>
      )}
    </div>
  );
}

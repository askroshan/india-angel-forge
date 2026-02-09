import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Loader2, DollarSign, Calendar, MessageSquare, FileText, User,
  Filter, X, Download, ChevronDown, ChevronUp,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Activity {
  id: string;
  activityType: string;
  type?: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
  timestamp?: string;
}

const ACTIVITIES_PER_PAGE = 20;

const TYPE_ICONS: Record<string, any> = {
  PAYMENT: DollarSign, EVENT: Calendar, MESSAGE: MessageSquare,
  DOCUMENT: FileText, PROFILE: User,
};

const TYPE_LABELS: Record<string, string> = {
  PAYMENT: 'Payment', EVENT: 'Event', MESSAGE: 'Message',
  DOCUMENT: 'Document', PROFILE: 'Profile',
};

function getTypeCategory(activityType: string): string {
  if (!activityType) return 'PAYMENT';
  if (activityType.startsWith('PAYMENT') || activityType.includes('REFUND') || activityType.includes('INVEST')) return 'PAYMENT';
  if (activityType.startsWith('EVENT') || activityType.includes('RSVP') || activityType.includes('ATTENDANCE')) return 'EVENT';
  if (activityType.startsWith('MESSAGE') || activityType.includes('EMAIL') || activityType.includes('NOTIFICATION')) return 'MESSAGE';
  if (activityType.startsWith('DOCUMENT') || activityType.includes('STATEMENT') || activityType.includes('CERTIFICATE')) return 'DOCUMENT';
  if (activityType.startsWith('PROFILE') || activityType.includes('UPDATE') || activityType.includes('CHANGE')) return 'PROFILE';
  return 'PAYMENT';
}

function getTypeIcon(activityType: string) {
  const cat = getTypeCategory(activityType);
  return TYPE_ICONS[cat] || DollarSign;
}

function getTypeLabel(activityType: string) {
  const cat = getTypeCategory(activityType);
  return TYPE_LABELS[cat] || activityType;
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return `on ${d.toLocaleDateString('en-IN')}`;
}

export default function ActivityTimeline() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [activeDateFilter, setActiveDateFilter] = useState<string>('');
  const [activeTypeFilter, setActiveTypeFilter] = useState<string[]>([]);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const observerRef = useRef<HTMLDivElement>(null);

  const fetchActivities = useCallback(async (cursorId?: string | null) => {
    try {
      if (!cursorId) setIsLoading(true);
      else setIsLoadingMore(true);
      const token = localStorage.getItem('auth_token');
      let url = `/api/activity?limit=${ACTIVITIES_PER_PAGE}`;
      if (cursorId) url += `&cursor=${cursorId}`;
      if (activeTypeFilter.length > 0) url += `&activityType=${activeTypeFilter.join(',')}`;
      if (activeDateFilter === 'last-7-days') {
        const d = new Date(); d.setDate(d.getDate() - 7);
        url += `&dateFrom=${d.toISOString()}`;
      } else if (activeDateFilter === 'last-30-days') {
        const d = new Date(); d.setDate(d.getDate() - 30);
        url += `&dateFrom=${d.toISOString()}`;
      } else if (activeDateFilter === 'custom' && dateFrom && dateTo) {
        url += `&dateFrom=${new Date(dateFrom).toISOString()}&dateTo=${new Date(dateTo).toISOString()}`;
      }
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to fetch activities');
      const data = await response.json();
      const rawItems = data.data || data.activities || [];
      const items: Activity[] = rawItems.map((item: any) => ({
        ...item,
        activityType: item.activityType || item.type || 'UNKNOWN',
        createdAt: item.createdAt || item.timestamp || new Date().toISOString(),
      }));
      if (cursorId) { setActivities(prev => [...prev, ...items]); }
      else { setActivities(items); }
      if (items.length < ACTIVITIES_PER_PAGE) { setHasMore(false); }
      else { setHasMore(true); setCursor(items[items.length - 1]?.id || null); }
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load activities' });
    } finally { setIsLoading(false); setIsLoadingMore(false); setIsInitialLoad(false); }
  }, [activeTypeFilter, activeDateFilter, dateFrom, dateTo]);

  useEffect(() => {
    setActivities([]); setCursor(null); setHasMore(true);
    fetchActivities(null);
  }, [fetchActivities]);

  useEffect(() => {
    if (!observerRef.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
        fetchActivities(cursor);
      }
    }, { threshold: 0.1 });
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, cursor, fetchActivities]);

  const handleApplyTypeFilter = () => { setActiveTypeFilter([...selectedTypes]); setShowTypeFilter(false); };
  const handleDateQuickFilter = (filter: string) => { setActiveDateFilter(filter); setShowCustomRange(false); setShowDateFilter(false); };
  const handleApplyDateFilter = () => { setActiveDateFilter('custom'); setShowDateFilter(false); };
  const clearFilters = () => { setActiveTypeFilter([]); setSelectedTypes([]); setActiveDateFilter(''); setDateFrom(''); setDateTo(''); setShowCustomRange(false); };
  const hasActiveFilters = activeTypeFilter.length > 0 || activeDateFilter !== '';
  const toggleTypeSelection = (type: string) => { setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]); };

  const exportTimeline = () => {
    const csvRows = ['Date,Type,Description'];
    activities.forEach(a => {
      const date = new Date(a.createdAt).toLocaleDateString('en-IN');
      const type = getTypeLabel(a.activityType);
      const desc = (a.description || '').replace(/"/g, '""');
      csvRows.push(`"${date}","${type}","${desc}"`);
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-timeline-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link); link.click();
    document.body.removeChild(link); URL.revokeObjectURL(url);
  };

  const toggleExpand = (id: string) => { setExpandedId(prev => prev === id ? null : id); };

  const renderActivityDetails = (activity: Activity) => {
    const cat = getTypeCategory(activity.activityType);
    const meta = activity.metadata || {};
    return (
      <div data-testid="activity-details" className="mt-3 p-3 bg-muted/50 rounded-lg text-sm space-y-2">
        {cat === 'PAYMENT' && (
          <>
            <div data-testid="payment-amount" className="flex justify-between"><span>Amount:</span><span className="font-medium">&#8377;{meta.amount || '0'}</span></div>
            <div data-testid="payment-status" className="flex justify-between"><span>Status:</span><span>{meta.status || 'Completed'}</span></div>
            {meta.invoiceUrl && <a href={meta.invoiceUrl} data-testid="view-invoice" className="text-primary underline">View Invoice</a>}
          </>
        )}
        {cat === 'EVENT' && (
          <>
            <div data-testid="event-name">Event: {meta.eventName || activity.description}</div>
            <div data-testid="event-date">Date: {meta.eventDate || 'N/A'}</div>
            {meta.rsvpStatus && <div data-testid="rsvp-status">RSVP: {meta.rsvpStatus}</div>}
          </>
        )}
        {cat === 'MESSAGE' && (
          <>
            <div data-testid="message-preview">{meta.preview || activity.description}</div>
            {meta.sender && <div data-testid="message-sender">From: {meta.sender}</div>}
          </>
        )}
        {cat === 'DOCUMENT' && (
          <>
            <div data-testid="document-name">Document: {meta.documentName || activity.description}</div>
            {meta.downloadUrl && <a href={meta.downloadUrl} data-testid="download-document" className="text-primary underline">Download</a>}
          </>
        )}
        {cat === 'PROFILE' && (
          <div data-testid="change-description">{meta.changeDescription || `Profile updated: ${activity.description}`}</div>
        )}
        <Button size="sm" variant="ghost" data-testid="collapse-details" onClick={(e) => { e.stopPropagation(); setExpandedId(null); }}>
          <ChevronUp className="h-4 w-4 mr-1" /> Collapse
        </Button>
      </div>
    );
  };

  if (isLoading && isInitialLoad) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Activity Timeline</h1>
        <div data-testid="activity-timeline" className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Activity Timeline</h1>
        <Button variant="outline" data-testid="export-timeline" onClick={exportTimeline} disabled={activities.length === 0}>
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative">
          <Button variant="outline" size="sm" data-testid="filter-type" onClick={() => { setShowTypeFilter(!showTypeFilter); setShowDateFilter(false); }}>
            <Filter className="h-4 w-4 mr-1" /> Type
          </Button>
          {showTypeFilter && (
            <div data-testid="type-filter-menu" className="absolute z-50 top-full left-0 mt-1 bg-background border rounded-lg shadow-lg p-3 min-w-[200px]">
              {['payment', 'event', 'message', 'document', 'profile'].map(type => (
                <div key={type} data-testid={`type-${type}`} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-muted px-2 rounded" onClick={() => toggleTypeSelection(type.toUpperCase())}>
                  <input type="checkbox" checked={selectedTypes.includes(type.toUpperCase())} readOnly className="rounded pointer-events-none" />
                  <span className="capitalize">{type}</span>
                </div>
              ))}
              <Button size="sm" className="w-full mt-2" data-testid="apply-type-filter" onClick={handleApplyTypeFilter}>Apply</Button>
            </div>
          )}
        </div>

        <div className="relative">
          <Button variant="outline" size="sm" data-testid="filter-date" onClick={() => { setShowDateFilter(!showDateFilter); setShowTypeFilter(false); }}>
            <Calendar className="h-4 w-4 mr-1" /> Date
          </Button>
          {showDateFilter && (
            <div data-testid="date-filter-menu" className="absolute z-50 top-full left-0 mt-1 bg-background border rounded-lg shadow-lg p-3 min-w-[250px]">
              <button data-testid="date-last-7-days" className="block w-full text-left px-3 py-2 rounded hover:bg-muted" onClick={() => handleDateQuickFilter('last-7-days')}>Last 7 days</button>
              <button data-testid="date-last-30-days" className="block w-full text-left px-3 py-2 rounded hover:bg-muted" onClick={() => handleDateQuickFilter('last-30-days')}>Last 30 days</button>
              <button data-testid="date-custom-range" className="block w-full text-left px-3 py-2 rounded hover:bg-muted" onClick={() => setShowCustomRange(true)}>Custom range</button>
              {showCustomRange && (
                <div className="mt-2 space-y-2 border-t pt-2">
                  <Input type="date" data-testid="date-from" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                  <Input type="date" data-testid="date-to" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                  <Button size="sm" className="w-full" data-testid="apply-date-filter" onClick={handleApplyDateFilter}>Apply</Button>
                </div>
              )}
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <div data-testid="active-filters" className="flex items-center gap-2">
            {activeTypeFilter.length > 0 && <Badge variant="secondary">Type: {activeTypeFilter.map(t => t.toLowerCase()).join(', ')}</Badge>}
            {activeDateFilter && <Badge variant="secondary">Date: {activeDateFilter.replace(/-/g, ' ')}</Badge>}
            <Button variant="ghost" size="sm" data-testid="clear-filters" onClick={clearFilters}><X className="h-4 w-4 mr-1" /> Clear</Button>
          </div>
        )}
      </div>

      {/* Activity List */}
      <div data-testid="activity-timeline" className="space-y-3">
        {activities.length === 0 ? (
          <Card data-testid="no-activities"><CardContent className="pt-6 text-center text-muted-foreground">No activities found</CardContent></Card>
        ) : (
          activities.map(activity => {
            const Icon = getTypeIcon(activity.activityType);
            const isExpanded = expandedId === activity.id;
            return (
              <Card key={activity.id} data-testid="activity-item" data-activity-id={activity.id} data-activity-type={activity.activityType} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => toggleExpand(activity.id)}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div data-testid="activity-type-icon" className="mt-1 p-2 rounded-full bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p data-testid="activity-description" className="text-sm font-medium truncate">{activity.description}</p>
                        <Badge variant="outline" className="ml-2 shrink-0" data-testid="activity-type">{getTypeLabel(activity.activityType)}</Badge>
                      </div>
                      <p data-testid="activity-timestamp" data-timestamp={activity.createdAt} className="text-xs text-muted-foreground mt-1">{timeAgo(activity.createdAt)}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </div>
                  {isExpanded && renderActivityDetails(activity)}
                </CardContent>
              </Card>
            );
          })
        )}
        <div ref={observerRef} className="h-4" />
        {isLoadingMore && <div data-testid="loading-more" className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>}
        {!hasMore && activities.length > 0 && <div data-testid="end-of-timeline" className="text-center py-4 text-muted-foreground">End of timeline — no more activities</div>}
      </div>
    </div>
  );
}

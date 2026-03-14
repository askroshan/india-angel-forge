import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarCheck, Download, Users } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  rsvpStatus: string;
  checkedIn: boolean;
  checkInTime?: string;
  checkOutTime?: string;
}

interface AttendanceResponse {
  records: AttendanceRecord[];
  total: number;
  page: number;
  pageSize: number;
}

interface EventOption {
  id: string;
  title: string;
}

function downloadCSV(records: AttendanceRecord[], eventTitle?: string) {
  const fileName = eventTitle
    ? `attendance-${eventTitle.replace(/\s+/g, '-').toLowerCase()}.csv`
    : 'attendance-all.csv';
  const headers = ['User', 'Email', 'Event', 'Date', 'RSVP Status', 'Checked In', 'Check-in Time', 'Check-out Time'];
  const rows = records.map((r) => [
    r.userName,
    r.userEmail,
    r.eventTitle,
    new Date(r.eventDate).toLocaleDateString(),
    r.rsvpStatus,
    r.checkedIn ? 'Yes' : 'No',
    r.checkInTime ? new Date(r.checkInTime).toLocaleString() : '',
    r.checkOutTime ? new Date(r.checkOutTime).toLocaleString() : '',
  ]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'default',
  WAITLIST: 'secondary',
  ATTENDED: 'default',
  NO_SHOW: 'destructive',
  CANCELLED: 'outline',
};

export default function ModeratorAttendance() {
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: events = [] } = useQuery<EventOption[]>({
    queryKey: ['moderator-events-list'],
    queryFn: () => apiClient.get<EventOption[]>('/api/moderator/events'),
  });

  const { data, isLoading } = useQuery<AttendanceResponse>({
    queryKey: ['moderator-attendance', selectedEvent, page],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (selectedEvent && selectedEvent !== 'all') params.set('eventId', selectedEvent);
      return apiClient.get<AttendanceResponse>(`/api/moderator/attendance?${params}`);
    },
  });

  const records = data?.records ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const selectedEventTitle = events.find((e) => e.id === selectedEvent)?.title;

  return (
    <div className="p-6 space-y-6" data-testid="moderator-attendance-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarCheck className="h-6 w-6" />
            Event Attendance
          </h1>
          <p className="text-muted-foreground mt-1">All event attendance records</p>
        </div>
        <Button
          variant="outline"
          onClick={() => downloadCSV(records, selectedEventTitle)}
          data-testid="moderator-attendance-export"
          disabled={records.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Event:</label>
          <Select
            value={selectedEvent}
            onValueChange={(v) => { setSelectedEvent(v); setPage(1); }}
          >
            <SelectTrigger className="w-56" data-testid="moderator-attendance-event-filter">
              <SelectValue placeholder="All events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span data-testid="moderator-attendance-count">{total} records</span>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading attendance…</div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No attendance records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="moderator-attendance-table">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">User</th>
                    <th className="text-left py-2 pr-4 font-medium">Event</th>
                    <th className="text-left py-2 pr-4 font-medium">Date</th>
                    <th className="text-left py-2 pr-4 font-medium">Status</th>
                    <th className="text-left py-2 pr-4 font-medium">Check-in</th>
                    <th className="text-left py-2 font-medium">Check-out</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50" data-testid={`attendance-row-${r.id}`}>
                      <td className="py-2 pr-4">
                        <div className="font-medium">{r.userName}</div>
                        <div className="text-xs text-muted-foreground">{r.userEmail}</div>
                      </td>
                      <td className="py-2 pr-4 max-w-[200px] truncate">{r.eventTitle}</td>
                      <td className="py-2 pr-4">{new Date(r.eventDate).toLocaleDateString()}</td>
                      <td className="py-2 pr-4">
                        <Badge variant={(STATUS_COLORS[r.rsvpStatus] ?? 'outline') as 'default' | 'secondary' | 'destructive' | 'outline'}>
                          {r.rsvpStatus}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : '—'}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

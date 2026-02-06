import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserCheck, UserX, TrendingUp, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Event {
  id: string;
  title: string;
  eventDate: string;
}

interface Statistics {
  total: number;
  rsvp: {
    confirmed: number;
    waitlist: number;
    cancelled: number;
    noShow: number;
  };
  attendance: {
    checkedIn: number;
    attended: number;
    partial: number;
    absent: number;
  };
  attendanceRate: number;
}

export default function AttendanceStatistics() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }

    // Check if user is admin
    if (!user?.roles?.includes('admin')) {
      navigate('/access-denied');
      return;
    }

    fetchEvents();
  }, [token, user, navigate]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async (eventId: string) => {
    setLoadingStats(true);
    try {
      const response = await fetch(`/api/events/${eventId}/statistics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const result = await response.json();
      setStatistics(result.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load statistics',
        variant: 'destructive',
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
    fetchStatistics(eventId);
  };

  const exportReport = async () => {
    if (!selectedEventId) return;

    try {
      const event = events.find(e => e.id === selectedEventId);
      const eventTitle = event?.title || 'event';
      const timestamp = new Date().toISOString().split('T')[0];
      
      // Create CSV content
      const csvContent = [
        ['Attendance Statistics Report'],
        ['Event', eventTitle],
        ['Generated', new Date().toLocaleString()],
        [''],
        ['Metric', 'Count'],
        ['Total RSVPs', statistics?.total || 0],
        ['Confirmed', statistics?.rsvp.confirmed || 0],
        ['Waitlist', statistics?.rsvp.waitlist || 0],
        ['Cancelled', statistics?.rsvp.cancelled || 0],
        ['No Shows', statistics?.rsvp.noShow || 0],
        ['Checked In', statistics?.attendance.checkedIn || 0],
        ['Attended', statistics?.attendance.attended || 0],
        ['Partial Attendance', statistics?.attendance.partial || 0],
        ['Absent', statistics?.attendance.absent || 0],
        ['Attendance Rate', `${statistics?.attendanceRate || 0}%`],
      ].map(row => row.join(',')).join('\n');

      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-report-${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Report exported successfully',
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: 'Error',
        description: 'Failed to export report',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Attendance Statistics</h1>
          <p className="text-muted-foreground">View and analyze event attendance data</p>
        </div>

        {/* Event Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Event</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Event</label>
                <Select value={selectedEventId} onValueChange={handleEventSelect}>
                  <SelectTrigger data-testid="select-event">
                    <SelectValue placeholder="Choose an event to view statistics" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem 
                        key={event.id} 
                        value={event.id}
                        data-testid="event-option"
                      >
                        {event.title} - {new Date(event.eventDate).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedEventId && statistics && (
                <Button
                  onClick={exportReport}
                  data-testid="export-attendance-report"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistics Display */}
        {loadingStats ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : statistics ? (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Total RSVPs */}
              <Card data-testid="stat-total-rsvps">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total RSVPs</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-value">
                    {statistics.rsvp.confirmed}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Confirmed attendees
                  </p>
                </CardContent>
              </Card>

              {/* Checked In */}
              <Card data-testid="stat-checked-in">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Checked In</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-value">
                    {statistics.attendance.checkedIn}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Arrived at event
                  </p>
                </CardContent>
              </Card>

              {/* Attended */}
              <Card data-testid="stat-attended">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Fully Attended</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-value">
                    {statistics.attendance.attended}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Completed attendance
                  </p>
                </CardContent>
              </Card>

              {/* No Shows */}
              <Card data-testid="stat-no-shows">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">No Shows</CardTitle>
                  <UserX className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-value">
                    {statistics.rsvp.noShow}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Did not attend
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Rate */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Attendance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div 
                    className="text-5xl font-bold text-primary"
                    data-testid="attendance-rate"
                  >
                    {statistics.attendanceRate}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    of confirmed attendees completed the event
                  </div>
                </div>
                <div className="mt-4 w-full bg-secondary rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(statistics.attendanceRate, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Visual Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div data-testid="attendance-chart" className="space-y-4">
                  {/* Confirmed */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Confirmed RSVPs</span>
                      <span className="text-sm text-muted-foreground">
                        {statistics.rsvp.confirmed} ({statistics.total > 0 ? Math.round((statistics.rsvp.confirmed / statistics.total) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${statistics.total > 0 ? (statistics.rsvp.confirmed / statistics.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Checked In */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Checked In</span>
                      <span className="text-sm text-muted-foreground">
                        {statistics.attendance.checkedIn} ({statistics.total > 0 ? Math.round((statistics.attendance.checkedIn / statistics.total) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${statistics.total > 0 ? (statistics.attendance.checkedIn / statistics.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Attended */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Fully Attended</span>
                      <span className="text-sm text-muted-foreground">
                        {statistics.attendance.attended} ({statistics.total > 0 ? Math.round((statistics.attendance.attended / statistics.total) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${statistics.total > 0 ? (statistics.attendance.attended / statistics.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* No Shows */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">No Shows</span>
                      <span className="text-sm text-muted-foreground">
                        {statistics.rsvp.noShow} ({statistics.total > 0 ? Math.round((statistics.rsvp.noShow / statistics.total) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${statistics.total > 0 ? (statistics.rsvp.noShow / statistics.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Waitlist */}
                  {statistics.rsvp.waitlist > 0 && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Waitlist</span>
                        <span className="text-sm text-muted-foreground">
                          {statistics.rsvp.waitlist} ({statistics.total > 0 ? Math.round((statistics.rsvp.waitlist / statistics.total) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${statistics.total > 0 ? (statistics.rsvp.waitlist / statistics.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Cancelled */}
                  {statistics.rsvp.cancelled > 0 && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Cancelled</span>
                        <span className="text-sm text-muted-foreground">
                          {statistics.rsvp.cancelled} ({statistics.total > 0 ? Math.round((statistics.rsvp.cancelled / statistics.total) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-gray-500 h-2 rounded-full"
                          style={{ width: `${statistics.total > 0 ? (statistics.rsvp.cancelled / statistics.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        ) : selectedEventId ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No statistics available for this event
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Select an event to view attendance statistics
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}

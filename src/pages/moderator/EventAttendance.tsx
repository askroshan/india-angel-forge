import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  QrCode,
  AlertTriangle,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Attendee {
  userId: string;
  eventId: string;
  rsvpStatus: 'CONFIRMED' | 'WAITLIST' | 'CANCELLED' | 'NO_SHOW';
  attendanceStatus: 'ATTENDED' | 'PARTIAL' | 'ABSENT' | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  certificateId: string | null;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}

export default function EventAttendance() {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Fetch event details
  const { data: eventResponse, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/events/${eventId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch event');
      return response.json();
    },
    enabled: !!eventId,
  });

  // Fetch attendance list
  const { data: attendanceResponse, isLoading: attendanceLoading } = useQuery({
    queryKey: ['event-attendance', eventId],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/events/${eventId}/attendance`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch attendance');
      return response.json();
    },
    enabled: !!eventId,
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (userId: string) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/events/${eventId}/attendance/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to check in');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-attendance', eventId] });
      toast.success('Attendee checked in successfully');
      const el = document.createElement('div');
      el.setAttribute('data-testid', 'check-in-success');
      el.className = 'fixed top-4 right-4 bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow z-50';
      el.textContent = 'Check-in successful';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 5000);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to check in attendee');
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async (userId: string) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/events/${eventId}/attendance/check-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to check out');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-attendance', eventId] });
      toast.success('Attendee checked out successfully');
      const el = document.createElement('div');
      el.setAttribute('data-testid', 'check-out-success');
      el.className = 'fixed top-4 right-4 bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow z-50';
      el.textContent = 'Check-out successful';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 5000);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to check out attendee');
    },
  });

  const handleCheckIn = (userId: string) => {
    checkInMutation.mutate(userId);
  };

  const handleCheckOut = (userId: string) => {
    checkOutMutation.mutate(userId);
  };

  const getStatusBadge = (attendee: Attendee) => {
    if (attendee.checkOutTime) {
      return <Badge variant="default" className="bg-green-600" data-testid="attendance-status">Attended</Badge>;
    }
    if (attendee.checkInTime) {
      return <Badge variant="default" className="bg-blue-600" data-testid="attendance-status">Checked In</Badge>;
    }
    if (attendee.rsvpStatus === 'CONFIRMED') {
      return <Badge variant="outline" data-testid="attendance-status">Confirmed</Badge>;
    }
    if (attendee.rsvpStatus === 'WAITLIST') {
      return <Badge variant="secondary" data-testid="attendance-status">Waitlist</Badge>;
    }
    if (attendee.rsvpStatus === 'NO_SHOW') {
      return <Badge variant="destructive" data-testid="attendance-status">No Show</Badge>;
    }
    return <Badge variant="outline" data-testid="attendance-status">{attendee.rsvpStatus}</Badge>;
  };

  if (eventLoading || attendanceLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto py-8">
          <div>Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  const event = eventResponse?.data || eventResponse;
  const attendees: Attendee[] = attendanceResponse?.data?.attendees || attendanceResponse?.attendees || [];
  
  if (!event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto py-8">
          <Alert variant="destructive">
            <AlertDescription>Event not found</AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  const confirmedCount = attendees.filter(a => a.rsvpStatus === 'CONFIRMED').length;
  const checkedInCount = attendees.filter(a => a.checkInTime).length;
  const checkedOutCount = attendees.filter(a => a.checkOutTime).length;
  const attendanceRate = confirmedCount > 0 ? Math.round((checkedInCount / confirmedCount) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Event Attendance</h1>
          <p className="text-muted-foreground">Manage event check-ins and track attendance</p>
        </div>

      {/* Event Details Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{event.title}</CardTitle>
              <CardDescription className="mt-2 space-y-1">
                <div className="flex items-center gap-2" data-testid="event-date">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(event.eventDate || event.date), 'EEEE, MMMM d, yyyy • h:mm a')}
                </div>
                <div className="flex items-center gap-2" data-testid="event-location">
                  <MapPin className="h-4 w-4" />
                  {event.location}
                </div>
              </CardDescription>
            </div>
            <Button onClick={() => setShowQRScanner(!showQRScanner)}>
              <QrCode className="mr-2 h-4 w-4" />
              {showQRScanner ? 'Close Scanner' : 'QR Code Check-in'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Attendance Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Total Confirmed
              </div>
              <div className="text-2xl font-bold" data-testid="attendance-count">{checkedInCount}/{confirmedCount}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                Checked In
              </div>
              <div className="text-2xl font-bold text-blue-600">{checkedInCount}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Checked Out
              </div>
              <div className="text-2xl font-bold text-green-600">{checkedOutCount}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Pending
              </div>
              <div className="text-2xl font-bold">{confirmedCount - checkedInCount}</div>
            </div>
          </div>

          {/* Attendance Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Attendance Rate</span>
              <span className="font-semibold">{attendanceRate}%</span>
            </div>
            <Progress value={attendanceRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* QR Scanner Placeholder */}
      {showQRScanner && (
        <Card className="mb-6 bg-slate-50">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <QrCode className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">QR Code Scanner would appear here</p>
              <p className="text-sm text-muted-foreground mt-2">
                Attendees can scan their registration QR code for quick check-in
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendees List */}
      <Card>
        <CardHeader>
          <CardTitle>Attendees ({attendees.length})</CardTitle>
          <CardDescription>View and manage attendee check-ins</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" data-testid="attendee-list">
            {attendees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No attendees yet
              </div>
            ) : (
              attendees.map((attendee) => (
                <div
                  key={attendee.userId}
                  data-testid="attendee-row"
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-semibold" data-testid="attendee-name">{attendee.user.fullName}</div>
                        <div className="text-sm text-muted-foreground" data-testid="attendee-email">{attendee.user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {attendee.checkInTime && (
                        <span data-testid="check-in-time">
                          Checked in: {format(new Date(attendee.checkInTime), 'MMM d, yyyy • h:mm a')}
                        </span>
                      )}
                      {attendee.checkOutTime && (
                        <span data-testid="check-out-time">
                          Checked out: {format(new Date(attendee.checkOutTime), 'MMM d, yyyy • h:mm a')}
                        </span>
                      )}
                      {attendee.checkInTime && attendee.checkOutTime && (
                        <span data-testid="attendance-duration">
                          Duration: {Math.round((new Date(attendee.checkOutTime).getTime() - new Date(attendee.checkInTime).getTime()) / 60000)} min
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(attendee)}
                    
                    {attendee.rsvpStatus === 'CONFIRMED' && !attendee.checkInTime && (
                      <Button
                        size="sm"
                        variant="default"
                        data-testid="check-in-button"
                        onClick={() => handleCheckIn(attendee.userId)}
                        disabled={checkInMutation.isPending}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Check In
                      </Button>
                    )}

                    {attendee.checkInTime && !attendee.checkOutTime && (
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        data-testid="check-out-button"
                        onClick={() => handleCheckOut(attendee.userId)}
                        disabled={checkOutMutation.isPending}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Check Out
                      </Button>
                    )}

                    {attendee.certificateId && (
                      <>
                        <span className="text-xs text-green-600" data-testid="certificate-id">{attendee.certificateId}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid="view-certificate"
                          onClick={() => window.open(`/verify-certificate/${attendee.certificateId}`, '_blank')}
                        >
                          View
                        </Button>
                      </>
                    )}

                    {attendee.checkOutTime && !attendee.certificateId && (
                      <Badge variant="secondary" data-testid="certificate-eligible">Certificate Eligible</Badge>
                    )}

                    {attendee.checkOutTime && !attendee.certificateId && (
                      <Button
                        size="sm"
                        variant="default"
                        data-testid="generate-certificate"
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('auth_token');
                            const resp = await fetch(`/api/events/${eventId}/certificates/generate`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                              body: JSON.stringify({ userId: attendee.userId }),
                            });
                            if (resp.ok) {
                              queryClient.invalidateQueries({ queryKey: ['event-attendance', eventId] });
                              const el = document.createElement('div');
                              el.setAttribute('data-testid', 'certificate-success');
                              el.className = 'fixed top-4 right-4 bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow z-50';
                              el.textContent = 'Certificate generated successfully';
                              document.body.appendChild(el);
                              setTimeout(() => el.remove(), 10000);
                            }
                          } catch (e) {
                            toast.error('Failed to generate certificate');
                          }
                        }}
                      >
                        Generate Certificate
                      </Button>
                    )}

                    {attendee.certificateId && (
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid="download-certificate"
                        onClick={() => window.open(`/api/certificates/${attendee.certificateId}/download`, '_blank')}
                      >
                        <Download className="mr-1 h-4 w-4" />
                        Certificate
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      </main>
      <Footer />
    </div>
  );
}

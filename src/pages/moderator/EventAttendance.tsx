import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  QrCode,
  AlertTriangle 
} from 'lucide-react';
import { toast } from 'sonner';

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  total_registrations: number;
  attended_count: number;
  no_show_count: number;
  pending_count: number;
}

interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  registered_at: string;
  attendance_status: 'PENDING' | 'ATTENDED' | 'NO_SHOW';
  checked_in_at: string | null;
  no_show_history_count: number;
}

export default function EventAttendance() {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Fetch event details
  const { data: event, isLoading: eventLoading, error: eventError } = useQuery<Event>({
    queryKey: ['moderator-event', eventId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/moderator/events/${eventId}`);
      return response.data;
    },
  });

  // Fetch registrations
  const { data: registrations = [], isLoading: registrationsLoading } = useQuery<Registration[]>({
    queryKey: ['moderator-event-registrations', eventId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/moderator/events/${eventId}/registrations`);
      return response.data;
    },
    enabled: !!eventId,
  });

  // Update attendance mutation
  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ registrationId, status }: { registrationId: string; status: string }) => {
      const response = await apiClient.patch(
        `/api/moderator/events/${eventId}/registrations/${registrationId}`,
        { attendance_status: status }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderator-event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['moderator-event-registrations', eventId] });
      toast.success('Attendance updated successfully');
    },
    onError: () => {
      toast.error('Failed to update attendance');
    },
  });

  const handleMarkAttended = (registrationId: string) => {
    updateAttendanceMutation.mutate({ registrationId, status: 'ATTENDED' });
  };

  const handleMarkNoShow = (registrationId: string) => {
    updateAttendanceMutation.mutate({ registrationId, status: 'NO_SHOW' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ATTENDED':
        return <Badge className="bg-green-500">ATTENDED</Badge>;
      case 'NO_SHOW':
        return <Badge variant="destructive">NO SHOW</Badge>;
      case 'PENDING':
        return <Badge variant="outline">PENDING</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (eventError) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>Error loading event. Please try again later.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (eventLoading || registrationsLoading) {
    return (
      <div className="container mx-auto py-8">
        <div>Loading...</div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const attendanceRate = event.total_registrations > 0 
    ? Math.round((event.attended_count / event.total_registrations) * 100) 
    : 0;

  return (
    <div className="container mx-auto py-8">
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
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(event.date).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="flex items-center gap-2">
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
                Total Registrations
              </div>
              <div className="text-2xl font-bold">{event.total_registrations}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Attended
              </div>
              <div className="text-2xl font-bold text-green-600">{event.attended_count}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <XCircle className="h-4 w-4 text-red-500" />
                No Show
              </div>
              <div className="text-2xl font-bold text-red-600">{event.no_show_count}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Pending
              </div>
              <div className="text-2xl font-bold">{event.pending_count}</div>
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

      {/* Registrations List */}
      <Card>
        <CardHeader>
          <CardTitle>Registrations ({registrations.length})</CardTitle>
          <CardDescription>View and manage attendee check-ins</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {registrations.map((registration) => (
              <div
                key={registration.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  registration.no_show_history_count > 1 ? 'border-yellow-500 bg-yellow-50' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-semibold">{registration.user_name}</div>
                      <div className="text-sm text-muted-foreground">{registration.user_email}</div>
                    </div>
                    {registration.no_show_history_count > 1 && (
                      <div className="flex items-center gap-1 text-yellow-600 text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Frequent no-show ({registration.no_show_history_count} times)</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="capitalize">{registration.user_role}</span>
                    <span>Registered: {new Date(registration.registered_at).toLocaleDateString('en-IN')}</span>
                    {registration.checked_in_at && (
                      <span>Checked in: {new Date(registration.checked_in_at).toLocaleString('en-IN')}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(registration.attendance_status)}
                  
                  {registration.attendance_status === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAttended(registration.id)}
                        disabled={updateAttendanceMutation.isPending}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Mark Attended
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkNoShow(registration.id)}
                        disabled={updateAttendanceMutation.isPending}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        No Show
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Admin Events Page
 * 
 * Lists all events with attendance management capabilities
 * Provides access to check-in/out functionality for admins
 * 
 * E2E Tests: EA-E2E-002, EA-E2E-003, EA-E2E-004
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, MapPin, Users, ClipboardList, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  date: string;
  event_date: string;
  location: string;
  venue_name?: string;
  max_attendees?: number;
  status: string;
  event_type: string;
  registration_count?: number;
  rsvp_count?: number;
  checked_in_count?: number;
  attended_count?: number;
}

export default function AdminEvents() {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  // Fetch all events
  const { data: events, isLoading, error } = useQuery<Event[]>({
    queryKey: ['admin-events'],
    queryFn: async () => {
      const response = await fetch('/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    },
    enabled: !!user && !!token, // Only fetch if user is logged in
  });

  // Redirect to login if not authenticated (useEffect to avoid calling navigate during render)
  React.useEffect(() => {
    if (!user || !token) {
      navigate('/login');
    }
  }, [user, token, navigate]);

  // Don't render if not logged in
  if (!user || !token) {
    return null;
  }

  const formatEventDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'EEEE, MMMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Event Management</h1>
          <p className="text-muted-foreground">
            Manage event attendance, check-ins, and certificates
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4" data-testid="admin-events-loading">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : error ? (
          <Card data-testid="admin-events-error">
            <CardContent className="pt-6">
              <p className="text-center text-destructive">
                Error loading events. Please try again.
              </p>
            </CardContent>
          </Card>
        ) : !events || events.length === 0 ? (
          <Card data-testid="admin-events-empty">
            <CardContent className="pt-6 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">No events found</p>
              <p className="text-muted-foreground">
                Events will appear here once they are created.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Card 
                key={event.id} 
                data-testid="admin-event-row"
                className="hover:border-primary transition-colors"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-1">
                            {event.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge variant={event.status === 'upcoming' ? 'default' : 'secondary'}>
                              {event.status}
                            </Badge>
                            {event.event_type && (
                              <Badge variant="outline">
                                {event.event_type.replace(/_/g, ' ')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatEventDate(event.date || event.event_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{event.venue_name || event.location}</span>
                        </div>
                        {event.max_attendees && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>
                              Capacity: {event.registration_count || event.rsvp_count || 0} / {event.max_attendees}
                            </span>
                          </div>
                        )}
                        {(event.checked_in_count !== undefined || event.attended_count !== undefined) && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <ClipboardList className="h-4 w-4" />
                            <span>
                              Attended: {event.attended_count || event.checked_in_count || 0}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => navigate(`/moderator/events/${event.id}/attendance`)}
                        data-testid="manage-attendance"
                        variant="default"
                        className="whitespace-nowrap"
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Manage Attendance
                      </Button>
                      <Button
                        onClick={() => navigate(`/events/${event.slug}`)}
                        variant="outline"
                        size="sm"
                      >
                        View Details
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Calendar, MapPin, X, ArrowRight, Clock, Ticket, CalendarDays } from "lucide-react";
import { useMyRegistrations, useCancelRegistration, EVENT_TYPE_LABELS } from "@/hooks/useEvents";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO, isFuture, isPast } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function MyRegistrationsPage() {
  const { user } = useAuth();
  const { data: registrations, isLoading } = useMyRegistrations();
  const cancelMutation = useCancelRegistration();

  const upcomingRegistrations = registrations?.filter(
    r => r.events && isFuture(parseISO(r.events.date))
  ) || [];

  const pastRegistrations = registrations?.filter(
    r => r.events && isPast(parseISO(r.events.date))
  ) || [];

  const formatTime = (time: string | undefined | null) => {
    if (!time) return '';
    try {
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return format(date, 'h:mm a');
    } catch {
      return time;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <Ticket className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-8">
            Please sign in to view your event registrations.
          </p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-accent/10">
                <Ticket className="h-6 w-6 text-accent" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">My Registrations</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              View and manage your event registrations. Cancel or review upcoming events you've signed up for.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="space-y-4 max-w-4xl">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <Tabs defaultValue="upcoming" className="max-w-4xl">
            <TabsList className="mb-6">
              <TabsTrigger value="upcoming" className="gap-2">
                <CalendarDays className="h-4 w-4" />
                Upcoming ({upcomingRegistrations.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="gap-2">
                <Clock className="h-4 w-4" />
                Past ({pastRegistrations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              {upcomingRegistrations.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Upcoming Registrations</h3>
                    <p className="text-muted-foreground mb-6">
                      You haven't registered for any upcoming events yet.
                    </p>
                    <Button asChild>
                      <Link to="/events">Browse Events</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {upcomingRegistrations.map((registration) => (
                    <Card key={registration.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          {/* Date Column */}
                          <div className="bg-accent/10 p-6 flex flex-col items-center justify-center min-w-[120px]">
                            <span className="text-3xl font-bold text-accent">
                              {registration.events?.date ? format(parseISO(registration.events.date), 'd') : '—'}
                            </span>
                            <span className="text-sm font-medium text-accent">
                              {registration.events?.date ? format(parseISO(registration.events.date), 'MMM yyyy') : ''}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs">
                                    {EVENT_TYPE_LABELS[registration.events?.event_type] || 'Event'}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                    Confirmed
                                  </Badge>
                                </div>
                                <h3 className="text-xl font-semibold">
                                  <Link 
                                    to={`/events/${registration.events?.slug || registration.eventId || registration.event_id}`}
                                    className="hover:text-accent transition-colors"
                                  >
                                    {registration.events?.title || 'Event'}
                                  </Link>
                                </h3>
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                  {(registration.events?.start_time || registration.events?.end_time) && (
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="h-4 w-4" />
                                      {formatTime(registration.events?.start_time)}
                                      {registration.events?.end_time && ` - ${formatTime(registration.events.end_time)}`}
                                    </div>
                                  )}
                                  {(registration.events?.venue_name || registration.events?.location) && (
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="h-4 w-4" />
                                      {registration.events?.venue_name || registration.events?.location}
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground pt-1">
                                  Registered on {registration.registered_at ? format(parseISO(registration.registered_at), 'MMM d, yyyy') : 'N/A'}
                                </p>
                              </div>

                              <div className="flex gap-2 sm:flex-col">
                                <Button variant="outline" size="sm" asChild className="flex-1">
                                  <Link to={`/events/${registration.events?.slug || registration.eventId || registration.event_id}`}>
                                    View Details
                                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                  </Link>
                                </Button>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                      <X className="h-3.5 w-3.5 mr-1.5" />
                                      Cancel
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Cancel Registration?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to cancel your registration for{" "}
                                        <strong>{registration.events?.title || 'this event'}</strong>? 
                                        You can register again later if spots are still available.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Keep Registration</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => cancelMutation.mutate(registration.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Cancel Registration
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past">
              {pastRegistrations.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Past Events</h3>
                    <p className="text-muted-foreground">
                      You haven't attended any events yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pastRegistrations.map((registration) => (
                    <Card key={registration.id} className="overflow-hidden opacity-75">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          {/* Date Column */}
                          <div className="bg-muted p-6 flex flex-col items-center justify-center min-w-[120px]">
                            <span className="text-3xl font-bold text-muted-foreground">
                              {registration.events?.date ? format(parseISO(registration.events.date), 'd') : '—'}
                            </span>
                            <span className="text-sm font-medium text-muted-foreground">
                              {registration.events?.date ? format(parseISO(registration.events.date), 'MMM yyyy') : ''}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs">
                                    {EVENT_TYPE_LABELS[registration.events?.event_type] || 'Event'}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    Attended
                                  </Badge>
                                </div>
                                <h3 className="text-xl font-semibold">
                                  {registration.events?.title || 'Event'}
                                </h3>
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                  {(registration.events?.venue_name || registration.events?.location) && (
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="h-4 w-4" />
                                      {registration.events?.venue_name || registration.events?.location}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/events/${registration.events?.slug || registration.eventId || registration.event_id}`}>
                                  View Recap
                                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </section>

      <Footer />
    </div>
  );
}

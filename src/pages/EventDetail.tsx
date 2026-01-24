import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import EventRegistrationForm from "@/components/events/EventRegistrationForm";
import WaitlistForm from "@/components/events/WaitlistForm";
import { 
  useEvent, 
  useRegistrationCount, 
  useMyRegistrations,
  EVENT_TYPE_LABELS 
} from "@/hooks/useEvents";
import { useWaitlistPosition, useWaitlistCount, useLeaveWaitlist } from "@/hooks/useWaitlist";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ArrowLeft, 
  Lock, 
  Star,
  User,
  CheckCircle,
  ClockIcon
} from "lucide-react";
import { format, parseISO } from "date-fns";

export default function EventDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading, error } = useEvent(slug || "");
  const { data: registrationCount } = useRegistrationCount(event?.id || "");
  const { data: myRegistrations } = useMyRegistrations();
  const { data: waitlistEntry } = useWaitlistPosition(event?.id || "");
  const { data: waitlistCount } = useWaitlistCount(event?.id || "");
  const leaveWaitlistMutation = useLeaveWaitlist();
  const { user } = useAuth();
  const [showRegistration, setShowRegistration] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);

  const isRegistered = myRegistrations?.some(
    r => r.event_id === event?.id && r.status === 'registered'
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-12 w-2/3 mb-4" />
          <Skeleton className="h-6 w-1/3 mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/events">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  };

  const spotsLeft = event.max_attendees 
    ? event.max_attendees - (registrationCount || 0)
    : null;

  const isRegistrationOpen = event.status === 'upcoming' && 
    (!event.registration_deadline || new Date(event.registration_deadline) >= new Date()) &&
    (spotsLeft === null || spotsLeft > 0);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Back Link */}
      <div className="container mx-auto px-4 pt-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All Events
          </Link>
        </Button>
      </div>

      {/* Event Header */}
      <section className="container mx-auto px-4 pb-8">
        <div className="max-w-4xl">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="font-medium">
              {EVENT_TYPE_LABELS[event.event_type]}
            </Badge>
            {event.is_featured && (
              <Badge variant="default" className="bg-accent text-accent-foreground gap-1">
                <Star className="h-3 w-3" />
                Featured
              </Badge>
            )}
            {event.is_members_only && (
              <Badge variant="secondary" className="gap-1">
                <Lock className="h-3 w-3" />
                Members Only
              </Badge>
            )}
            {event.status === 'completed' && (
              <Badge variant="secondary">Past Event</Badge>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>
          
          <div className="flex flex-wrap gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              <span>{format(parseISO(event.date), 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              <span>{formatTime(event.start_time)} - {formatTime(event.end_time)} IST</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">About This Event</h2>
                <p className="text-muted-foreground whitespace-pre-line">
                  {event.description}
                </p>
              </CardContent>
            </Card>

            {/* Agenda */}
            {event.agenda && event.agenda.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Agenda</h2>
                  <div className="space-y-4">
                    {event.agenda.map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-start">
                        <div className="text-sm font-mono text-accent font-semibold w-20 flex-shrink-0">
                          {item.time}
                        </div>
                        <div className="flex-1 pb-4 border-b last:border-0 last:pb-0">
                          {item.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Speakers */}
            {event.speakers && event.speakers.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Speakers</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {event.speakers.map((speaker, idx) => (
                      <div key={idx} className="flex gap-4 items-start p-4 bg-muted/50 rounded-lg">
                        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-6 w-6 text-accent" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{speaker.name}</h4>
                          <p className="text-sm text-muted-foreground">{speaker.role}</p>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {speaker.topic}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Registration */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-6">
                {/* Venue */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-accent" />
                    Venue
                  </h3>
                  <p className="font-medium">{event.venue_name || event.location}</p>
                  {event.venue_address && (
                    <p className="text-sm text-muted-foreground mt-1">{event.venue_address}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                </div>

                {/* Capacity */}
                {event.max_attendees && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4 text-accent" />
                      Capacity
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {registrationCount || 0} / {event.max_attendees} registered
                    </p>
                    {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 20 && (
                      <p className="text-sm text-orange-600 font-medium mt-1">
                        Only {spotsLeft} spots left!
                      </p>
                    )}
                    {spotsLeft === 0 && (
                      <>
                        <p className="text-sm text-destructive font-medium mt-1">
                          Sold out
                        </p>
                        {(waitlistCount ?? 0) > 0 && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {waitlistCount} on waitlist
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Registration Deadline */}
                {event.registration_deadline && event.status === 'upcoming' && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Registration closes: </span>
                    <span className="font-medium">
                      {format(parseISO(event.registration_deadline), 'MMMM d, yyyy')}
                    </span>
                  </div>
                )}
                {event.registration_deadline && event.status === 'upcoming' && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Registration closes: </span>
                    <span className="font-medium">
                      {format(parseISO(event.registration_deadline), 'MMMM d, yyyy')}
                    </span>
                  </div>
                )}

                {/* Registration Button */}
                {event.status === 'upcoming' && (
                  <>
                    {isRegistered ? (
                      <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-700 dark:text-green-300">
                          You're registered!
                        </span>
                      </div>
                    ) : waitlistEntry ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                          <ClockIcon className="h-5 w-5 text-amber-600" />
                          <div>
                            <span className="font-medium text-amber-700 dark:text-amber-300 block">
                              You're on the waitlist
                            </span>
                            <span className="text-sm text-amber-600 dark:text-amber-400">
                              Position #{waitlistEntry.position}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => leaveWaitlistMutation.mutate(waitlistEntry.id)}
                          disabled={leaveWaitlistMutation.isPending}
                        >
                          Leave Waitlist
                        </Button>
                      </div>
                    ) : isRegistrationOpen ? (
                      <Button 
                        variant="accent" 
                        size="lg" 
                        className="w-full"
                        onClick={() => setShowRegistration(true)}
                      >
                        Register Now
                      </Button>
                    ) : spotsLeft === 0 ? (
                      <Button 
                        variant="secondary" 
                        size="lg" 
                        className="w-full"
                        onClick={() => setShowWaitlist(true)}
                      >
                        <ClockIcon className="mr-2 h-4 w-4" />
                        Join Waitlist
                      </Button>
                    ) : (
                      <Button variant="secondary" size="lg" className="w-full" disabled>
                        Registration Closed
                      </Button>
                    )}
                  </>
                )}

                {event.status === 'completed' && (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-muted-foreground">This event has ended</p>
                  </div>
                )}

                {/* Members Only Notice */}
                {event.is_members_only && !user && (
                  <p className="text-sm text-muted-foreground text-center">
                    This event is for members only.{" "}
                    <Link to="/apply/investor" className="text-accent underline">
                      Become a member
                    </Link>
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Registration Modal */}
      <EventRegistrationForm 
        event={event}
        open={showRegistration}
        onOpenChange={setShowRegistration}
      />

      {/* Waitlist Modal */}
      <WaitlistForm
        event={event}
        open={showWaitlist}
        onOpenChange={setShowWaitlist}
      />

      <Footer />
    </div>
  );
}

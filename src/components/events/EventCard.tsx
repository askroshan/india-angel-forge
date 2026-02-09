import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, ArrowRight, Lock, Star } from "lucide-react";
import { Event, EVENT_TYPE_LABELS, useRegistrationCount } from "@/hooks/useEvents";
import { format, parseISO } from "date-fns";

interface EventCardProps {
  event: Event;
  showFullDetails?: boolean;
}

export default function EventCard({ event, showFullDetails = false }: EventCardProps) {
  const { data: registrationCount } = useRegistrationCount(event.id);
  
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  };

  const spotsLeft = (event.capacity ?? event.max_attendees) 
    ? (event.capacity ?? event.max_attendees)! - (registrationCount || 0)
    : null;

  const isRegistrationOpen = event.status === 'upcoming' && 
    (!event.registrationDeadline && !event.registration_deadline || 
     new Date(event.registrationDeadline || event.registration_deadline!) >= new Date());

  return (
    <Card 
      className={`border-2 hover:border-accent transition-all ${
        event.is_featured ? "border-accent shadow-lg" : ""
      }`}
      data-testid="event-card"
    >
      <CardContent className="p-6">
        <div className="grid md:grid-cols-[1fr,auto] gap-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-xl md:text-2xl font-semibold">{event.title}</h3>
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
                </div>
                {event.event_type && (
                  <Badge variant="outline" className="font-medium">
                    {EVENT_TYPE_LABELS[event.event_type]}
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-muted-foreground line-clamp-2">{event.description}</p>

            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-accent flex-shrink-0" />
                <span>{format(parseISO(event.eventDate || event.date!), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              {event.start_time && event.end_time && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-accent flex-shrink-0" />
                  <span>{formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-accent flex-shrink-0" />
                <span>{event.venue_name || event.location}</span>
              </div>
              {event.max_attendees && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-accent flex-shrink-0" />
                  <span>
                    {spotsLeft !== null && spotsLeft > 0 
                      ? `${spotsLeft} spots remaining`
                      : spotsLeft === 0 
                        ? 'Sold out'
                        : `${event.max_attendees} attendees max`
                    }
                  </span>
                </div>
              )}
            </div>

            {showFullDetails && event.speakers && event.speakers.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-semibold mb-2">Featured Speakers</h4>
                <div className="flex flex-wrap gap-2">
                  {event.speakers.map((speaker, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {speaker.name} - {speaker.role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {event.registration_deadline && isRegistrationOpen && (
              <div className="pt-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Registration closes: {format(parseISO(event.registration_deadline), 'MMMM d, yyyy')}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col items-stretch md:items-end justify-center gap-3">
            {event.status === 'upcoming' && (
              <Button variant="accent" asChild className="w-full md:w-auto" data-testid="event-register-button">
                <Link to={`/events/${event.slug || event.id}`}>
                  {isRegistrationOpen ? 'Register' : 'View Details'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
            {event.status === 'completed' && (
              <Button variant="outline" asChild className="w-full md:w-auto">
                <Link to={`/events/${event.slug || event.id}`}>
                  View Recap
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

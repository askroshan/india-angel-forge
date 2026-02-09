import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, X, ArrowRight } from "lucide-react";
import { useMyRegistrations, useCancelRegistration, EVENT_TYPE_LABELS } from "@/hooks/useEvents";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO, isFuture } from "date-fns";
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

export default function MyRegistrations() {
  const { user } = useAuth();
  const { data: registrations, isLoading } = useMyRegistrations();
  const cancelMutation = useCancelRegistration();

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Registrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const upcomingRegistrations = registrations?.filter(
    r => r.events && isFuture(parseISO(r.events.date))
  ) || [];

  if (upcomingRegistrations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-6">
            You haven't registered for any upcoming events yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Registrations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingRegistrations.map((registration) => (
          <div 
            key={registration.id} 
            className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg"
            data-testid="my-event-item"
          >
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold">{registration.events.title}</h4>
                  <Badge variant="outline" className="text-xs mt-1">
                    {EVENT_TYPE_LABELS[registration.events.event_type]}
                  </Badge>
                </div>
                <Badge variant="secondary" className="text-xs" data-testid="rsvp-status-badge">
                  Confirmed
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(parseISO(registration.events.date), 'MMM d, yyyy')}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {registration.events.location}
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col gap-2">
              <Button variant="outline" size="sm" asChild className="flex-1">
                <Link to={`/events/${registration.events.slug}`}>
                  View
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 text-destructive hover:text-destructive"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Registration?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel your registration for{" "}
                      <strong>{registration.events.title}</strong>? 
                      You can register again if spots are available.
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
        ))}
      </CardContent>
    </Card>
  );
}

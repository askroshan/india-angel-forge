import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import EventCard from "@/components/events/EventCard";
import EventTypeCards from "@/components/events/EventTypeCards";
import ForumProcess from "@/components/events/ForumProcess";
import MyRegistrations from "@/components/events/MyRegistrations";
import { useEvents } from "@/hooks/useEvents";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarDays, History } from "lucide-react";

export default function Events() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  
  const { data: upcomingEvents, isLoading: loadingUpcoming } = useEvents('upcoming');
  const { data: pastEvents, isLoading: loadingPast } = useEvents('past');

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-hero py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-primary-foreground">Events & Forums</h1>
            <p className="text-xl text-primary-foreground/90">
              Connect with founders and investors at our monthly forums and sector summits
            </p>
          </div>
        </div>
      </section>

      {/* Event Types */}
      <section className="py-16 bg-muted/30 border-b">
        <div className="container mx-auto px-4">
          <EventTypeCards />
        </div>
      </section>

      {/* My Registrations (for logged-in users) */}
      {user && (
        <section className="py-12 border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <MyRegistrations />
          </div>
        </section>
      )}

      {/* Events Tabs */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Tabs 
            value={activeTab} 
            onValueChange={(v) => setActiveTab(v as 'upcoming' | 'past')}
            className="max-w-5xl mx-auto"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <h2>Browse Events</h2>
              <TabsList>
                <TabsTrigger value="upcoming" className="gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Upcoming
                </TabsTrigger>
                <TabsTrigger value="past" className="gap-2">
                  <History className="h-4 w-4" />
                  Past Events
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="upcoming" className="space-y-6">
              {loadingUpcoming ? (
                <>
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-48 w-full" />
                </>
              ) : upcomingEvents && upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    No upcoming events scheduled at the moment.
                  </p>
                  <p className="text-muted-foreground mt-2">
                    Check back soon or subscribe to our newsletter for updates.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-6">
              {loadingPast ? (
                <>
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-48 w-full" />
                </>
              ) : pastEvents && pastEvents.length > 0 ? (
                pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    No past events to display.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* How Forums Work */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2>How Our Forums Work</h2>
              <p className="text-lg text-muted-foreground mt-4">
                A structured format designed for efficiency and impact
              </p>
            </div>
            <ForumProcess />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-primary-foreground">Join Our Next Event</h2>
            <p className="text-xl text-primary-foreground/90">
              Become a member to access all our forums and summits
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="hero" asChild>
                <Link to="/investors#plans">Become a Member</Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-background hover:bg-background/90"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setActiveTab('upcoming');
                }}
              >
                View All Events
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

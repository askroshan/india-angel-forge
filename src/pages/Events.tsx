import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { CalendarDays, History, Search, X } from "lucide-react";

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata'];

export default function Events() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [publicEvents, setPublicEvents] = useState<Array<{ id: string; title: string; date: string; location: string | null; type: string | null }>>([]);

  useEffect(() => {
    fetch('/api/events/public-calendar')
      .then(r => r.json())
      .then(data => {
        if (data.success) setPublicEvents(data.data ?? []);
      })
      .catch(() => {});
  }, []);
  
  const filterOptions = {
    search: searchQuery || undefined,
    city: cityFilter || undefined,
  };

  const { data: upcomingEvents, isLoading: loadingUpcoming } = useEvents('upcoming', filterOptions);
  const { data: pastEvents, isLoading: loadingPast } = useEvents('past', filterOptions);

  const hasFilters = searchQuery || cityFilter;

  const clearFilters = () => {
    setSearchQuery('');
    setCityFilter('');
  };

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

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6" data-testid="event-filters">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="event-search"
                />
              </div>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-full sm:w-[180px]" data-testid="event-city-filter">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {CITIES.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1" data-testid="clear-filters">
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
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

      {/* US-NEW-002: Public Forum Calendar — visible to all visitors without auth */}
      <section className="py-12 bg-muted/20 border-t" data-testid="public-forum-calendar">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Forum Calendar</h2>
          {publicEvents.length === 0 ? (
            <p className="text-muted-foreground text-sm">No upcoming events scheduled. Check back soon.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {publicEvents.map(ev => (
                <div
                  key={ev.id}
                  data-testid={`calendar-event-${ev.id}`}
                  className="rounded-lg border bg-card p-4 space-y-1 shadow-sm"
                >
                  <p className="font-semibold text-sm">{ev.title}</p>
                  {ev.date && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                  {ev.location && (
                    <p className="text-xs text-muted-foreground">{ev.location}</p>
                  )}
                  {ev.type && (
                    <span className="inline-block text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5">{ev.type}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

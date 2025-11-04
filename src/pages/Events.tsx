import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Calendar, MapPin, Users, Clock, ArrowRight } from "lucide-react";

const Events = () => {
  const upcomingEvents = [
    {
      title: "March Forum - Mumbai",
      date: "March 15, 2025",
      time: "2:00 PM - 6:00 PM IST",
      location: "Mumbai, Maharashtra",
      type: "Monthly Forum",
      description: "Monthly pitch forum featuring 6 pre-vetted startups across AI, fintech, and healthcare sectors.",
      spots: "6 companies presenting",
      attendees: "50-80 angels expected"
    },
    {
      title: "AI & Deep Tech Summit",
      date: "March 28, 2025",
      time: "10:00 AM - 5:00 PM IST",
      location: "Bangalore, Karnataka",
      type: "Sector Summit",
      description: "Full-day summit focused on AI, ML, and deep tech opportunities. Featuring keynotes, panel discussions, and networking.",
      spots: "200+ attendees",
      attendees: "Investors, Founders, VCs"
    },
    {
      title: "April Forum - Bangalore",
      date: "April 12, 2025",
      time: "2:00 PM - 6:00 PM IST",
      location: "Bangalore, Karnataka",
      type: "Monthly Forum",
      description: "Monthly pitch forum with focus on SaaS and B2B tech companies.",
      spots: "8 companies presenting",
      attendees: "60-90 angels expected"
    },
    {
      title: "Fintech & Payments Summit",
      date: "April 20, 2025",
      time: "10:00 AM - 5:00 PM IST",
      location: "Delhi NCR",
      type: "Sector Summit",
      description: "Exploring the future of digital payments, neobanking, and financial inclusion in India.",
      spots: "150+ attendees",
      attendees: "Fintech experts & investors"
    },
    {
      title: "May Forum - Delhi NCR",
      date: "May 10, 2025",
      time: "2:00 PM - 6:00 PM IST",
      location: "Gurugram, Haryana",
      type: "Monthly Forum",
      description: "Monthly forum featuring climate tech, consumer brands, and healthtech startups.",
      spots: "7 companies presenting",
      attendees: "55-75 angels expected"
    },
    {
      title: "India Angel Summit 2025",
      date: "June 15, 2025",
      time: "9:00 AM - 7:00 PM IST",
      location: "Mumbai, Maharashtra",
      type: "Annual Summit",
      description: "Our flagship annual event bringing together the entire angel ecosystem. Keynotes, workshops, networking, and celebration.",
      spots: "500+ attendees",
      attendees: "Angels, Founders, VCs, Govt"
    }
  ];

  const eventTypes = [
    {
      type: "Monthly Forums",
      description: "Regular pitch events where 6-8 curated startups present to our member network",
      frequency: "Monthly",
      format: "Hybrid (In-person + Virtual)"
    },
    {
      type: "Sector Summits",
      description: "Deep-dive sessions on specific sectors with expert panels and networking",
      frequency: "Quarterly",
      format: "In-person"
    },
    {
      type: "Angel Education",
      description: "Workshops and bootcamps on angel investing, due diligence, and portfolio management",
      frequency: "Ongoing",
      format: "Hybrid"
    },
    {
      type: "Portfolio Gatherings",
      description: "Exclusive events for our portfolio companies and investor members",
      frequency: "Quarterly",
      format: "In-person"
    }
  ];

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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {eventTypes.map((event, index) => (
              <Card key={index} className="border-2">
                <CardContent className="pt-6 space-y-3">
                  <Calendar className="h-8 w-8 text-accent mb-2" />
                  <h3 className="font-semibold text-lg">{event.type}</h3>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                  <div className="pt-3 border-t space-y-1 text-xs text-muted-foreground">
                    <div>Frequency: {event.frequency}</div>
                    <div>Format: {event.format}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2>Upcoming Events</h2>
            <p className="text-lg text-muted-foreground mt-4">
              Join us at our next forum or summit
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-6">
            {upcomingEvents.map((event, index) => (
              <Card 
                key={index} 
                className={`border-2 hover:border-accent transition-all ${
                  event.type === "Annual Summit" ? "border-accent shadow-accent" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-[1fr,auto] gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-semibold">{event.title}</h3>
                            {event.type === "Annual Summit" && (
                              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accent text-accent-foreground">
                                Featured
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground font-medium">
                            {event.type}
                          </span>
                        </div>
                      </div>

                      <p className="text-muted-foreground">{event.description}</p>

                      <div className="grid sm:grid-cols-2 gap-4 pt-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-accent" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-accent" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-accent" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-accent" />
                          <span>{event.attendees}</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="text-sm font-medium text-accent">{event.spots}</div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Button variant="accent" className="w-full md:w-auto">
                        Register
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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

            <div className="space-y-6">
              {[
                {
                  step: "1",
                  title: "Pre-Event Materials",
                  desc: "Members receive pitch decks and exec summaries 48 hours before the forum"
                },
                {
                  step: "2",
                  title: "Company Presentations",
                  desc: "Each startup gets 10 minutes to pitch followed by 15 minutes of Q&A"
                },
                {
                  step: "3",
                  title: "Member Discussion",
                  desc: "Angels gather to discuss opportunities and form diligence pods"
                },
                {
                  step: "4",
                  title: "Networking",
                  desc: "Informal networking session with founders and fellow investors"
                },
                {
                  step: "5",
                  title: "Follow-up",
                  desc: "Interested angels schedule deep-dive sessions with founding teams"
                }
              ].map((item, index) => (
                <div key={index} className="flex gap-6 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent text-accent-foreground font-bold text-xl flex items-center justify-center">
                    {item.step}
                  </div>
                  <div className="pt-2">
                    <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
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
                <Link to="/apply/investor">Become a Member</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-background hover:bg-background/90">
                View Calendar
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Events;

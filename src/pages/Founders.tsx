import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { 
  FileText, 
  UserCheck, 
  Presentation, 
  Search, 
  Handshake,
  Calendar,
  Clock,
  CheckCircle,
  TrendingUp
} from "lucide-react";

const Founders = () => {
  const process = [
    {
      icon: FileText,
      title: "Apply Online",
      description: "Submit your application through our online portal. It's free and takes about 15 minutes.",
      time: "Day 1"
    },
    {
      icon: UserCheck,
      title: "Initial Screening",
      description: "Our team reviews applications using ACA best practices and sector-specific criteria.",
      time: "Week 1-2"
    },
    {
      icon: Presentation,
      title: "Screening Committee",
      description: "Selected startups present to our member screening committee.",
      time: "Week 3"
    },
    {
      icon: Search,
      title: "Forum Selection",
      description: "Top companies are invited to pitch at our monthly forum.",
      time: "Week 4"
    },
    {
      icon: Presentation,
      title: "Forum Pitch",
      description: "Present to 50-100 angels at our hybrid forum event.",
      time: "Month 2"
    },
    {
      icon: Search,
      title: "Due Diligence",
      description: "Interested angels form pods for collaborative deep dive.",
      time: "4-6 weeks"
    },
    {
      icon: Handshake,
      title: "Term Sheet & Closing",
      description: "Lead angels negotiate terms, SPV formed, and round closes.",
      time: "2-4 weeks"
    }
  ];

  const criteria = [
    "Pre-seed to Series A stage",
    "India nexus (founded or operating in India)",
    "Scalable business model",
    "Strong founding team",
    "Clear product-market fit indicators",
    "Addressable market of ₹1000+ Cr",
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: "Smart Capital",
      description: "Access 400+ experienced angels and family offices"
    },
    {
      icon: Clock,
      title: "Fast Process",
      description: "Average 8-12 weeks from application to close"
    },
    {
      icon: CheckCircle,
      title: "No Angel Tax",
      description: "Benefit from abolition of angel tax (FY 2025-26)"
    },
    {
      icon: Handshake,
      title: "Post-Investment Support",
      description: "GTM strategy, hiring, governance, and follow-on rounds"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-hero py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-primary-foreground">Raise Capital from India's Top Angels</h1>
            <p className="text-xl text-primary-foreground/90">
              Get funded by experienced investors who understand your market and can help you scale.
            </p>
            <Button size="lg" variant="hero" asChild>
              <Link to="#apply">Apply for Funding</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-muted/30 border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-accent">40+</div>
              <div className="text-sm text-muted-foreground mt-2">Funded Companies</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-accent">₹4 Cr</div>
              <div className="text-sm text-muted-foreground mt-2">Average Round Size</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-accent">8-12 Weeks</div>
              <div className="text-sm text-muted-foreground mt-2">Average Time to Close</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-accent">85%</div>
              <div className="text-sm text-muted-foreground mt-2">Follow-on Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* The Process */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2>Our Process</h2>
            <p className="text-lg text-muted-foreground mt-4">
              A structured, founder-friendly journey from application to investment
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {process.map((step, index) => (
              <Card key={index} className="border-2 hover:border-accent transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                      <step.icon className="h-6 w-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold">{step.title}</h3>
                        <span className="text-sm text-muted-foreground font-medium">{step.time}</span>
                      </div>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Selection Criteria */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2>What We Look For</h2>
              <p className="text-lg text-muted-foreground mt-4">
                We focus on high-quality startups with strong fundamentals
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {criteria.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-card rounded-lg border">
                  <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2>Why Raise from IAF?</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                    <benefit.icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2>Transparent Pricing</h2>
              <p className="text-lg text-muted-foreground mt-4">
                Founder-friendly economics
              </p>
            </div>

            <Card className="border-2">
              <CardContent className="p-8 space-y-6">
                <div className="flex justify-between items-center pb-6 border-b">
                  <span className="font-medium">Application Fee</span>
                  <span className="text-2xl font-bold text-accent">Free</span>
                </div>
                <div className="flex justify-between items-center pb-6 border-b">
                  <div>
                    <div className="font-medium">Forum Showcase Fee</div>
                    <div className="text-sm text-muted-foreground">Only upon selection to forum pitch</div>
                  </div>
                  <span className="text-2xl font-bold">₹50,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Dataroom & Diligence Prep</div>
                    <div className="text-sm text-muted-foreground">Optional support package</div>
                  </div>
                  <span className="text-2xl font-bold">₹40,000</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Forum Calendar */}
      <section id="calendar" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2>Upcoming Forums</h2>
            <p className="text-lg text-muted-foreground mt-4">
              We host monthly pitch forums across India
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              { date: "March 15, 2025", location: "Mumbai", spots: "6 slots" },
              { date: "April 12, 2025", location: "Bangalore", spots: "8 slots" },
              { date: "May 10, 2025", location: "Delhi NCR", spots: "7 slots" },
            ].map((forum, index) => (
              <Card key={index} className="border-2">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Calendar className="h-8 w-8 text-accent" />
                    <div>
                      <div className="font-semibold">{forum.date}</div>
                      <div className="text-sm text-muted-foreground">{forum.location}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-accent">{forum.spots}</div>
                    <div className="text-sm text-muted-foreground">available</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="apply" className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-primary-foreground">Ready to Get Funded?</h2>
            <p className="text-xl text-primary-foreground/90">
              Join 40+ companies that have raised capital through India Angel Forum
            </p>
            <Button size="lg" variant="hero">
              Start Your Application
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Founders;

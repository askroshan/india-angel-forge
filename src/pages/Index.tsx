import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import heroImage from "@/assets/hero-image.jpg";
import patternBg from "@/assets/pattern-bg.jpg";
import { 
  TrendingUp, 
  Users, 
  Target, 
  Shield, 
  Lightbulb, 
  BarChart,
  Calendar,
  CheckCircle,
  ArrowRight
} from "lucide-react";

const Index = () => {
  const stats = [
    { value: "₹160+ Cr", label: "Capital Deployed" },
    { value: "400+", label: "Active Members" },
    { value: "40+", label: "Portfolio Companies" },
    { value: "27%", label: "Average IRR" },
  ];

  const features = [
    {
      icon: Target,
      title: "Rigorous Curation",
      description: "Only top 1% of applications reach our forum stage through structured screening."
    },
    {
      icon: Users,
      title: "Expert Network",
      description: "Connect with 400+ accredited angels, family offices, and domain experts."
    },
    {
      icon: Shield,
      title: "Transparent Economics",
      description: "Clear fee structure with competitive SPV administration and carry terms."
    },
    {
      icon: Lightbulb,
      title: "Founder First",
      description: "Streamlined process, quick decisions, and post-investment support."
    },
    {
      icon: BarChart,
      title: "Data-Driven Diligence",
      description: "AI-assisted screening with sector-specific checklists and expert pods."
    },
    {
      icon: Calendar,
      title: "Active Deal Flow",
      description: "Monthly forums, quarterly sector summits, and continuous deal opportunities."
    }
  ];

  const sectors = [
    "AI & Deep Tech",
    "Fintech",
    "Healthcare",
    "Climate Tech",
    "SaaS",
    "Consumer",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-hero opacity-95"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(24, 30, 53, 0.95), rgba(24, 30, 53, 0.85)), url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl space-y-8">
            <h1 className="text-primary-foreground">
              India's Largest Angel Network for Exceptional Founders
            </h1>
            <p className="text-xl text-primary-foreground/90 leading-relaxed">
              Connecting accredited angels and family offices with top early-stage 
              startups through rigorous curation, transparent economics, and data-driven diligence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="hero" asChild>
              <Link to="/apply/founder">
                Apply for Funding
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-background hover:bg-background/90" asChild>
              <Link to="/apply/investor">Become a Member</Link>
            </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-subtle border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-accent">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why India Angel Forum */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="mb-4">Why India Angel Forum?</h2>
            <p className="text-lg text-muted-foreground">
              A national hub built on trusted curation, founder respect, 
              and transparent economics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-accent transition-all hover:shadow-lg">
                <CardContent className="pt-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              A streamlined process from application to investment
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* For Founders */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="text-2xl font-bold">For Founders</h3>
              </div>
              
              <div className="space-y-6">
                {[
                  { step: "1", title: "Apply Online", desc: "Submit your application - it's free" },
                  { step: "2", title: "Screening", desc: "Initial review by our expert team" },
                  { step: "3", title: "Forum Pitch", desc: "Present to our member network" },
                  { step: "4", title: "Due Diligence", desc: "Collaborative deep dive with interested angels" },
                  { step: "5", title: "Investment", desc: "Close your round and grow" }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

            <Button variant="accent" className="w-full mt-4" asChild>
              <Link to="/apply/founder">Learn More & Apply</Link>
            </Button>
            </div>

            {/* For Investors */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold">For Investors</h3>
              </div>
              
              <div className="space-y-6">
                {[
                  { step: "1", title: "Join as Member", desc: "Complete KYC and accreditation" },
                  { step: "2", title: "Access Deals", desc: "Review curated opportunities" },
                  { step: "3", title: "Collaborate", desc: "Join diligence pods and discussions" },
                  { step: "4", title: "Invest", desc: "Direct checks or SPV participation" },
                  { step: "5", title: "Portfolio Support", desc: "Track performance and follow-on rounds" }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

            <Button variant="default" className="w-full mt-4" asChild>
              <Link to="/apply/investor">View Membership Plans</Link>
            </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Sectors */}
      <section className="py-20 relative">
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url(${patternBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="container relative mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="mb-4">Focus Sectors</h2>
            <p className="text-lg text-muted-foreground">
              We invest across high-growth sectors with dedicated expert pods
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {sectors.map((sector, index) => (
              <div 
                key={index}
                className="px-6 py-3 rounded-full bg-card border-2 border-border hover:border-accent transition-all hover:shadow-md cursor-pointer"
              >
                <span className="font-medium">{sector}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-primary-foreground">
              Ready to Build the Future Together?
            </h2>
            <p className="text-xl text-primary-foreground/90">
              Whether you're raising capital or looking to invest, India Angel Forum 
              connects you with the right partners.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="hero" asChild>
              <Link to="/apply/founder">I'm a Founder</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-background hover:bg-background/90" asChild>
              <Link to="/apply/investor">I'm an Investor</Link>
            </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;

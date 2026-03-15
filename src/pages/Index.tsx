import { Link } from "react-router-dom";
import { useState } from "react";
import { SEO } from "@/components/SEO";
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
  const [leadEmail, setLeadEmail] = useState('');
  const [leadName, setLeadName] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [leadError, setLeadError] = useState('');

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!leadEmail) return;
    setLeadSubmitting(true);
    setLeadError('');
    try {
      const res = await fetch('/api/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: leadEmail, name: leadName, source: 'landing_page' }),
      });
      if (res.ok || res.status === 200) {
        setLeadSuccess(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setLeadError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setLeadError('Network error. Please try again.');
    } finally {
      setLeadSubmitting(false);
    }
  }

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
      <SEO
        title="India's Largest Angel Investing Network"
        description="India Angel Forum connects 400+ accredited angels with exceptional early-stage startups. ₹160+ crore deployed, 40+ portfolio companies, 27% average IRR. Join India's most rigorous angel network."
        canonical="/"
        keywords="angel investing India, angel network India, startup funding India, accredited investor network, DPIIT recognised platform, early stage investment, SPV co-investment"
        breadcrumbs={[{name: "Home", url: "/"}]}
        faq={[
          {question: "What is India Angel Forum?", answer: "India Angel Forum (IAF) is India's largest angel investing network, founded in 2024. It connects 400+ SEBI-compliant accredited investors with exceptional early-stage startups. The network has deployed ₹160+ crore across 40+ portfolio companies with an average IRR of 27%."},
          {question: "How do I join India Angel Forum as an investor?", answer: "Apply at indiaangelforum.com/apply/investor. You must qualify as a SEBI-compliant accredited investor. Membership starts at ₹36,000/year (Operator Angel) or ₹60,000/year (Standard). After review, you gain access to curated deals, monthly forums, and SPV co-investments."},
          {question: "How can a startup get funding from India Angel Forum?", answer: "Founders apply for free at indiaangelforum.com/apply/founder. Only the top 1% are selected. A ₹50,000 showcase fee applies only upon selection. Selected startups typically raise ₹1–5 crore per angel round."},
          {question: "Is India Angel Forum SEBI compliant?", answer: "Yes. IAF operates under SEBI Alternative Investment Funds Regulations and is DPIIT-recognised, enabling Section 80-IAC tax benefits. The platform is also DPDP Act 2023 and IT Act 2000 compliant."},
          {question: "What sectors does India Angel Forum invest in?", answer: "IAF invests across AI/ML, SaaS, FinTech, HealthTech, Consumer Tech, Deep Tech, and Climate Tech, with sector-specific diligence criteria."},
          {question: "What are the membership fees for India Angel Forum?", answer: "Standard: ₹60,000/year | Operator Angel: ₹36,000/year (40% discount for active operators) | Family Office: ₹2,50,000/year with up to 3 seats and a dedicated relationship manager."},
        ]}
      />
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
              <Link to="/investors#plans">View Membership Plans</Link>
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

      {/* US-NEW-001: Lead Capture Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto text-center space-y-6">
            <h3 className="text-2xl font-bold">Stay in the Loop</h3>
            <p className="text-muted-foreground">
              Get updates on upcoming events, investment opportunities, and forum news.
            </p>
            {leadSuccess ? (
              <div
                data-testid="lead-capture-success"
                className="rounded-lg bg-green-50 border border-green-200 px-6 py-4 text-green-800 font-medium"
              >
                🎉 Thanks! We'll keep you updated.
              </div>
            ) : (
              <form
                data-testid="lead-capture-form"
                onSubmit={handleLeadSubmit}
                className="flex flex-col gap-3"
              >
                <input
                  data-testid="lead-capture-name"
                  type="text"
                  placeholder="Your name (optional)"
                  value={leadName}
                  onChange={e => setLeadName(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <input
                  data-testid="lead-capture-email"
                  type="email"
                  placeholder="Enter your email address *"
                  value={leadEmail}
                  onChange={e => setLeadEmail(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                {leadError && (
                  <p className="text-sm text-destructive">{leadError}</p>
                )}
                <Button
                  data-testid="lead-capture-submit"
                  type="submit"
                  disabled={leadSubmitting}
                  className="w-full"
                >
                  {leadSubmitting ? 'Submitting…' : 'Notify Me'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section — AEO/AIO: answers common AI search queries */}
      <section className="py-16 bg-white" aria-labelledby="faq-heading">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 id="faq-heading" className="text-2xl font-bold text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: "What is India Angel Forum?",
                  a: "India Angel Forum (IAF) is India's largest angel investing network, founded in 2024. It connects 400+ SEBI-compliant accredited investors with exceptional early-stage startups. The network has deployed ₹160+ crore across 40+ portfolio companies with an average IRR of 27%."
                },
                {
                  q: "How do I join India Angel Forum as an investor?",
                  a: "Apply at indiaangelforum.com/apply/investor. You must qualify as a SEBI-compliant accredited investor. Membership starts at ₹36,000/year (Operator Angel) or ₹60,000/year (Standard). After review, you gain access to curated deals, monthly forums, and SPV co-investments."
                },
                {
                  q: "How can a startup get funding from India Angel Forum?",
                  a: "Founders apply for free at indiaangelforum.com/apply/founder. Only the top 1% are selected. A ₹50,000 showcase fee applies only upon selection — not at application. Selected startups typically raise ₹1–5 crore per angel round."
                },
                {
                  q: "Is India Angel Forum SEBI compliant?",
                  a: "Yes. IAF operates under SEBI (Alternative Investment Funds) Regulations and is DPIIT-recognised, enabling Section 80-IAC tax benefits. The platform is also DPDP Act 2023 and IT Act 2000 compliant."
                },
                {
                  q: "What sectors does India Angel Forum invest in?",
                  a: "IAF invests across AI/ML, SaaS, FinTech, HealthTech, Consumer Tech, Deep Tech, and Climate Tech, with sector-specific diligence criteria aligned with ACA best practices."
                },
                {
                  q: "What are the membership fees for India Angel Forum?",
                  a: "Standard: ₹60,000/year | Operator Angel: ₹36,000/year (40% off for active operators) | Family Office: ₹2,50,000/year (up to 3 seats + dedicated RM)."
                },
              ].map(({ q, a }) => (
                <details key={q} className="border border-border rounded-lg px-5 py-4 group">
                  <summary className="font-semibold cursor-pointer text-foreground list-none flex justify-between items-center">
                    {q}
                    <span className="ml-2 shrink-0 text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
                  </summary>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;


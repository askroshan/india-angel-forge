import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Check, Users, Target, Shield, TrendingUp, Database, Award, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Investors = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      toast({
        title: "Payment Successful!",
        description: "Welcome to India Angel Forum. Check your email for details.",
      });
    } else if (payment === "cancelled") {
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled. You can try again anytime.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  const handleCheckout = async (membershipType: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to purchase a membership.",
      });
      navigate("/auth", { state: { from: { pathname: "/investors#plans" } } });
      return;
    }

    setLoadingPlan(membershipType);
    try {
      const { data, error } = await supabase.functions.invoke("create-membership-checkout", {
        body: { membershipType },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleContactFamilyOffice = () => {
    navigate("/contact");
  };

  const membershipPlans = [
    {
      name: "Standard Member",
      price: "₹60,000",
      period: "/year",
      features: [
        "Access to all deal flow",
        "Monthly forum participation",
        "Diligence resources & templates",
        "Portfolio dashboard",
        "Quarterly sector summits",
        "Direct investment coordination",
        "Pro-rata rights management"
      ],
      cta: "Join as Standard Member",
      action: () => handleCheckout("standard"),
      popular: false,
      planKey: "standard"
    },
    {
      name: "Operator Angel",
      price: "₹36,000",
      period: "/year",
      features: [
        "All Standard Member benefits",
        "40% discount for active operators",
        "Priority sector pod access",
        "Office hours with founders",
        "Exclusive operator community",
      ],
      cta: "Apply for Operator Plan",
      action: () => handleCheckout("operator"),
      popular: true,
      planKey: "operator"
    },
    {
      name: "Family Office",
      price: "₹2,50,000",
      period: "/year",
      features: [
        "All Standard Member benefits",
        "Up to 3 seats included",
        "Dedicated relationship manager",
        "Custom deal sourcing",
        "Priority SPV allocation",
        "Quarterly portfolio reviews",
        "Enhanced analytics & reporting"
      ],
      cta: "Contact for Family Office",
      action: handleContactFamilyOffice,
      popular: false,
      planKey: "family"
    }
  ];

  const benefits = [
    {
      icon: Target,
      title: "Curated Deal Flow",
      description: "Only top 1% of applications reach our forum. Save time with pre-vetted opportunities."
    },
    {
      icon: Users,
      title: "Expert Network",
      description: "Learn from 400+ experienced angels and collaborate on due diligence."
    },
    {
      icon: Database,
      title: "SPV Infrastructure",
      description: "Seamless SPV formation, capital calls, and portfolio administration."
    },
    {
      icon: Shield,
      title: "Structured Diligence",
      description: "Access ACA-standard checklists, expert pods, and collaborative tools."
    },
    {
      icon: TrendingUp,
      title: "Portfolio Support",
      description: "Track performance, manage pro-rata, and access follow-on rounds."
    },
    {
      icon: Award,
      title: "AI Focus",
      description: "Dedicated AI/deep tech deals capturing the next wave of innovation."
    }
  ];

  const investmentFees = [
    {
      type: "Direct Check Coordination",
      fee: "1% of check amount",
      cap: "Capped at ₹50,000"
    },
    {
      type: "SPV Setup",
      fee: "₹3 lakh + 1% of raise",
      cap: "Capped at ₹10 lakh"
    },
    {
      type: "Platform Carry",
      fee: "5% carry on SPV deals",
      cap: "Lead sets backer carry (typically 10-15%)"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>For Investors - India Angel Forum</title>
        <meta
          name="description"
          content="Join India's largest angel network. Access curated deal flow, expert diligence, and SPV infrastructure. Membership plans starting at ₹36,000/year."
        />
        <link rel="canonical" href="https://indiaangelforum.com/investors" />
        <meta property="og:title" content="For Investors - India Angel Forum" />
        <meta
          property="og:description"
          content="Join 400+ angels and family offices backing the next generation of Indian unicorns. Curated deal flow, collaborative diligence, and transparent economics."
        />
        <meta property="og:url" content="https://indiaangelforum.com/investors" />
      </Helmet>

      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-hero py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-primary-foreground">
              Invest in India's Most Promising Startups
            </h1>
            <p className="text-xl text-primary-foreground/90">
              Join 400+ angels and family offices backing the next generation of Indian unicorns.
            </p>
            <Button size="lg" variant="hero" asChild>
              <a href="#plans">View Membership Plans</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-muted/30 border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-accent">27%</div>
              <div className="text-sm text-muted-foreground mt-2">Average IRR</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-accent">40+ SPVs</div>
              <div className="text-sm text-muted-foreground mt-2">Deployed in 2024</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-accent">125+</div>
              <div className="text-sm text-muted-foreground mt-2">Active Networks in India</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-accent">2.6x</div>
              <div className="text-sm text-muted-foreground mt-2">Avg Multiple (3.5 years)</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Join */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2>Why Join India Angel Forum?</h2>
            <p className="text-lg text-muted-foreground mt-4">
              Everything you need to succeed as an angel investor
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-2 hover:border-accent transition-all">
                <CardContent className="pt-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <benefit.icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Plans */}
      <section id="plans" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2>Membership Plans</h2>
            <p className="text-lg text-muted-foreground mt-4">
              Choose the plan that fits your investment style
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {membershipPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative border-2 ${
                  plan.popular 
                    ? 'border-accent shadow-accent' 
                    : 'border-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardContent className="pt-8 space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-accent">{plan.price}</span>
                      <span className="text-muted-foreground ml-2">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    variant={plan.popular ? "accent" : "default"} 
                    className="w-full"
                    onClick={plan.action}
                    disabled={loadingPlan === plan.planKey}
                  >
                    {loadingPlan === plan.planKey ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      plan.cta
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Fees */}
      <section id="deals" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2>Investment Processing Fees</h2>
              <p className="text-lg text-muted-foreground mt-4">
                Transparent pricing for deal execution
              </p>
            </div>

            <div className="space-y-4">
              {investmentFees.map((item, index) => (
                <Card key={index} className="border-2">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{item.type}</h3>
                      <p className="text-sm text-muted-foreground">{item.cap}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-accent">{item.fee}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 p-6 bg-muted/50 rounded-lg border">
              <h4 className="font-semibold mb-3">Note on Economics</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• SPV fees are paid by the SPV entity, not individual members</li>
                <li>• Carry accrues only on profitable exits</li>
                <li>• Direct check coordination fee is optional for self-organized deals</li>
                <li>• All fees are subject to applicable taxes</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2>Membership Requirements</h2>
              <p className="text-lg text-muted-foreground mt-4">
                To maintain quality and comply with regulations
              </p>
            </div>

            <Card className="border-2">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Shield className="h-5 w-5 text-accent" />
                    Accreditation Criteria
                  </h4>
                  <ul className="space-y-2 ml-7 text-muted-foreground">
                    <li>• Minimum net worth or income thresholds as per SEBI guidelines</li>
                    <li>• Valid PAN and Aadhaar for KYC</li>
                    <li>• Bank account verification</li>
                    <li>• Professional or investment experience (recommended)</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-accent" />
                    Member Expectations
                  </h4>
                  <ul className="space-y-2 ml-7 text-muted-foreground">
                    <li>• Active participation in forums and diligence</li>
                    <li>• Minimum annual check writing (suggested: 2-4 deals)</li>
                    <li>• Adherence to code of conduct</li>
                    <li>• Confidentiality and conflict disclosure</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="join" className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-primary-foreground">
              Start Your Angel Investing Journey
            </h2>
            <p className="text-xl text-primary-foreground/90">
              Join India's most active angel network and back exceptional founders
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="hero" asChild>
                <a href="#plans">View Membership Plans</a>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-background hover:bg-background/90"
                asChild
              >
                <Link to="/contact">Schedule a Call</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Investors;

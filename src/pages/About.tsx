import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Target, Heart, Shield, TrendingUp, Users2, Award } from "lucide-react";

const About = () => {
  const values = [
    {
      icon: Target,
      title: "Trusted Curation",
      description: "We maintain the highest standards in deal selection, ensuring quality over quantity."
    },
    {
      icon: Heart,
      title: "Founder Respect",
      description: "Fast decisions, clear communication, and genuine partnership with entrepreneurs."
    },
    {
      icon: Shield,
      title: "Transparent Economics",
      description: "No hidden fees. Clear terms. Aligned incentives between founders and investors."
    }
  ];

  const team = [
    {
      name: "Rajesh Kumar",
      role: "CEO & Co-Founder",
      bio: "Serial entrepreneur and angel investor with 15+ years in Indian startup ecosystem"
    },
    {
      name: "Priya Sharma",
      role: "Head of Platform",
      bio: "Former venture partner with expertise in deal sourcing and portfolio management"
    },
    {
      name: "Amit Patel",
      role: "Head of Diligence",
      bio: "Ex-investment banker specializing in early-stage financial and market analysis"
    }
  ];

  const advisors = [
    "Seasoned angel investors with 50+ successful exits",
    "Sector experts in AI, fintech, healthcare, and climate tech",
    "Former founders who have built and scaled companies to unicorn status",
    "Legal and regulatory experts in startup law and compliance"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-hero py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-primary-foreground">About India Angel Forum</h1>
            <p className="text-xl text-primary-foreground/90">
              Building India's largest and most trusted angel investor network
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2>Our Mission</h2>
            </div>
            <Card className="border-2 border-accent">
              <CardContent className="p-8 md:p-12">
                <p className="text-lg leading-relaxed text-center">
                  To become the largest Indian angel network that pairs rigorous curation 
                  with a founder-first experience. We act as a national hub connecting 
                  accredited angels, families, and micro funds with top founders from India 
                  and the diaspora, driving innovation and economic growth through smart capital 
                  and strategic support.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2>Our Values</h2>
            <p className="text-lg text-muted-foreground mt-4">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {values.map((value, index) => (
              <Card key={index} className="border-2 hover:border-accent transition-all text-center">
                <CardContent className="pt-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                    <value.icon className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats & Impact */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2>Our Impact</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-4xl font-bold text-accent mb-2">400+</div>
              <div className="text-sm text-muted-foreground">Angel Members</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">₹160 Cr+</div>
              <div className="text-sm text-muted-foreground">Capital Deployed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">40+</div>
              <div className="text-sm text-muted-foreground">Portfolio Companies</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">6</div>
              <div className="text-sm text-muted-foreground">Focus Sectors</div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2>Leadership Team</h2>
            <p className="text-lg text-muted-foreground mt-4">
              Experienced operators and investors dedicated to your success
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {team.map((member, index) => (
              <Card key={index} className="border-2">
                <CardContent className="pt-6 text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                    <Users2 className="h-10 w-10 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                    <p className="text-sm text-accent font-medium mb-3">{member.role}</p>
                    <p className="text-sm text-muted-foreground">{member.bio}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Advisory Board */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                <Award className="h-8 w-8 text-accent" />
              </div>
              <h2>Advisory Board</h2>
              <p className="text-lg text-muted-foreground mt-4">
                Guided by industry veterans and successful entrepreneurs
              </p>
            </div>

            <Card className="border-2">
              <CardContent className="p-8">
                <ul className="space-y-4">
                  {advisors.map((advisor, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground">{advisor}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Governance */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2>Governance & Compliance</h2>
              <p className="text-lg text-muted-foreground mt-4">
                Operating with the highest standards of transparency and integrity
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-2">
                <CardContent className="pt-6 space-y-4">
                  <Shield className="h-8 w-8 text-accent" />
                  <h3 className="text-lg font-semibold">Regulatory Compliance</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Full compliance with SEBI AIF regulations</li>
                    <li>• Adherence to Angel Tax guidelines</li>
                    <li>• KYC/AML procedures</li>
                    <li>• Regular audits and reporting</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6 space-y-4">
                  <TrendingUp className="h-8 w-8 text-accent" />
                  <h3 className="text-lg font-semibold">Operational Excellence</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Conflicts of interest disclosure</li>
                    <li>• Code of conduct for all members</li>
                    <li>• Transparent fee structure</li>
                    <li>• Member grievance mechanism</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="mb-4">Our Partners</h2>
            <p className="text-lg text-muted-foreground mb-12">
              Collaborating with leading institutions and networks
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-muted-foreground">
              <span>Angel Capital Association</span>
              <span>•</span>
              <span>IIT Startup Networks</span>
              <span>•</span>
              <span>Leading Incubators</span>
              <span>•</span>
              <span>Global Angel Networks</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-primary-foreground">Join Us in Building the Future</h2>
            <p className="text-xl text-primary-foreground/90">
              Whether you're an investor or founder, we'd love to hear from you
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="hero" asChild>
                <Link to="/apply/investor">Become a Member</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-background hover:bg-background/90">
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;

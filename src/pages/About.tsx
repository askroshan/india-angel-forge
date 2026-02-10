import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useTeamMembers, usePartners } from "@/hooks/useCMS";
import { Target, Heart, Shield, TrendingUp, Users2, Award, Linkedin, ExternalLink, Building2 } from "lucide-react";

const About = () => {
  const { data: teamMembers, isLoading: loadingTeam } = useTeamMembers();
  const { data: partners, isLoading: loadingPartners } = usePartners();

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

  const featuredInvestors = [
    {
      name: "Vikram Mehta",
      title: "Angel Investor & Operator",
      investments: "25+ investments",
      sectors: "AI, SaaS, Fintech",
      background: "Ex-CTO at Flipkart, IIT Delhi",
      initials: "VM",
      color: "bg-orange-500"
    },
    {
      name: "Sunita Reddy",
      title: "Family Office Partner",
      investments: "₹15 Cr+ deployed",
      sectors: "Healthcare, Consumer",
      background: "3rd gen entrepreneur, ISB Hyderabad",
      initials: "SR",
      color: "bg-pink-500"
    },
    {
      name: "Arjun Kapoor",
      title: "Serial Entrepreneur",
      investments: "15+ investments",
      sectors: "B2B SaaS, Climate Tech",
      background: "Founded & exited 2 companies, Stanford MBA",
      initials: "AK",
      color: "bg-teal-500"
    },
    {
      name: "Dr. Meera Singh",
      title: "Domain Expert Angel",
      investments: "12+ investments",
      sectors: "Healthcare, Biotech",
      background: "Former CMO, Apollo Hospitals",
      initials: "MS",
      color: "bg-red-500"
    },
    {
      name: "Karthik Sundaram",
      title: "Tech Operator Angel",
      investments: "20+ investments",
      sectors: "Deep Tech, AI/ML",
      background: "Ex-Google, IIT Madras",
      initials: "KS",
      color: "bg-indigo-500"
    },
    {
      name: "Nisha Agarwal",
      title: "Early Stage Investor",
      investments: "18+ investments",
      sectors: "Consumer, D2C",
      background: "Ex-McKinsey, Harvard Business School",
      initials: "NA",
      color: "bg-amber-500"
    }
  ];

  const advisors = [
    "Seasoned angel investors with 50+ successful exits",
    "Sector experts in AI, fintech, healthcare, and climate tech",
    "Former founders who have built and scaled companies to unicorn status",
    "Legal and regulatory experts in startup law and compliance"
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const avatarColors = [
    "bg-blue-600", "bg-purple-600", "bg-green-600", "bg-orange-500", 
    "bg-pink-500", "bg-teal-500", "bg-red-500", "bg-indigo-500"
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="about-page">
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

      {/* Team - CMS Driven */}
      <section className="py-20 bg-muted/30" data-testid="team-section">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2>Leadership Team</h2>
            <p className="text-lg text-muted-foreground mt-4">
              Experienced operators and investors dedicated to your success
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {loadingTeam ? (
              <>
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </>
            ) : teamMembers && teamMembers.length > 0 ? (
              teamMembers.map((member, index) => (
                <Card key={member.id} className="border-2 hover:border-accent transition-all" data-testid="team-member-card">
                  <CardContent className="pt-6 text-center space-y-4">
                    <Avatar className={`h-20 w-20 mx-auto ${!member.photoUrl ? avatarColors[index % avatarColors.length] : ''}`}>
                      {member.photoUrl ? (
                        <AvatarImage src={member.photoUrl} alt={member.name} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="text-white font-bold text-xl" data-testid="team-member-avatar">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center justify-center gap-2">
                        <h3 className="text-xl font-semibold" data-testid="team-member-name">{member.name}</h3>
                        {member.linkedinUrl && (
                          <a 
                            href={member.linkedinUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-accent"
                            aria-label={`${member.name}'s LinkedIn profile`}
                            data-testid="team-member-linkedin"
                          >
                            <Linkedin className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-accent font-medium mb-3" data-testid="team-member-role">{member.role}</p>
                      {member.bio && (
                        <p className="text-sm text-muted-foreground" data-testid="team-member-bio">{member.bio}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-8">
                <p className="text-muted-foreground">Team information coming soon.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Investors */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2>Featured Members</h2>
            <p className="text-lg text-muted-foreground mt-4">
              Meet some of our active angel investors
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {featuredInvestors.map((investor, index) => (
              <Card key={index} className="border-2 hover:border-accent transition-all">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <Avatar className={`h-14 w-14 ${investor.color}`}>
                      <AvatarFallback className="text-white font-bold">
                        {investor.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{investor.name}</h3>
                      <p className="text-sm text-accent">{investor.title}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Track Record:</span>
                      <span className="font-medium">{investor.investments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Focus:</span>
                      <span className="font-medium">{investor.sectors}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground border-t pt-3">
                    {investor.background}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Advisory Board */}
      <section className="py-20 bg-muted/30">
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

      {/* Partners - CMS Driven */}
      <section className="py-20" data-testid="partners-section">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="mb-4">Our Partners</h2>
            <p className="text-lg text-muted-foreground">
              Collaborating with leading institutions and networks
            </p>
          </div>

          {loadingPartners ? (
            <div className="flex justify-center gap-8">
              <Skeleton className="h-20 w-40" />
              <Skeleton className="h-20 w-40" />
              <Skeleton className="h-20 w-40" />
            </div>
          ) : partners && partners.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {partners.map((partner) => (
                <a
                  key={partner.id}
                  href={partner.websiteUrl || '#'}
                  target={partner.websiteUrl ? '_blank' : undefined}
                  rel={partner.websiteUrl ? 'noopener noreferrer' : undefined}
                  className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-muted/50 transition-colors group"
                  data-testid="partner-card"
                >
                  {partner.logoUrl ? (
                    <img 
                      src={partner.logoUrl} 
                      alt={partner.name} 
                      className="h-16 w-auto object-contain"
                      data-testid="partner-logo"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="text-center">
                    <span className="text-sm font-medium group-hover:text-accent transition-colors" data-testid="partner-name">
                      {partner.name}
                    </span>
                    {partner.websiteUrl && (
                      <ExternalLink className="inline-block ml-1 h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  {partner.description && (
                    <p className="text-xs text-muted-foreground text-center" data-testid="partner-description">
                      {partner.description}
                    </p>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center">
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
          )}
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
              <Button size="lg" variant="outline" className="bg-background hover:bg-background/90" asChild>
                <Link to="/contact">Contact Us</Link>
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

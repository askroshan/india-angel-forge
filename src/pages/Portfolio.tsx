import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Building2, TrendingUp, Users, Calendar, Globe, ExternalLink } from "lucide-react";

const Portfolio = () => {
  const [selectedSector, setSelectedSector] = useState("All");

  const sectors = ["All", "AI & Deep Tech", "Fintech", "Healthcare", "SaaS", "Consumer", "Climate Tech"];

  const companies = [
    {
      name: "NeuralMind AI",
      sector: "AI & Deep Tech",
      stage: "Series A",
      year: 2024,
      description: "Enterprise AI platform for automated document processing and business intelligence. Processing 10M+ documents monthly for Fortune 500 clients.",
      metrics: { raised: "₹12 Cr", team: "32", mrr: "₹45L" },
      founders: ["Arjun Mehta", "Sneha Reddy"],
      logo: "NM",
      color: "bg-violet-500",
      website: "https://neuralmind.ai",
      status: "active"
    },
    {
      name: "PayStack India",
      sector: "Fintech",
      stage: "Seed",
      year: 2024,
      description: "Neo-banking platform for SME cash flow management with embedded lending. 15,000+ active businesses onboarded.",
      metrics: { raised: "₹5.5 Cr", team: "18", mrr: "₹28L" },
      founders: ["Vikram Joshi", "Priya Nair"],
      logo: "PS",
      color: "bg-emerald-500",
      website: "https://paystack.in",
      status: "active"
    },
    {
      name: "MediBridge",
      sector: "Healthcare",
      stage: "Series A",
      year: 2023,
      description: "Telemedicine and diagnostic marketplace connecting tier 2/3 cities with specialist doctors. 500K+ consultations completed.",
      metrics: { raised: "₹8 Cr", team: "45", mrr: "₹65L" },
      founders: ["Dr. Rakesh Kumar", "Ananya Sharma"],
      logo: "MB",
      color: "bg-red-500",
      website: "https://medibridge.health",
      status: "active"
    },
    {
      name: "CloudNative.io",
      sector: "SaaS",
      stage: "Seed",
      year: 2024,
      description: "DevOps automation platform for Indian enterprises. Reducing deployment time by 80% for 200+ engineering teams.",
      metrics: { raised: "₹4.5 Cr", team: "22", mrr: "₹32L" },
      founders: ["Karthik Sundaram", "Neha Gupta"],
      logo: "CN",
      color: "bg-blue-500",
      website: "https://cloudnative.io",
      status: "active"
    },
    {
      name: "SolarGrid Technologies",
      sector: "Climate Tech",
      stage: "Pre-seed",
      year: 2024,
      description: "AI-powered solar energy optimization for commercial buildings. Improving efficiency by 35% across 50+ installations.",
      metrics: { raised: "₹2.5 Cr", team: "12", mrr: "₹8L" },
      founders: ["Amit Patel", "Divya Krishnan"],
      logo: "SG",
      color: "bg-yellow-500",
      website: "https://solargrid.tech",
      status: "active"
    },
    {
      name: "Bharat Commerce",
      sector: "Consumer",
      stage: "Series A",
      year: 2023,
      description: "Social commerce platform for regional brands and artisans. GMV of ₹150 Cr+ with 2M+ monthly active users.",
      metrics: { raised: "₹15 Cr", team: "55", mrr: "₹1.2Cr" },
      founders: ["Rajesh Verma", "Meera Singh"],
      logo: "BC",
      color: "bg-orange-500",
      website: "https://bharatcommerce.in",
      status: "active"
    },
    {
      name: "FraudShield",
      sector: "Fintech",
      stage: "Seed",
      year: 2023,
      description: "Real-time fraud detection for digital payments using ML. Protecting ₹5000 Cr+ in transactions monthly.",
      metrics: { raised: "₹6 Cr", team: "25", mrr: "₹40L" },
      founders: ["Sanjay Kapoor", "Ritu Agarwal"],
      logo: "FS",
      color: "bg-slate-600",
      website: "https://fraudshield.ai",
      status: "active"
    },
    {
      name: "KrishiTech",
      sector: "AI & Deep Tech",
      stage: "Seed",
      year: 2024,
      description: "AI-powered crop yield prediction and farm-to-market platform. Serving 100,000+ farmers across 5 states.",
      metrics: { raised: "₹4 Cr", team: "20", mrr: "₹15L" },
      founders: ["Suresh Yadav", "Kavitha Rao"],
      logo: "KT",
      color: "bg-green-600",
      website: "https://krishitech.farm",
      status: "active"
    },
    {
      name: "EduSpark",
      sector: "Consumer",
      stage: "Seed",
      year: 2024,
      description: "Vernacular ed-tech platform for competitive exam preparation. 500K+ students from tier 2/3 cities.",
      metrics: { raised: "₹3.5 Cr", team: "28", mrr: "₹22L" },
      founders: ["Pooja Sharma", "Anil Kumar"],
      logo: "ES",
      color: "bg-indigo-500",
      website: "https://eduspark.co.in",
      status: "active"
    },
    {
      name: "HealthKart Pro",
      sector: "Healthcare",
      stage: "Pre-seed",
      year: 2025,
      description: "B2B pharma supply chain platform digitizing 50,000+ pharmacies across India.",
      metrics: { raised: "₹2 Cr", team: "15", mrr: "₹12L" },
      founders: ["Dr. Vivek Reddy", "Shreya Mehta"],
      logo: "HK",
      color: "bg-pink-500",
      website: "https://healthkartpro.in",
      status: "active"
    },
    {
      name: "SecureStack",
      sector: "SaaS",
      stage: "Pre-seed",
      year: 2025,
      description: "Zero-trust security platform for Indian SMEs. Protecting 500+ businesses from cyber threats.",
      metrics: { raised: "₹1.8 Cr", team: "10", mrr: "₹6L" },
      founders: ["Rohan Desai", "Nisha Patel"],
      logo: "SS",
      color: "bg-cyan-600",
      website: "https://securestack.io",
      status: "active"
    },
    {
      name: "CarbonZero",
      sector: "Climate Tech",
      stage: "Seed",
      year: 2024,
      description: "Carbon credit marketplace and sustainability tracking for enterprises. Managing 100K+ tonnes of offsets.",
      metrics: { raised: "₹5 Cr", team: "18", mrr: "₹20L" },
      founders: ["Aditya Iyer", "Lakshmi Menon"],
      logo: "CZ",
      color: "bg-teal-500",
      website: "https://carbonzero.earth",
      status: "active"
    },
  ];

  const filteredCompanies = selectedSector === "All" 
    ? companies 
    : companies.filter(c => c.sector === selectedSector);

  const portfolioStats = [
    { label: "Portfolio Companies", value: "40+" },
    { label: "Total Capital Deployed", value: "₹160+ Cr" },
    { label: "Follow-on Rate", value: "85%" },
    { label: "Active Sectors", value: "6" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-hero py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-primary-foreground">Our Portfolio</h1>
            <p className="text-xl text-primary-foreground/90">
              Backing India's most innovative startups across high-growth sectors
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-muted/30 border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {portfolioStats.map((stat, index) => (
              <div key={index}>
                <div className="text-3xl md:text-4xl font-bold text-accent">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 sticky top-20 bg-background/95 backdrop-blur z-40 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center">
            {sectors.map((sector) => (
              <Button
                key={sector}
                variant={selectedSector === sector ? "accent" : "outline"}
                onClick={() => setSelectedSector(sector)}
                size="sm"
              >
                {sector}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company, index) => (
              <Card key={index} className="border-2 hover:border-accent transition-all hover:shadow-lg group">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <Avatar className={`h-12 w-12 ${company.color}`}>
                      <AvatarFallback className="text-white font-bold text-sm">
                        {company.logo}
                      </AvatarFallback>
                    </Avatar>
                    <Badge variant={company.stage === "Series A" ? "default" : "secondary"}>
                      {company.stage}
                    </Badge>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold">{company.name}</h3>
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                        aria-label={`Visit ${company.name} website`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{company.description}</p>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Founders:</span> {company.founders.join(", ")}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-accent">{company.metrics.raised}</div>
                      <div className="text-xs text-muted-foreground">Raised</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold">{company.metrics.team}</div>
                      <div className="text-xs text-muted-foreground">Team</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-green-600">{company.metrics.mrr}</div>
                      <div className="text-xs text-muted-foreground">MRR</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-accent/10 text-accent">
                      {company.sector}
                    </span>
                    <span className="text-xs text-muted-foreground">{company.year}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCompanies.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                No companies found in this sector.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2>Success Stories</h2>
            <p className="text-lg text-muted-foreground mt-4">
              Highlighting exceptional outcomes from our portfolio
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="border-2 border-accent">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold">Series B Success</h3>
                <p className="text-muted-foreground">
                  One of our 2023 seed investments just closed their Series B at ₹200 Cr valuation, 
                  delivering 8x returns to our angel members in under 18 months.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-accent">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold">Strategic Acquisition</h3>
                <p className="text-muted-foreground">
                  A portfolio fintech company was acquired by a leading bank in Q4 2024, 
                  generating 4.5x returns within 2 years for early investors.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-primary-foreground">Want to Join Our Portfolio?</h2>
            <p className="text-xl text-primary-foreground/90">
              We're always looking for exceptional founders building the future
            </p>
            <Button size="lg" variant="hero" asChild>
              <Link to="/apply/founder">Apply for Funding</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Portfolio;

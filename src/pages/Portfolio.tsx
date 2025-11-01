import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Building2, TrendingUp, Users, Calendar } from "lucide-react";

const Portfolio = () => {
  const [selectedSector, setSelectedSector] = useState("All");

  const sectors = ["All", "AI & Deep Tech", "Fintech", "Healthcare", "SaaS", "Consumer", "Climate Tech"];

  const companies = [
    {
      name: "TechAI Solutions",
      sector: "AI & Deep Tech",
      stage: "Series A",
      year: 2024,
      description: "Enterprise AI platform for automated business intelligence",
      metrics: { raised: "₹8 Cr", team: "25+" }
    },
    {
      name: "FinFlow",
      sector: "Fintech",
      stage: "Pre-seed",
      year: 2024,
      description: "Neo-banking platform for SME cash flow management",
      metrics: { raised: "₹3 Cr", team: "12" }
    },
    {
      name: "HealthConnect",
      sector: "Healthcare",
      stage: "Seed",
      year: 2023,
      description: "Telemedicine and diagnostic marketplace for tier 2/3 cities",
      metrics: { raised: "₹5 Cr", team: "18" }
    },
    {
      name: "CloudOps Pro",
      sector: "SaaS",
      stage: "Seed",
      year: 2024,
      description: "DevOps automation and monitoring for Indian enterprises",
      metrics: { raised: "₹4.5 Cr", team: "15" }
    },
    {
      name: "GreenEnergy Labs",
      sector: "Climate Tech",
      stage: "Pre-seed",
      year: 2024,
      description: "Solar energy optimization using IoT and AI",
      metrics: { raised: "₹2.5 Cr", team: "10" }
    },
    {
      name: "ShopSmart",
      sector: "Consumer",
      stage: "Series A",
      year: 2023,
      description: "Social commerce platform for regional brands",
      metrics: { raised: "₹10 Cr", team: "35" }
    },
    {
      name: "PaySecure",
      sector: "Fintech",
      stage: "Seed",
      year: 2023,
      description: "Fraud detection and compliance platform for digital payments",
      metrics: { raised: "₹6 Cr", team: "20" }
    },
    {
      name: "AgriTech Connect",
      sector: "AI & Deep Tech",
      stage: "Seed",
      year: 2024,
      description: "AI-powered crop yield prediction and marketplace",
      metrics: { raised: "₹3.5 Cr", team: "14" }
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
              <Card key={index} className="border-2 hover:border-accent transition-all hover:shadow-lg">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-accent" />
                    </div>
                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
                      {company.stage}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-1">{company.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{company.description}</p>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>{company.metrics.raised}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{company.metrics.team}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{company.year}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-accent">
                      {company.sector}
                    </span>
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
            <Button size="lg" variant="hero">
              Apply for Funding
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Portfolio;

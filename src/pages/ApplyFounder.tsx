import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { FounderApplicationForm } from "@/components/forms/FounderApplicationForm";

const ApplyFounder = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Apply for Funding — Founder Application"
        description="Apply to present your startup to 400+ accredited angels at India Angel Forum. Free application. ₹50,000 showcase fee only upon selection. Top 1% of applicants get funded."
        canonical="/apply/founder"
        keywords="apply startup funding India, founder application angel network, pitch to angel investors India, startup funding application"
        breadcrumbs={[
          {name: "Home", url: "/"},
          {name: "For Founders", url: "/founders"},
          {name: "Apply for Funding", url: "/apply/founder"}
        ]}
      />
      <Navigation />

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="mb-4">Apply for Funding</h1>
              <p className="text-lg text-muted-foreground">
                Join 40+ companies funded through India Angel Forum. 
                Complete this application to start your journey.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                <strong>Application is free.</strong> Forum showcase fee of ₹50,000 applies only upon selection.
              </p>
            </div>

            <FounderApplicationForm />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ApplyFounder;

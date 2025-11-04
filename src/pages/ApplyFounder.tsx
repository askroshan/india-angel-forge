import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { FounderApplicationForm } from "@/components/forms/FounderApplicationForm";

const ApplyFounder = () => {
  return (
    <div className="min-h-screen bg-background">
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

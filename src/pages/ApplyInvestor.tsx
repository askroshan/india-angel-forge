import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { InvestorApplicationForm } from "@/components/forms/InvestorApplicationForm";

const ApplyInvestor = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="mb-4">Apply for Membership</h1>
              <p className="text-lg text-muted-foreground">
                Join 400+ angels backing India's most promising startups. 
                Complete this application to begin the membership process.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                After submission, we'll review your application and initiate the KYC process.
              </p>
            </div>

            <InvestorApplicationForm />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ApplyInvestor;

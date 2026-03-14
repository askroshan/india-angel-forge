import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { InvestorApplicationForm } from "@/components/forms/InvestorApplicationForm";
import { OnboardingBanner } from "@/components/investor/OnboardingBanner";
import { useAuth } from "@/contexts/AuthContext";

const ApplyInvestor = () => {
  const { user, token } = useAuth();
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch("/api/applications/investor-application", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.status) setApplicationStatus(data.status);
      })
      .catch(() => {});
  }, [token]);

  const isUnapprovedLoggedIn = !!user && applicationStatus !== "approved";

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

            {isUnapprovedLoggedIn && (
              <div className="mb-8">
                <OnboardingBanner applicationStatus={applicationStatus} />
              </div>
            )}

            <InvestorApplicationForm />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ApplyInvestor;


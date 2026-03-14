/**
 * US-INV-203: Application Status Tracking
 *
 * As an: Investor who submitted an application
 * I want to: Track the status of my investor application
 * So that: I know where I am in the review process
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Clock, XCircle, AlertCircle, ArrowRight, FileText } from "lucide-react";
import { format } from "date-fns";

interface ApplicationData {
  id: string;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
  fullName: string;
  email: string;
  investorType?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  pending: {
    label: "Under Review",
    color: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200",
    icon: <Clock className="h-5 w-5 text-amber-600" />,
    description: "Your application has been received and is currently under review by our membership team.",
  },
  under_review: {
    label: "Under Review",
    color: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200",
    icon: <Clock className="h-5 w-5 text-amber-600" />,
    description: "Your application is actively being reviewed by our team.",
  },
  approved: {
    label: "Approved",
    color: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-200",
    icon: <CheckCircle className="h-5 w-5 text-green-600" />,
    description: "Congratulations! Your application has been approved.",
  },
  rejected: {
    label: "Not Approved",
    color: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200",
    icon: <XCircle className="h-5 w-5 text-red-600" />,
    description: "Unfortunately, your application was not approved at this time.",
  },
};

export default function ApplicationStatus() {
  const { token } = useAuth();
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch("/api/applications/investor-application", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async r => {
        if (!r.ok) throw new Error("Failed to fetch application");
        return r.json();
      })
      .then(data => {
        setApplication(data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const statusConfig = application ? (STATUS_CONFIG[application.status] ?? {
    label: application.status,
    color: "bg-gray-100 text-gray-800 border-gray-300",
    icon: <AlertCircle className="h-5 w-5 text-gray-500" />,
    description: "Your application is being processed.",
  }) : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="mb-8">
            <Button asChild variant="ghost" size="sm" className="mb-4">
              <Link to="/apply/investor">
                ← Back to Application
              </Link>
            </Button>
            <h1 className="text-3xl font-bold mb-2">Application Status</h1>
            <p className="text-muted-foreground">Track your investor membership application</p>
          </div>

          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {!loading && !error && !application && (
            <Card data-testid="no-application">
              <CardHeader>
                <CardTitle>No Application Found</CardTitle>
                <CardDescription>You haven't submitted an investor application yet.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="accent">
                  <Link to="/apply/investor">
                    <FileText className="mr-2 h-4 w-4" />
                    Apply Now
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {!loading && !error && application && statusConfig && (
            <div className="space-y-6" data-testid="application-status-card">
              {/* Status Summary */}
              <Card className={`border ${statusConfig.color}`}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {statusConfig.icon}
                    <div>
                      <CardTitle className="text-lg">{statusConfig.label}</CardTitle>
                      <CardDescription>{statusConfig.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Submitted</span>
                      <p className="font-medium" data-testid="submitted-at">
                        {format(new Date(application.submittedAt), "MMMM d, yyyy")}
                      </p>
                    </div>
                    {application.reviewedAt && (
                      <div>
                        <span className="text-muted-foreground">Reviewed</span>
                        <p className="font-medium" data-testid="reviewed-at">
                          {format(new Date(application.reviewedAt), "MMMM d, yyyy")}
                        </p>
                      </div>
                    )}
                    {!application.reviewedAt && application.status === "pending" && (
                      <div>
                        <span className="text-muted-foreground">Expected Review</span>
                        <p className="font-medium">3–5 business days</p>
                      </div>
                    )}
                  </div>

                  {application.reviewNotes && (
                    <div className="mt-4 p-3 bg-background rounded-md border">
                      <p className="text-sm font-medium mb-1">Reviewer Notes</p>
                      <p className="text-sm text-muted-foreground" data-testid="review-notes">
                        {application.reviewNotes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Application Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Application Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{application.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{application.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Application ID</span>
                    <span className="font-mono text-xs text-muted-foreground">{application.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="outline" className={statusConfig.color} data-testid="status-badge">
                      {statusConfig.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              {application.status === "approved" && (
                <Card className="border-green-300 bg-green-50 dark:bg-green-950/20">
                  <CardHeader>
                    <CardTitle className="text-base text-green-800">Next Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="accent">
                      <Link to="/deals">
                        Browse Investment Deals
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}

              {application.status === "rejected" && (
                <Card className="border-red-300 bg-red-50 dark:bg-red-950/20">
                  <CardHeader>
                    <CardTitle className="text-base text-red-800">What's Next?</CardTitle>
                    <CardDescription>
                      You may re-apply after addressing the feedback above. Contact us at{" "}
                      <a href="mailto:membership@indiaangelforum.org" className="underline">
                        membership@indiaangelforum.org
                      </a>{" "}
                      for guidance.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

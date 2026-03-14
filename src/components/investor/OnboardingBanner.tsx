/**
 * US-INV-201: Investor Onboarding Checklist Banner
 *
 * As an: Unapproved investor
 * I want to: See a clear step-by-step onboarding checklist
 * So that: I know exactly what to do to gain access
 */

import { Link } from "react-router-dom";
import { CheckCircle, Circle, FileText, ShieldCheck, UserCheck, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "completed" | "current" | "pending";
  action?: { label: string; href: string };
}

interface OnboardingBannerProps {
  applicationStatus?: string | null;
}

export function OnboardingBanner({ applicationStatus }: OnboardingBannerProps) {
  const isSubmitted = !!applicationStatus;
  const isUnderReview = applicationStatus === "pending" || applicationStatus === "under_review";
  const isApproved = applicationStatus === "approved";

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: "Submit Application",
      description: "Complete the investor membership application with your professional details",
      icon: <FileText className="h-5 w-5" />,
      status: isSubmitted ? "completed" : "current",
      action: !isSubmitted ? { label: "Apply Now", href: "/apply/investor" } : undefined,
    },
    {
      id: 2,
      title: "KYC Verification",
      description: "Complete identity and compliance verification (PAN, Aadhaar) — initiated after application review",
      icon: <ShieldCheck className="h-5 w-5" />,
      status: isUnderReview ? "current" : isApproved ? "completed" : "pending",
    },
    {
      id: 3,
      title: "Application Review",
      description: "Our team reviews your application (typically 3–5 business days)",
      icon: <UserCheck className="h-5 w-5" />,
      status: isApproved ? "completed" : isUnderReview ? "current" : "pending",
      action: isSubmitted ? { label: "Check Status", href: "/apply/investor/status" } : undefined,
    },
    {
      id: 4,
      title: "Access Granted",
      description: "Gain access to investment deals, portfolio tracking, and network events",
      icon: <TrendingUp className="h-5 w-5" />,
      status: isApproved ? "completed" : "pending",
    },
  ];

  const currentStep = steps.find(s => s.status === "current") || steps[0];

  return (
    <Card
      className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800"
      data-testid="onboarding-banner"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-amber-800 dark:text-amber-200">
            Complete Your Membership Setup
          </CardTitle>
          <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-300">
            Step {currentStep.id} of {steps.length}
          </Badge>
        </div>
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Follow these steps to gain full access to investment deals and opportunities.
        </p>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {steps.map((step) => (
            <li
              key={step.id}
              className="flex items-start gap-3"
              data-testid={`onboarding-step-${step.id}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {step.status === "completed" ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : step.status === "current" ? (
                  <div className="h-5 w-5 rounded-full border-2 border-amber-500 bg-amber-100 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                  </div>
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground opacity-50" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-sm font-medium ${
                      step.status === "completed"
                        ? "text-green-700 dark:text-green-400 line-through opacity-75"
                        : step.status === "current"
                        ? "text-amber-800 dark:text-amber-200"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </span>
                  {step.status === "completed" && (
                    <Badge variant="outline" className="text-xs border-green-400 text-green-700">Done</Badge>
                  )}
                  {step.status === "current" && (
                    <Badge variant="outline" className="text-xs border-amber-400 text-amber-700">In Progress</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                {step.action && step.status === "current" && (
                  <Button
                    asChild
                    size="sm"
                    variant="accent"
                    className="mt-2 h-7 text-xs"
                  >
                    <Link to={step.action.href}>{step.action.label}</Link>
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

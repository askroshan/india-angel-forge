/**
 * US-FO-07: KYC Expiry Banner
 *
 * As a: Family Office investor
 * I want to: See a prominent amber banner when my KYC is expiring within 30 days
 * So that: I can renew it before losing access
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

interface KycStatusResponse {
  kycStatus: string;
  kycExpiresAt: string | null;
  daysUntilExpiry: number | null;
  requiresRefresh: boolean;
  panNumber: string | null;
}

export function KYCExpiryBanner() {
  const { data } = useQuery<KycStatusResponse>({
    queryKey: ["kyc-status"],
    queryFn: () => apiClient.get<KycStatusResponse>("/api/family-office/kyc-status"),
    // Poll every 10 minutes — no need to spam
    refetchInterval: 10 * 60 * 1000,
    // Silently skip errors (not all investors are FO)
    retry: false,
  });

  if (!data?.requiresRefresh) return null;

  const days = data.daysUntilExpiry;
  const expiry = data.kycExpiresAt
    ? new Date(data.kycExpiresAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Alert
      className="border-amber-400 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700 mb-4"
      data-testid="kyc-expiry-banner"
    >
      <ShieldAlert className="h-5 w-5 text-amber-600" />
      <AlertTitle className="text-amber-800 dark:text-amber-200">
        KYC Renewal Required
      </AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-300">
        {days !== null && days >= 0
          ? `Your KYC documents expire in ${days} day${days === 1 ? "" : "s"}${expiry ? ` (${expiry})` : ""}. `
          : `Your KYC documents have expired${expiry ? ` on ${expiry}` : ""}. `}
        Please renew your KYC to avoid losing access to deals and portfolio features.
        <Button asChild variant="link" className="h-auto p-0 pl-1 text-amber-800 dark:text-amber-200">
          <Link to="/investor/kyc-upload">Renew KYC →</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}

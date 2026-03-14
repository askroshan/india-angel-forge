/**
 * US-FO-08: Investment Committee Report
 *
 * As a: Family Office investor
 * I want to: Generate and print an Investment Committee Report
 * So that: I can present portfolio performance to my trustees/committee
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Printer, TrendingUp, Building, IndianRupee } from "lucide-react";

interface PortfolioCompany {
  id: string;
  companyName: string;
  sector: string | null;
  stage: string | null;
  investmentAmount: number;
  currentValuation: number;
  latestUpdate: string | null;
}

interface CommitmentRow {
  dealTitle: string;
  sector: string | null;
  stage: string | null;
  amount: number;
  status: string;
  committedAt: string;
}

interface SpvMembership {
  spvName: string;
  status: string;
  targetAmount: number;
  commitmentAmount: number;
}

interface CommitteeReportResponse {
  reportDate: string;
  summary: {
    totalPortfolioCompanies: number;
    totalDeployed: number;
    totalCommitted: number;
    activeSpvs: number;
  };
  portfolioCompanies: PortfolioCompany[];
  commitments: CommitmentRow[];
  spvMemberships: SpvMembership[];
}

const formatCurrency = (n: number) => {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(2)} Lac`;
  return `₹${n.toLocaleString("en-IN")}`;
};

export function InvestmentCommitteeReport() {
  const { data, isLoading, error } = useQuery<CommitteeReportResponse>({
    queryKey: ["committee-report"],
    queryFn: () => apiClient.get<CommitteeReportResponse>("/api/family-office/committee-report"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12" data-testid="committee-report-loading">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="text-destructive text-sm" data-testid="committee-report-error">
        Failed to load committee report data.
      </p>
    );
  }

  const reportDate = new Date(data.reportDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6" data-testid="committee-report">
      {/* Header */}
      <div className="flex items-center justify-between print:flex print:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Investment Committee Report</h2>
          <p className="text-muted-foreground text-sm">Generated: {reportDate}</p>
        </div>
        <Button
          onClick={() => window.print()}
          variant="outline"
          className="print:hidden"
          data-testid="print-report-button"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="report-summary">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Portfolio Companies</p>
            <p className="text-2xl font-bold">{data.summary.totalPortfolioCompanies}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Deployed</p>
            <p className="text-2xl font-bold">{formatCurrency(data.summary.totalDeployed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Active Commitments</p>
            <p className="text-2xl font-bold">{data.summary.totalCommitted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Active SPVs</p>
            <p className="text-2xl font-bold">{data.summary.activeSpvs}</p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Companies */}
      {data.portfolioCompanies.length > 0 && (
        <Card data-testid="portfolio-companies-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building className="h-5 w-5" />
              Portfolio Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2 font-medium">Company</th>
                    <th className="text-left pb-2 font-medium">Sector</th>
                    <th className="text-left pb-2 font-medium">Stage</th>
                    <th className="text-right pb-2 font-medium">Investment</th>
                    <th className="text-right pb-2 font-medium">Valuation</th>
                  </tr>
                </thead>
                <tbody>
                  {data.portfolioCompanies.map(pc => (
                    <tr key={pc.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{pc.companyName}</td>
                      <td className="py-2 text-muted-foreground">{pc.sector || "—"}</td>
                      <td className="py-2">
                        {pc.stage ? <Badge variant="outline">{pc.stage}</Badge> : "—"}
                      </td>
                      <td className="py-2 text-right">{formatCurrency(pc.investmentAmount)}</td>
                      <td className="py-2 text-right">{formatCurrency(pc.currentValuation)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commitments */}
      {data.commitments.length > 0 && (
        <Card data-testid="commitments-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <IndianRupee className="h-5 w-5" />
              Investment Commitments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2 font-medium">Deal</th>
                    <th className="text-left pb-2 font-medium">Status</th>
                    <th className="text-right pb-2 font-medium">Amount</th>
                    <th className="text-left pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.commitments.map((c, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 font-medium">{c.dealTitle}</td>
                      <td className="py-2">
                        <Badge variant={c.status === "committed" ? "default" : "secondary"}>
                          {c.status}
                        </Badge>
                      </td>
                      <td className="py-2 text-right">{formatCurrency(c.amount)}</td>
                      <td className="py-2 text-muted-foreground text-xs">
                        {new Date(c.committedAt).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SPV Memberships */}
      {data.spvMemberships.length > 0 && (
        <Card data-testid="spv-memberships-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              SPV Memberships
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2 font-medium">SPV</th>
                    <th className="text-left pb-2 font-medium">Status</th>
                    <th className="text-right pb-2 font-medium">Target</th>
                    <th className="text-right pb-2 font-medium">My Commitment</th>
                  </tr>
                </thead>
                <tbody>
                  {data.spvMemberships.map((s, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 font-medium">{s.spvName}</td>
                      <td className="py-2">
                        <Badge variant={s.status === "active" ? "default" : "secondary"}>
                          {s.status}
                        </Badge>
                      </td>
                      <td className="py-2 text-right">{formatCurrency(s.targetAmount)}</td>
                      <td className="py-2 text-right">{formatCurrency(s.commitmentAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {data.portfolioCompanies.length === 0 &&
        data.commitments.length === 0 &&
        data.spvMemberships.length === 0 && (
          <p className="text-muted-foreground text-center py-8" data-testid="no-data-message">
            No portfolio data available yet. Your committee report will populate as you invest.
          </p>
        )}
    </div>
  );
}

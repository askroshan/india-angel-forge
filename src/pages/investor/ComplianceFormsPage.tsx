/**
 * US-FO-06: DPIIT/SEBI Angel Fund Compliance Form Tracking
 *
 * As a: Family Office investor co-investing alongside the IAF Angel Fund
 * I want to: Track and generate FEMA Form 10 and SEBI AIF Schedule III disclosures
 * So that: I meet my regulatory obligations without missing deadlines
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ClipboardList, FileText, Download, CheckCircle, AlertCircle, Clock, Loader2, RefreshCw } from "lucide-react";

interface ComplianceFiling {
  id: string;
  formType: "FEMA_FORM10" | "AIF_SCHEDULE3";
  formLabel: string;
  status: "PENDING" | "FILED" | "OVERDUE" | "NOT_REQUIRED";
  regulatoryRef: string | null;
  dueDate: string | null;
  filedAt: string | null;
  filingReference: string | null;
  notes: string | null;
  company: string | null;
  sector: string | null;
  createdAt: string;
  formData: Record<string, unknown>;
}

interface GeneratedForm {
  filingId: string;
  formType: string;
  generatedAt: string;
  formData: Record<string, unknown>;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  PENDING: { label: "Pending", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  FILED: { label: "Filed", variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
  OVERDUE: { label: "Overdue", variant: "destructive", icon: <AlertCircle className="h-3 w-3" /> },
  NOT_REQUIRED: { label: "Not Required", variant: "outline", icon: null },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, variant: "outline" as const, icon: null };
  return (
    <Badge variant={cfg.variant} className="flex items-center gap-1 text-xs">
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

function FormDataViewer({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-2 text-sm" data-testid="form-data-viewer">
      {Object.entries(data).map(([key, value]) => {
        if (value === null || value === undefined || value === "") return null;
        if (typeof value === "object") return null;
        const label = key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
        return (
          <div key={key} className="grid grid-cols-2 gap-2 border-b pb-1 last:border-0">
            <span className="text-muted-foreground font-medium">{label}</span>
            <span className="font-mono">{String(value)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function ComplianceFormsPage() {
  const queryClient = useQueryClient();
  const [selectedFiling, setSelectedFiling] = useState<ComplianceFiling | null>(null);
  const [generatedForm, setGeneratedForm] = useState<GeneratedForm | null>(null);
  const [showMarkFiled, setShowMarkFiled] = useState<string | null>(null);
  const [filingReference, setFilingReference] = useState("");
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const { data: filings = [], isLoading, error, refetch } = useQuery<ComplianceFiling[]>({
    queryKey: ["compliance-forms"],
    queryFn: () => apiClient.get<ComplianceFiling[]>("/api/family-office/compliance-forms"),
  });

  const markFiledMutation = useMutation({
    mutationFn: ({ id, filingRef }: { id: string; filingRef: string }) =>
      apiClient.patch(`/api/family-office/compliance-forms/${id}`, {
        status: "FILED",
        filingReference: filingRef || undefined,
      }),
    onSuccess: () => {
      toast.success("Filing marked as submitted");
      setShowMarkFiled(null);
      setFilingReference("");
      queryClient.invalidateQueries({ queryKey: ["compliance-forms"] });
    },
    onError: () => toast.error("Failed to update filing status"),
  });

  const handleGenerate = async (filing: ComplianceFiling) => {
    setIsGenerating(filing.id);
    try {
      const result = await apiClient.get<GeneratedForm>(
        `/api/family-office/compliance-forms/${filing.id}/generate`
      );
      setGeneratedForm(result);
      setSelectedFiling(filing);
    } catch {
      toast.error("Failed to generate form data");
    } finally {
      setIsGenerating(null);
    }
  };

  const femaFilings = filings.filter(f => f.formType === "FEMA_FORM10");
  const aifFilings = filings.filter(f => f.formType === "AIF_SCHEDULE3");

  const renderFilingCard = (filing: ComplianceFiling) => (
    <Card key={filing.id} className="relative" data-testid={`filing-row-${filing.id}`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-medium text-sm" data-testid={`form-${filing.id}-label`}>
                {filing.formLabel}
              </span>
              <span data-testid={`form-${filing.id}-status`}>
                <StatusBadge status={filing.status} />
              </span>
            </div>

            {filing.company && (
              <p className="text-xs text-muted-foreground">
                Company: <span className="font-medium">{filing.company}</span>
                {filing.sector ? ` · ${filing.sector}` : ""}
              </p>
            )}

            {filing.regulatoryRef && (
              <p className="text-xs text-muted-foreground mt-1">
                Reg. Basis: {filing.regulatoryRef}
              </p>
            )}

            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
              {filing.dueDate && (
                <span>Due: {new Date(filing.dueDate).toLocaleDateString("en-IN")}</span>
              )}
              {filing.filedAt && (
                <span>Filed: {new Date(filing.filedAt).toLocaleDateString("en-IN")}</span>
              )}
              {filing.filingReference && (
                <span>Ref: <code className="font-mono">{filing.filingReference}</code></span>
              )}
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              disabled={isGenerating === filing.id}
              onClick={() => handleGenerate(filing)}
              data-testid={`generate-btn-${filing.id}`}
            >
              {isGenerating === filing.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              <span className="ml-1 hidden sm:inline">Generate</span>
            </Button>

            {filing.status !== "FILED" && filing.status !== "NOT_REQUIRED" && (
              <Button
                size="sm"
                variant="default"
                onClick={() => setShowMarkFiled(filing.id)}
                data-testid={`mark-filed-btn-${filing.id}`}
              >
                <CheckCircle className="h-3 w-3" />
                <span className="ml-1 hidden sm:inline">Mark Filed</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background" data-testid="compliance-forms-page">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ClipboardList className="h-7 w-7" />
              Compliance Forms
            </h1>
            <p className="text-muted-foreground mt-1">
              DPIIT / SEBI Angel Fund regulatory filings — Form 10 (FEMA) and Schedule III (AIF Reg)
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="refresh-btn">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Summary banner */}
        {filings.length > 0 && (() => {
          const overdueCount = filings.filter(f => f.status === "OVERDUE").length;
          const pendingCount = filings.filter(f => f.status === "PENDING").length;
          return overdueCount > 0 ? (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have {overdueCount} overdue filing{overdueCount > 1 ? "s" : ""}.
                {pendingCount > 0 ? ` (${pendingCount} pending)` : ""} Please act promptly to avoid regulatory penalties.
              </AlertDescription>
            </Alert>
          ) : null;
        })()}

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load compliance filings. Please refresh the page.
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && filings.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-1">No compliance filings yet</p>
              <p className="text-muted-foreground text-sm">
                Filings will be auto-generated once you have investment commitments that trigger FEMA or SEBI AIF reporting obligations.
              </p>
            </CardContent>
          </Card>
        )}

        {/* FEMA Form 10 Section */}
        {femaFilings.length > 0 && (
          <section className="mb-8" data-testid="fema-forms-section">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold">FEMA Form 10 — NRI Investment Reporting</h2>
              <Badge variant="outline" className="ml-auto">{femaFilings.length}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Required under FEMA 20(R)/2017-RB Schedule 1 for NRI co-investments.
              Must be filed with RBI via the authorised dealer bank within 30 days of share allotment.
            </p>
            <div className="space-y-3">
              {femaFilings.map(renderFilingCard)}
            </div>
          </section>
        )}

        {/* AIF Schedule III Section */}
        {aifFilings.length > 0 && (
          <section className="mb-8" data-testid="aif-forms-section">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-purple-600" />
              <h2 className="text-xl font-semibold">Schedule III — SEBI AIF Quarterly Disclosure</h2>
              <Badge variant="outline" className="ml-auto">{aifFilings.length}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Required under SEBI (AIF) Regulations 2012 — Schedule III.
              Quarterly disclosure for all co-investments alongside a SEBI-registered Angel Fund.
              Due within 21 days of each quarter end.
            </p>
            <div className="space-y-3">
              {aifFilings.map(renderFilingCard)}
            </div>
          </section>
        )}

        {/* Regulatory Notice */}
        {filings.length > 0 && (
          <Alert className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Disclaimer:</strong> These pre-filled forms are generated from your platform data for reference purposes only.
              Always verify filings with a qualified CA/legal advisor before submission.
              FEMA reports must be filed via your AD Bank; SEBI AIF reports via{" "}
              <span className="font-mono">sip.sebi.gov.in</span>.
            </AlertDescription>
          </Alert>
        )}
      </main>

      {/* Form Data Dialog */}
      <Dialog open={!!selectedFiling} onOpenChange={open => { if (!open) { setSelectedFiling(null); setGeneratedForm(null); } }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="form-data-dialog">
          <DialogHeader>
            <DialogTitle>
              {selectedFiling?.formLabel}
            </DialogTitle>
            <DialogDescription>
              {selectedFiling?.regulatoryRef}
              {" · "}Generated: {generatedForm ? new Date(generatedForm.generatedAt).toLocaleString("en-IN") : ""}
            </DialogDescription>
          </DialogHeader>
          {generatedForm && (
            <div className="mt-4">
              <FormDataViewer data={generatedForm.formData} />
              <p className="text-xs text-muted-foreground mt-4">
                This data can be used to pre-fill the official regulatory form. Save or print this page for your records.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mark Filed Dialog */}
      <Dialog open={!!showMarkFiled} onOpenChange={open => { if (!open) { setShowMarkFiled(null); setFilingReference(""); } }}>
        <DialogContent data-testid="mark-filed-dialog">
          <DialogHeader>
            <DialogTitle>Mark as Filed</DialogTitle>
            <DialogDescription>
              Enter the official reference number received from RBI or SEBI after successful submission.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Filing Reference Number (optional)</label>
              <Input
                placeholder="e.g. RBI/2024-25/FEMA/12345"
                value={filingReference}
                onChange={e => setFilingReference(e.target.value)}
                data-testid="filing-reference-input"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => { setShowMarkFiled(null); setFilingReference(""); }}
              >
                Cancel
              </Button>
              <Button
                disabled={markFiledMutation.isPending}
                onClick={() => showMarkFiled && markFiledMutation.mutate({ id: showMarkFiled, filingRef: filingReference })}
                data-testid="confirm-mark-filed-btn"
              >
                {markFiledMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                Confirm Filed
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

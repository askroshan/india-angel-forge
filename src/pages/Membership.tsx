/**
 * Membership Page — Plan selection, subscription, verification & status
 *
 * User Stories: US-MEMB-001 to US-MEMB-010
 * E2E Tests: MEMB-E2E-014, MEMB-E2E-015
 *
 * data-testid attributes:
 *   membership-page, membership-plans-section, membership-plan-card,
 *   membership-plan-name, membership-plan-price, membership-plan-features,
 *   membership-plan-subscribe-btn, membership-discount-input,
 *   membership-apply-discount-btn, membership-status-card,
 *   membership-status-badge, membership-cancel-btn,
 *   membership-change-plan-btn, membership-verify-btn,
 *   membership-verification-status
 */

import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/api/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CreditCard,
  Calendar,
  Loader2,
  Crown,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Tag,
  ArrowRight,
  XCircle,
} from "lucide-react";

// ==================== TYPES ====================

interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  billingCycle: string;
  features: string[];
  isActive: boolean;
  displayOrder: number;
  introductoryPrice?: number;
}

interface UserMembership {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  plan: {
    id: string;
    name: string;
    slug: string;
    price: number;
    billingCycle: string;
  };
}

interface VerificationStatus {
  id: string;
  status: string;
  verifiedAt: string | null;
}

interface DiscountResult {
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  discountType: string;
  discountValue: number;
}

// ==================== COMPONENT ====================

const Membership = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [membership, setMembership] = useState<UserMembership | null>(null);
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Discount code state
  const [discountCode, setDiscountCode] = useState("");
  const [discountResult, setDiscountResult] = useState<DiscountResult | null>(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Change plan dialog
  const [changePlanDialog, setChangePlanDialog] = useState(false);
  const [changePlanTarget, setChangePlanTarget] = useState<MembershipPlan | null>(null);
  const [changingPlan, setChangingPlan] = useState(false);

  // Cancel confirm
  const [cancelConfirm, setCancelConfirm] = useState(false);

  // ==================== DATA FETCHING ====================

  const fetchPlans = useCallback(async () => {
    try {
      const data = await apiClient.get<{ success: boolean; plans: MembershipPlan[] }>(
        "/api/membership/plans"
      );
      if (data?.success) {
        setPlans(data.plans);
      }
    } catch (err) {
      console.error("Error fetching plans:", err);
    }
  }, []);

  const fetchMembership = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiClient.get<{
        success: boolean;
        membership: UserMembership | null;
        verification: VerificationStatus | null;
      }>("/api/membership/my-membership");
      if (data?.success) {
        setMembership(data.membership);
        setVerification(data.verification);
      }
    } catch (err) {
      console.error("Error fetching membership:", err);
    }
  }, [user]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPlans(), fetchMembership()]);
    setLoading(false);
  }, [fetchPlans, fetchMembership]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { state: { from: { pathname: "/membership" } } });
      return;
    }
    if (user) {
      loadAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // Handle verification redirect callback
  useEffect(() => {
    const verParam = searchParams.get("verification");
    if (verParam === "complete" || verParam === "mock") {
      toast.success("Identity verification completed!");
      fetchMembership();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ==================== ACTIONS ====================

  const handleStartVerification = async () => {
    setVerifying(true);
    try {
      const data = await apiClient.post<{
        success: boolean;
        alreadyVerified?: boolean;
        inquiryUrl?: string;
      }>("/api/verification/start", {});

      if (data?.success) {
        if (data.alreadyVerified) {
          toast.info("You are already verified!");
          await fetchMembership();
        } else if (data.inquiryUrl) {
          window.location.href = data.inquiryUrl;
        }
      }
    } catch (err) {
      console.error("Error starting verification:", err);
      toast.error("Failed to start identity verification");
    } finally {
      setVerifying(false);
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim() || !selectedPlanId) return;
    setApplyingDiscount(true);
    try {
      const data = await apiClient.post<
        DiscountResult & { success: boolean; error?: string }
      >("/api/membership/apply-discount", {
        code: discountCode.trim(),
        planId: selectedPlanId,
      });

      if (data?.success) {
        setDiscountResult(data);
        toast.success(
          `Discount applied! ₹${data.discountAmount.toLocaleString("en-IN")} off`
        );
      } else {
        toast.error(data?.error || "Invalid discount code");
        setDiscountResult(null);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to apply discount code");
      setDiscountResult(null);
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!verification || verification.status !== "COMPLETED") {
      toast.error("Please complete identity verification first");
      return;
    }

    setSubscribing(true);
    setSelectedPlanId(planId);
    try {
      const payload: any = { planId };
      if (discountCode.trim() && discountResult) {
        payload.discountCode = discountCode.trim();
      }

      const data = await apiClient.post<{
        success: boolean;
        membership?: UserMembership;
        paymentOrder?: any;
        gateway?: string;
        error?: string;
      }>("/api/membership/subscribe", payload);

      if (data?.success) {
        if (data.membership) {
          // Free plan — activated directly
          toast.success("Membership activated!");
          setMembership(data.membership as any);
          setDiscountCode("");
          setDiscountResult(null);
          await fetchMembership();
        } else if (data.paymentOrder) {
          // Paid plan — open Razorpay
          openRazorpayCheckout(data.paymentOrder, planId);
        }
      } else {
        toast.error(data?.error || "Subscription failed");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to subscribe");
    } finally {
      setSubscribing(false);
    }
  };

  const openRazorpayCheckout = (order: any, planId: string) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_mock",
      amount: order.amount,
      currency: order.currency || "INR",
      name: "India Angel Forum",
      description: "Membership Subscription",
      order_id: order.id,
      handler: async (response: any) => {
        try {
          const verifyData = await apiClient.post<{
            success: boolean;
            membership?: any;
          }>("/api/membership/verify-payment", {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            planId,
            discountCode: discountCode.trim() || undefined,
          });

          if (verifyData?.success) {
            toast.success("Payment verified! Membership activated.");
            setDiscountCode("");
            setDiscountResult(null);
            await fetchMembership();
          }
        } catch (err) {
          toast.error("Payment verification failed. Please contact support.");
        }
      },
      prefill: { email: user?.email },
      theme: { color: "#6366f1" },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  const handleChangePlan = async () => {
    if (!changePlanTarget) return;
    setChangingPlan(true);
    try {
      const data = await apiClient.post<{
        success: boolean;
        membership?: any;
        error?: string;
      }>("/api/membership/change-plan", { newPlanId: changePlanTarget.id });

      if (data?.success) {
        toast.success(`Plan changed to ${changePlanTarget.name}!`);
        setChangePlanDialog(false);
        await fetchMembership();
      } else {
        toast.error(data?.error || "Plan change failed");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to change plan");
    } finally {
      setChangingPlan(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const data = await apiClient.post<{ success: boolean; error?: string }>(
        "/api/membership/cancel",
        {}
      );
      if (data?.success) {
        toast.success("Membership cancelled");
        setCancelConfirm(false);
        await fetchMembership();
      } else {
        toast.error(data?.error || "Cancellation failed");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel membership");
    } finally {
      setCancelling(false);
    }
  };

  // ==================== HELPERS ====================

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const billingLabel = (cycle: string) => {
    switch (cycle) {
      case "MONTHLY": return "/month";
      case "QUARTERLY": return "/quarter";
      case "ANNUAL": return "/year";
      case "LIFETIME": return " (lifetime)";
      default: return "";
    }
  };

  // ==================== RENDER ====================

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="membership-page">
      <Navigation />

      <main className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Membership</h1>
              <p className="text-muted-foreground mt-1">
                Choose a plan and join our angel network
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={loadAll} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* ===================== Identity Verification ===================== */}
              {(!verification || verification.status !== "COMPLETED") && (
                <Card className="border-amber-200 bg-amber-50/50">
                  <CardContent className="pt-6">
                    <div
                      className="flex items-center gap-4"
                      data-testid="membership-verification-status"
                    >
                      <ShieldCheck className="h-8 w-8 text-amber-600 shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-amber-900">
                          Identity Verification Required
                        </h3>
                        <p className="text-sm text-amber-700">
                          Complete Persona identity verification before subscribing.
                          {verification?.status === "PENDING" && " Verification is in progress."}
                          {verification?.status === "FAILED" && " Previous verification failed. Please try again."}
                        </p>
                      </div>
                      <Button
                        onClick={handleStartVerification}
                        disabled={verifying}
                        data-testid="membership-verify-btn"
                      >
                        {verifying ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ShieldCheck className="h-4 w-4 mr-2" />
                        )}
                        {verification?.status === "PENDING" ? "Continue Verification" : "Verify Identity"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ===================== Current Membership Status ===================== */}
              {membership && membership.status === "ACTIVE" && (
                <Card data-testid="membership-status-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Crown className="h-6 w-6 text-primary" />
                        <div>
                          <CardTitle>Active Membership</CardTitle>
                          <CardDescription>{membership.plan.name}</CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant="default"
                        className="bg-green-600"
                        data-testid="membership-status-badge"
                      >
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="space-y-1">
                        <p className="font-semibold text-lg">{membership.plan.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Valid until {formatDate(membership.endDate)}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          {formatCurrency(Number(membership.plan.price))}
                          {billingLabel(membership.plan.billingCycle)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCancelConfirm(true)}
                          data-testid="membership-cancel-btn"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ===================== Plans Grid ===================== */}
              <div data-testid="membership-plans-section">
                <h2 className="text-2xl font-bold mb-4">
                  {membership?.status === "ACTIVE" ? "Change Plan" : "Choose a Plan"}
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {plans.map((plan) => {
                    const isCurrentPlan =
                      membership?.status === "ACTIVE" &&
                      membership?.plan?.id === plan.id;
                    const displayPrice =
                      plan.introductoryPrice !== undefined && plan.introductoryPrice !== null
                        ? plan.introductoryPrice
                        : plan.price;

                    return (
                      <Card
                        key={plan.id}
                        className={`relative flex flex-col ${
                          isCurrentPlan ? "ring-2 ring-primary" : ""
                        }`}
                        data-testid="membership-plan-card"
                      >
                        {isCurrentPlan && (
                          <Badge className="absolute -top-2 left-4 bg-primary">
                            Current Plan
                          </Badge>
                        )}
                        <CardHeader>
                          <CardTitle data-testid="membership-plan-name">
                            {plan.name}
                          </CardTitle>
                          <CardDescription>
                            <span
                              className="text-3xl font-bold text-foreground"
                              data-testid="membership-plan-price"
                            >
                              {displayPrice === 0
                                ? "Free"
                                : formatCurrency(displayPrice)}
                            </span>
                            {displayPrice !== 0 && (
                              <span className="text-muted-foreground">
                                {billingLabel(plan.billingCycle)}
                              </span>
                            )}
                            {plan.introductoryPrice !== undefined &&
                              plan.introductoryPrice !== plan.price && (
                                <span className="ml-2 line-through text-muted-foreground text-sm">
                                  {formatCurrency(plan.price)}
                                </span>
                              )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                          <ul
                            className="space-y-2"
                            data-testid="membership-plan-features"
                          >
                            {(plan.features || []).map((feature, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-sm"
                              >
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3">
                          {/* Discount code input */}
                          {!isCurrentPlan &&
                            !membership?.status &&
                            selectedPlanId === plan.id && (
                              <div className="w-full space-y-2">
                                <Label htmlFor={`discount-${plan.id}`}>
                                  Discount Code
                                </Label>
                                <div className="flex gap-2">
                                  <Input
                                    id={`discount-${plan.id}`}
                                    value={discountCode}
                                    onChange={(e) => setDiscountCode(e.target.value)}
                                    placeholder="Enter code"
                                    data-testid="membership-discount-input"
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleApplyDiscount}
                                    disabled={applyingDiscount || !discountCode.trim()}
                                    data-testid="membership-apply-discount-btn"
                                  >
                                    {applyingDiscount ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Tag className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                                {discountResult && (
                                  <p className="text-sm text-green-600">
                                    {formatCurrency(discountResult.discountAmount)} off
                                    → Pay {formatCurrency(discountResult.discountedPrice)}
                                  </p>
                                )}
                              </div>
                            )}

                          {/* Subscribe / Change Plan button */}
                          {isCurrentPlan ? (
                            <Badge variant="outline" className="w-full justify-center py-2">
                              Current Plan
                            </Badge>
                          ) : membership?.status === "ACTIVE" ? (
                            <Button
                              className="w-full"
                              variant="outline"
                              onClick={() => {
                                setChangePlanTarget(plan);
                                setChangePlanDialog(true);
                              }}
                              data-testid="membership-change-plan-btn"
                            >
                              Switch to {plan.name}
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          ) : (
                            <Button
                              className="w-full"
                              onClick={() => {
                                if (selectedPlanId !== plan.id) {
                                  setSelectedPlanId(plan.id);
                                  setDiscountCode("");
                                  setDiscountResult(null);
                                } else {
                                  handleSubscribe(plan.id);
                                }
                              }}
                              disabled={subscribing && selectedPlanId === plan.id}
                              data-testid="membership-plan-subscribe-btn"
                            >
                              {subscribing && selectedPlanId === plan.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : selectedPlanId === plan.id ? (
                                <>
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Subscribe Now
                                </>
                              ) : (
                                "Select Plan"
                              )}
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}

                  {plans.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No membership plans available at this time.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Verification status for verified users */}
              {verification?.status === "COMPLETED" && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Identity verified on{" "}
                  {verification.verifiedAt && formatDate(verification.verifiedAt)}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ==================== Change Plan Dialog ==================== */}
      <Dialog open={changePlanDialog} onOpenChange={setChangePlanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Plan</DialogTitle>
          </DialogHeader>
          {changePlanTarget && (
            <div className="space-y-4">
              <p>
                Switch from <strong>{membership?.plan.name}</strong> to{" "}
                <strong>{changePlanTarget.name}</strong>?
              </p>
              <p className="text-sm text-muted-foreground">
                Your remaining balance will be prorated. The new plan takes effect
                immediately and retains your current billing cycle end date.
              </p>
              <Separator />
              <div className="flex justify-between text-sm">
                <span>New plan price:</span>
                <span className="font-semibold">
                  {formatCurrency(Number(changePlanTarget.price))}
                  {billingLabel(changePlanTarget.billingCycle)}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePlanDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePlan} disabled={changingPlan}>
              {changingPlan && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== Cancel Confirmation Dialog ==================== */}
      <Dialog open={cancelConfirm} onOpenChange={setCancelConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Membership</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to cancel your membership? You will lose access to
            member-only features at the end of your current billing period.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelConfirm(false)}>
              Keep Membership
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
              {cancelling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Membership;

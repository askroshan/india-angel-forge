import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  CreditCard, 
  Calendar, 
  Download, 
  ExternalLink, 
  Loader2, 
  Crown,
  RefreshCw,
  AlertCircle
} from "lucide-react";

interface BillingHistoryItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  invoice_pdf: string | null;
  description: string;
}

interface SubscriptionData {
  subscribed: boolean;
  membership_type: string | null;
  subscription_end: string | null;
  subscription_status: string | null;
  billing_history: BillingHistoryItem[];
}

const Membership = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { state: { from: { pathname: "/membership" } } });
    }
  }, [user, authLoading, navigate]);

  const fetchSubscription = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) throw error;
      setSubscriptionData(data);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      toast.error("Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast.error("Failed to open subscription management portal");
    } finally {
      setPortalLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Membership</h1>
              <p className="text-muted-foreground mt-1">
                Manage your subscription and billing
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSubscription}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Membership Status Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Crown className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle>Membership Status</CardTitle>
                        <CardDescription>Your current membership plan</CardDescription>
                      </div>
                    </div>
                    {subscriptionData?.subscribed && (
                      <Badge variant="default" className="bg-green-600">
                        Active
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {subscriptionData?.subscribed ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                          <p className="font-semibold text-lg">
                            {subscriptionData.membership_type}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Renews on {subscriptionData.subscription_end && formatDate(subscriptionData.subscription_end)}
                          </p>
                        </div>
                        <Button
                          onClick={handleManageSubscription}
                          disabled={portalLoading}
                        >
                          {portalLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <ExternalLink className="h-4 w-4 mr-2" />
                          )}
                          Manage Subscription
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Use the Stripe Customer Portal to update payment methods, cancel, or change your plan.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Active Membership</h3>
                      <p className="text-muted-foreground mb-4">
                        Join our angel network to access exclusive deal flow and events.
                      </p>
                      <Button onClick={() => navigate("/investors")}>
                        View Membership Plans
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Billing History Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle>Billing History</CardTitle>
                      <CardDescription>Your past invoices and payments</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {subscriptionData?.billing_history && subscriptionData.billing_history.length > 0 ? (
                    <div className="space-y-3">
                      {subscriptionData.billing_history.map((invoice, index) => (
                        <div key={invoice.id}>
                          <div className="flex items-center justify-between py-3">
                            <div className="flex-1">
                              <p className="font-medium">{invoice.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(invoice.date)}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-semibold">
                                  {formatCurrency(invoice.amount, invoice.currency)}
                                </p>
                                <Badge 
                                  variant={invoice.status === "paid" ? "default" : "secondary"}
                                  className={invoice.status === "paid" ? "bg-green-600" : ""}
                                >
                                  {invoice.status}
                                </Badge>
                              </div>
                              {invoice.invoice_pdf && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  asChild
                                >
                                  <a 
                                    href={invoice.invoice_pdf} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    title="Download Invoice"
                                  >
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                          {index < subscriptionData.billing_history.length - 1 && (
                            <Separator />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No billing history yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Membership;

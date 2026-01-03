import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { CheckCircle, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [emailStatus, setEmailStatus] = useState<"sending" | "sent" | "error">("sending");

  useEffect(() => {
    const sendConfirmationEmail = async () => {
      const sessionId = searchParams.get("session_id");
      if (!sessionId) {
        setEmailStatus("error");
        return;
      }

      try {
        const { error } = await supabase.functions.invoke("send-membership-confirmation", {
          body: { sessionId },
        });

        if (error) {
          console.error("Error sending confirmation email:", error);
          setEmailStatus("error");
        } else {
          setEmailStatus("sent");
        }
      } catch (error) {
        console.error("Error sending confirmation email:", error);
        setEmailStatus("error");
      }
    };

    sendConfirmationEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 flex items-center justify-center py-20">
        <Card className="max-w-md mx-4 border-2 border-accent">
          <CardContent className="pt-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-accent" />
            </div>
            <h1 className="text-2xl font-bold">Payment Successful!</h1>
            <p className="text-muted-foreground">
              Thank you for joining India Angel Forum. Your membership is now active.
            </p>
            
            {/* Email status indicator */}
            <div className="flex items-center justify-center gap-2 text-sm">
              {emailStatus === "sending" && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">Sending confirmation email...</span>
                </>
              )}
              {emailStatus === "sent" && (
                <>
                  <Mail className="h-4 w-4 text-accent" />
                  <span className="text-accent">Confirmation email sent!</span>
                </>
              )}
              {emailStatus === "error" && (
                <span className="text-muted-foreground">
                  You will receive a confirmation email shortly.
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button asChild>
                <Link to="/">Go to Dashboard</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/investors">View Membership Benefits</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentSuccess;

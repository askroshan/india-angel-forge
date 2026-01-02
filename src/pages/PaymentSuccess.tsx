import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { CheckCircle } from "lucide-react";

const PaymentSuccess = () => {
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
            <p className="text-sm text-muted-foreground">
              You will receive a confirmation email shortly with your membership details and next steps.
            </p>
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

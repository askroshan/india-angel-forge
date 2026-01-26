import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Founders from "./pages/Founders";
import MyRegistrationsPage from "./pages/MyRegistrations";
import Investors from "./pages/Investors";
import Portfolio from "./pages/Portfolio";
import About from "./pages/About";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import ApplyFounder from "./pages/ApplyFounder";
import ApplyInvestor from "./pages/ApplyInvestor";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import PaymentSuccess from "./pages/PaymentSuccess";
import Membership from "./pages/Membership";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import CodeOfConduct from "./pages/CodeOfConduct";
import NotFound from "./pages/NotFound";
import KYCUpload from "./pages/investor/KYCUpload";
import DealsPage from "./pages/investor/DealsPage";
import KYCReviewDashboard from "./pages/compliance/KYCReviewDashboard";
import AMLScreeningDashboard from "./pages/compliance/AMLScreeningDashboard";
import UserRoleManagement from "./pages/admin/UserRoleManagement";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            {/* Skip to main content link for accessibility */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            >
              Skip to main content
            </a>
            <ScrollToTop />
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/founders" element={<Founders />} />
            <Route path="/investors" element={<Investors />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/about" element={<About />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:slug" element={<EventDetail />} />
            <Route path="/my-registrations" element={
              <ProtectedRoute>
                <MyRegistrationsPage />
              </ProtectedRoute>
            } />
            <Route path="/apply/founder" element={<ApplyFounder />} />
            <Route path="/apply/investor" element={<ApplyInvestor />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/membership" element={
              <ProtectedRoute>
                <Membership />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            {/* Investor Routes */}
            <Route path="/investor/kyc" element={
              <ProtectedRoute>
                <KYCUpload />
              </ProtectedRoute>
            } />
            <Route path="/deals" element={
              <ProtectedRoute>
                <DealsPage />
              </ProtectedRoute>
            } />
            {/* Compliance Routes */}
            <Route path="/compliance/kyc-review" element={
              <ProtectedRoute>
                <KYCReviewDashboard />
              </ProtectedRoute>
            } />
            <Route path="/compliance/aml-screening" element={
              <ProtectedRoute>
                <AMLScreeningDashboard />
              </ProtectedRoute>
            } />
            {/* Admin Routes */}
            <Route path="/admin/users" element={
              <ProtectedRoute>
                <UserRoleManagement />
              </ProtectedRoute>
            } />
            {/* Legal & Contact Pages */}
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/code-of-conduct" element={<CodeOfConduct />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;

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
import DealPipeline from "./pages/investor/DealPipeline";
import DealDocuments from "./pages/investor/DealDocuments";
import InvestmentCommitment from "./pages/investor/InvestmentCommitment";
import CreateSPV from "./pages/investor/CreateSPV";
import InviteCoInvestors from "./pages/investor/InviteCoInvestors";
import SPVDashboard from "./pages/investor/SPVDashboard";
import PortfolioPerformance from "./pages/investor/PortfolioPerformance";
import PortfolioDashboard from "./pages/investor/PortfolioDashboard";
import PortfolioUpdates from "./pages/investor/PortfolioUpdates";
import SharedDocuments from "./pages/investor/SharedDocuments";
import ApplicationStatus from "./pages/founder/ApplicationStatus";
import InvestorDirectory from "./pages/founder/InvestorDirectory";
import PitchSessions from "./pages/founder/PitchSessions";
import PitchMaterials from "./pages/founder/PitchMaterials";
import InvestorUpdates from "./pages/founder/InvestorUpdates";
import InvestorDocuments from "./pages/founder/InvestorDocuments";
import KYCReviewDashboard from "./pages/compliance/KYCReviewDashboard";
import AMLScreeningDashboard from "./pages/compliance/AMLScreeningDashboard";
import AccreditationVerification from "./pages/compliance/AccreditationVerification";
import UserRoleManagement from "./pages/admin/UserRoleManagement";
import AuditLogs from "./pages/admin/AuditLogs";

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
            <Route path="/founder/application-status" element={
              <ProtectedRoute>
                <ApplicationStatus />
              </ProtectedRoute>
            } />
            <Route path="/founder/investors" element={
              <ProtectedRoute>
                <InvestorDirectory />
              </ProtectedRoute>
            } />
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
            <Route path="/investor/pipeline" element={
              <ProtectedRoute>
                <DealPipeline />
              </ProtectedRoute>
            } />
            <Route path="/deals/:dealId/documents" element={
              <ProtectedRoute>
                <DealDocuments />
              </ProtectedRoute>
            } />
            <Route path="/investor/commitments/:interestId" element={
              <ProtectedRoute>
                <InvestmentCommitment />
              </ProtectedRoute>
            } />
            <Route path="/investor/spv/create/:interestId" element={
              <ProtectedRoute>
                <CreateSPV />
              </ProtectedRoute>
            } />
            <Route path="/investor/spv/:spvId/invite" element={
              <ProtectedRoute>
                <InviteCoInvestors />
              </ProtectedRoute>
            } />
            <Route path="/investor/spv/:spvId" element={
              <ProtectedRoute>
                <SPVDashboard />
              </ProtectedRoute>
            } />
            <Route path="/investor/portfolio/performance" element={
              <ProtectedRoute>
                <PortfolioPerformance />
              </ProtectedRoute>
            } />
            <Route path="/investor/portfolio" element={
              <ProtectedRoute>
                <PortfolioDashboard />
              </ProtectedRoute>
            } />
            <Route path="/investor/portfolio/updates" element={
              <ProtectedRoute>
                <PortfolioUpdates />
              </ProtectedRoute>
            } />
            <Route path="/investor/shared-documents" element={
              <ProtectedRoute>
                <SharedDocuments />
              </ProtectedRoute>
            } />
            {/* Founder Routes */}
            <Route path="/founder/application-status" element={
              <ProtectedRoute>
                <ApplicationStatus />
              </ProtectedRoute>
            } />
            <Route path="/founder/investors" element={
              <ProtectedRoute>
                <InvestorDirectory />
              </ProtectedRoute>
            } />
            <Route path="/founder/pitch-sessions" element={
              <ProtectedRoute>
                <PitchSessions />
              </ProtectedRoute>
            } />
            <Route path="/founder/pitch-materials" element={
              <ProtectedRoute>
                <PitchMaterials />
              </ProtectedRoute>
            } />
            <Route path="/founder/investor-updates" element={
              <ProtectedRoute>
                <InvestorUpdates />
              </ProtectedRoute>
            } />
            <Route path="/founder/investor-documents" element={
              <ProtectedRoute>
                <InvestorDocuments />
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
            <Route path="/compliance/accreditation" element={
              <ProtectedRoute>
                <AccreditationVerification />
              </ProtectedRoute>
            } />
            {/* Admin Routes */}
            <Route path="/admin/users" element={
              <ProtectedRoute>
                <UserRoleManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/audit-logs" element={
              <ProtectedRoute>
                <AuditLogs />
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

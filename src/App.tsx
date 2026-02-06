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
import AccessDenied from "./pages/AccessDenied";
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
import DealAnalytics from "./pages/investor/DealAnalytics";
import DueDiligenceChecklist from "./pages/investor/DueDiligenceChecklist";
import ApplicationStatus from "./pages/founder/ApplicationStatus";
import InvestorDirectory from "./pages/founder/InvestorDirectory";
import PitchSessions from "./pages/founder/PitchSessions";
import PitchMaterials from "./pages/founder/PitchMaterials";
import InvestorUpdates from "./pages/founder/InvestorUpdates";
import InvestorDocuments from "./pages/founder/InvestorDocuments";
import CompanyProfile from "./pages/founder/CompanyProfile";
import FundraisingProgress from "./pages/founder/FundraisingProgress";
import KYCReviewDashboard from "./pages/compliance/KYCReviewDashboard";
import AMLScreeningDashboard from "./pages/compliance/AMLScreeningDashboard";
import AccreditationVerification from "./pages/compliance/AccreditationVerification";
import UserRoleManagement from "./pages/admin/UserRoleManagement";
import AuditLogs from "./pages/admin/AuditLogs";
import ApplicationScreening from "./pages/moderator/ApplicationScreening";
import ContentModeration from "./pages/moderator/ContentModeration";
import EventAttendance from "./pages/moderator/EventAttendance";
import AdvisoryHours from "./pages/operator/AdvisoryHours";
import AdvisoryProfile from "./pages/operator/AdvisoryProfile";
import MentorshipHub from "./pages/operator/MentorshipHub";
import Certificates from "./pages/Certificates";
import CertificateVerification from "./pages/CertificateVerification";
import TransactionHistory from "./pages/TransactionHistory";

/**
 * Role definitions for route protection
 * These match the roles stored in the database UserRole table
 */
const ROLES = {
  ADMIN: 'admin',
  COMPLIANCE: 'compliance_officer',
  MODERATOR: 'moderator',
  FOUNDER: 'founder',
  INVESTOR: 'investor',
  ANGEL_INVESTOR: 'angel_investor',
  VC_PARTNER: 'vc_partner',
  FAMILY_OFFICE: 'family_office',
  OPERATOR_ANGEL: 'operator_angel',
  USER: 'user',
} as const;

/** All investor-type roles that can access investor features */
const INVESTOR_ROLES = [ROLES.INVESTOR, ROLES.ANGEL_INVESTOR, ROLES.VC_PARTNER, ROLES.FAMILY_OFFICE, ROLES.ADMIN];

/** All founder-type roles that can access founder features */
const FOUNDER_ROLES = [ROLES.FOUNDER, ROLES.ADMIN];

/** All compliance-type roles that can access compliance features */
const COMPLIANCE_ROLES = [ROLES.COMPLIANCE, ROLES.ADMIN];

/** All moderator-type roles that can access moderation features */
const MODERATOR_ROLES = [ROLES.MODERATOR, ROLES.ADMIN];

/** All operator-type roles that can access operator/advisory features */
const OPERATOR_ROLES = [ROLES.OPERATOR_ANGEL, ROLES.ADMIN];

/** All admin-type roles */
const ADMIN_ROLES = [ROLES.ADMIN];

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
              <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            {/* Investor Routes */}
            <Route path="/investor/kyc" element={
              <ProtectedRoute allowedRoles={INVESTOR_ROLES}>
                <KYCUpload />
              </ProtectedRoute>
            } />
            <Route path="/deals" element={
              <ProtectedRoute allowedRoles={INVESTOR_ROLES}>
                <DealsPage />
              </ProtectedRoute>
            } />
            <Route path="/investor/deals" element={
              <ProtectedRoute allowedRoles={INVESTOR_ROLES}>
                <DealsPage />
              </ProtectedRoute>
            } />
            <Route path="/investor/pipeline" element={
              <ProtectedRoute allowedRoles={INVESTOR_ROLES}>
                <DealPipeline />
              </ProtectedRoute>
            } />
            <Route path="/deals/:dealId/documents" element={
              <ProtectedRoute allowedRoles={INVESTOR_ROLES}>
                <DealDocuments />
              </ProtectedRoute>
            } />
            <Route path="/investor/commitments/:interestId" element={
              <ProtectedRoute allowedRoles={INVESTOR_ROLES}>
                <InvestmentCommitment />
              </ProtectedRoute>
            } />
            <Route path="/investor/spv/create/:interestId" element={
              <ProtectedRoute allowedRoles={INVESTOR_ROLES}>
                <CreateSPV />
              </ProtectedRoute>
            } />
            <Route path="/investor/spv/:spvId/invite" element={
              <ProtectedRoute allowedRoles={INVESTOR_ROLES}>
                <InviteCoInvestors />
              </ProtectedRoute>
            } />
            <Route path="/investor/spv/:spvId" element={
              <ProtectedRoute allowedRoles={INVESTOR_ROLES}>
                <SPVDashboard />
              </ProtectedRoute>
            } />
            <Route path="/investor/portfolio/performance" element={
              <ProtectedRoute allowedRoles={INVESTOR_ROLES}>
                <PortfolioPerformance />
              </ProtectedRoute>
            } />
            <Route path="/investor/portfolio" element={
              <ProtectedRoute allowedRoles={INVESTOR_ROLES}>
                <PortfolioDashboard />
              </ProtectedRoute>
            } />
            <Route path="/investor/portfolio/updates" element={
              <ProtectedRoute allowedRoles={INVESTOR_ROLES}>
                <PortfolioUpdates />
              </ProtectedRoute>
            } />
            <Route path="/investor/shared-documents" element={
              <ProtectedRoute allowedRoles={INVESTOR_ROLES}>
                <SharedDocuments />
              </ProtectedRoute>
            } />
            <Route path="/investor/deal-analytics" element={
              <ProtectedRoute allowedRoles={INVESTOR_ROLES}>
                <DealAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/investor/due-diligence/:dealId" element={
              <ProtectedRoute allowedRoles={INVESTOR_ROLES}>
                <DueDiligenceChecklist />
              </ProtectedRoute>
            } />
            {/* Founder Routes */}
            <Route path="/founder/application-status" element={
              <ProtectedRoute allowedRoles={FOUNDER_ROLES}>
                <ApplicationStatus />
              </ProtectedRoute>
            } />
            <Route path="/founder/investors" element={
              <ProtectedRoute allowedRoles={FOUNDER_ROLES}>
                <InvestorDirectory />
              </ProtectedRoute>
            } />
            <Route path="/founder/pitch-sessions" element={
              <ProtectedRoute allowedRoles={FOUNDER_ROLES}>
                <PitchSessions />
              </ProtectedRoute>
            } />
            <Route path="/founder/pitch-materials" element={
              <ProtectedRoute allowedRoles={FOUNDER_ROLES}>
                <PitchMaterials />
              </ProtectedRoute>
            } />
            <Route path="/founder/investor-updates" element={
              <ProtectedRoute allowedRoles={FOUNDER_ROLES}>
                <InvestorUpdates />
              </ProtectedRoute>
            } />
            <Route path="/founder/investor-documents" element={
              <ProtectedRoute allowedRoles={FOUNDER_ROLES}>
                <InvestorDocuments />
              </ProtectedRoute>
            } />
            <Route path="/founder/company-profile" element={
              <ProtectedRoute allowedRoles={FOUNDER_ROLES}>
                <CompanyProfile />
              </ProtectedRoute>
            } />
            <Route path="/founder/fundraising-progress" element={
              <ProtectedRoute allowedRoles={FOUNDER_ROLES}>
                <FundraisingProgress />
              </ProtectedRoute>
            } />
            {/* Compliance Routes */}
            <Route path="/compliance/kyc-review" element={
              <ProtectedRoute allowedRoles={COMPLIANCE_ROLES}>
                <KYCReviewDashboard />
              </ProtectedRoute>
            } />
            <Route path="/compliance/aml-screening" element={
              <ProtectedRoute allowedRoles={COMPLIANCE_ROLES}>
                <AMLScreeningDashboard />
              </ProtectedRoute>
            } />
            <Route path="/compliance/accreditation" element={
              <ProtectedRoute allowedRoles={COMPLIANCE_ROLES}>
                <AccreditationVerification />
              </ProtectedRoute>
            } />
            {/* Admin Routes */}
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                <UserRoleManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/audit-logs" element={
              <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                <AuditLogs />
              </ProtectedRoute>
            } />
            {/* Moderator Routes */}
            <Route path="/moderator/applications" element={
              <ProtectedRoute allowedRoles={MODERATOR_ROLES}>
                <ApplicationScreening />
              </ProtectedRoute>
            } />
            <Route path="/moderator/content" element={
              <ProtectedRoute allowedRoles={MODERATOR_ROLES}>
                <ContentModeration />
              </ProtectedRoute>
            } />
            <Route path="/moderator/events" element={
              <ProtectedRoute allowedRoles={MODERATOR_ROLES}>
                <EventAttendance />
              </ProtectedRoute>
            } />
            {/* Operator/Advisory Routes */}
            <Route path="/operator/advisory" element={
              <ProtectedRoute allowedRoles={OPERATOR_ROLES}>
                <AdvisoryHours />
              </ProtectedRoute>
            } />
            <Route path="/operator/profile" element={
              <ProtectedRoute allowedRoles={OPERATOR_ROLES}>
                <AdvisoryProfile />
              </ProtectedRoute>
            } />
            <Route path="/operator/mentorship" element={
              <ProtectedRoute allowedRoles={OPERATOR_ROLES}>
                <MentorshipHub />
              </ProtectedRoute>
            } />
            {/* Phase 2 Routes - Transaction History & Certificates */}
            <Route path="/transaction-history" element={
              <ProtectedRoute>
                <TransactionHistory />
              </ProtectedRoute>
            } />
            <Route path="/certificates" element={
              <ProtectedRoute>
                <Certificates />
              </ProtectedRoute>
            } />
            {/* Public Certificate Verification - No Auth Required */}
            <Route path="/verify/:certificateId" element={<CertificateVerification />} />
            {/* Access Denied Page */}
            <Route path="/access-denied" element={<AccessDenied />} />
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

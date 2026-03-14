import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  Briefcase,
  IndianRupee,
  Users,
  MessageSquare,
  FileText,
  AlertCircle,
  BarChart2,
  Building2,
  CheckCircle,
} from 'lucide-react';
import Navigation from '@/components/Navigation';

interface DashboardData {
  active_deals: number;
  my_interests: number;
  pending_commitments: number;
  portfolio_value: number;
  total_committed: number;
  pending_kyc: number;
  active_spvs: number;
  unread_messages: number;
  portfolio_companies: number;
}

const formatCurrency = (amount: number): string => {
  if (amount === 0) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} Lac`;
  return `₹${amount.toLocaleString('en-IN')}`;
};

export default function InvestorDashboard() {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['investor-dashboard'],
    queryFn: () => apiClient.get<DashboardData>('/api/investor/dashboard'),
  });

  return (
    <>
      <Navigation />
      <main className="container mx-auto px-4 py-8" data-testid="investor-dashboard">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Investor Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your investment activity</p>
        </div>

        {isLoading && (
          <div className="text-center py-12 text-muted-foreground" data-testid="dashboard-loading">
            Loading dashboard…
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to load dashboard data. Please try again.</AlertDescription>
          </Alert>
        )}

        {data && (
          <>
            {/* KPI grid */}
            <div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8"
              data-testid="dashboard-kpis"
            >
              <Card data-testid="kpi-portfolio-value">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Portfolio Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(data.portfolio_value)}</p>
                </CardContent>
              </Card>

              <Card data-testid="kpi-total-committed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" />
                    Total Committed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(data.total_committed)}</p>
                </CardContent>
              </Card>

              <Card data-testid="kpi-portfolio-companies">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Portfolio Companies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{data.portfolio_companies}</p>
                </CardContent>
              </Card>

              <Card data-testid="kpi-active-deals">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Open Deals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{data.active_deals}</p>
                </CardContent>
              </Card>

              <Card data-testid="kpi-my-interests">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <BarChart2 className="h-4 w-4" />
                    My Interests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{data.my_interests}</p>
                </CardContent>
              </Card>

              <Card data-testid="kpi-active-spvs">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Active SPVs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{data.active_spvs}</p>
                </CardContent>
              </Card>

              <Card data-testid="kpi-unread-messages">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Unread Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{data.unread_messages}</p>
                </CardContent>
              </Card>

              <Card
                data-testid="kpi-pending-kyc"
                className={data.pending_kyc > 0 ? 'border-amber-300' : ''}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Pending KYC
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${data.pending_kyc > 0 ? 'text-amber-600' : ''}`}>
                    {data.pending_kyc}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <Button variant="outline" asChild>
                    <Link to="/deals" data-testid="quick-link-browse-deals">Browse Deals</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/investor/portfolio" data-testid="quick-link-portfolio">Portfolio</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/investor/pipeline" data-testid="quick-link-pipeline">Deal Pipeline</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/investor/messages" data-testid="quick-link-messages">Messages</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/investor/spv" data-testid="quick-link-spv">My SPVs</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/investor/kyc" data-testid="quick-link-kyc">KYC Status</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.pending_kyc > 0 && (
                    <div className="flex items-center gap-3 text-sm">
                      <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      <span>
                        {data.pending_kyc} KYC{data.pending_kyc > 1 ? ' documents' : ' document'} pending review
                      </span>
                      <Button variant="link" size="sm" className="ml-auto p-0 h-auto" asChild>
                        <Link to="/investor/kyc">View</Link>
                      </Button>
                    </div>
                  )}
                  {data.unread_messages > 0 && (
                    <div className="flex items-center gap-3 text-sm">
                      <MessageSquare className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span>{data.unread_messages} unread message thread{data.unread_messages > 1 ? 's' : ''}</span>
                      <Button variant="link" size="sm" className="ml-auto p-0 h-auto" asChild>
                        <Link to="/investor/messages">View</Link>
                      </Button>
                    </div>
                  )}
                  {data.pending_commitments > 0 && (
                    <div className="flex items-center gap-3 text-sm">
                      <Briefcase className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <span>{data.pending_commitments} pending commitment{data.pending_commitments > 1 ? 's' : ''}</span>
                      <Button variant="link" size="sm" className="ml-auto p-0 h-auto" asChild>
                        <Link to="/investor/commitments">View</Link>
                      </Button>
                    </div>
                  )}
                  {data.pending_kyc === 0 && data.unread_messages === 0 && data.pending_commitments === 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>All caught up!</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </>
  );
}

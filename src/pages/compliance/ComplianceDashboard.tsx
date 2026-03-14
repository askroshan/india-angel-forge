/**
 * US-COMPLIANCE-005: Compliance Dashboard
 *
 * As a: Compliance Officer
 * I want to: View a summary dashboard of all compliance activity
 * So that: I can quickly identify outstanding items requiring my attention
 *
 * Acceptance Criteria:
 * - View KPI cards: Pending KYC, Pending AML, Pending Accreditations
 * - View links to each compliance workflow
 * - See recent compliance audit actions
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Shield, CheckCircle, AlertTriangle, ClipboardList, ArrowRight } from 'lucide-react';

interface ComplianceStats {
  pendingKYC: number;
  verifiedKYC: number;
  rejectedKYC: number;
  pendingAML: number;
  flaggedAML: number;
  clearedAML: number;
  pendingAccreditations: number;
  approvedAccreditations: number;
  totalAuditLogs: number;
}

export default function ComplianceDashboard() {
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboard = async () => {
    if (!token) {
      navigate('/auth');
      return;
    }

    try {
      const response = await fetch('/api/compliance/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        setAccessDenied(true);
        return;
      }

      if (!response.ok) throw new Error('Failed to load dashboard');

      const data = await response.json();
      setStats(data);
    } catch {
      setStats({
        pendingKYC: 0,
        verifiedKYC: 0,
        rejectedKYC: 0,
        pendingAML: 0,
        flaggedAML: 0,
        clearedAML: 0,
        pendingAccreditations: 0,
        approvedAccreditations: 0,
        totalAuditLogs: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (accessDenied) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have permission to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Pending KYC Reviews',
      value: stats?.pendingKYC ?? 0,
      description: `${stats?.verifiedKYC ?? 0} verified, ${stats?.rejectedKYC ?? 0} rejected`,
      icon: FileText,
      href: '/compliance/kyc-review',
      urgent: (stats?.pendingKYC ?? 0) > 0,
      testId: 'kpi-pending-kyc',
    },
    {
      title: 'Pending AML Screenings',
      value: stats?.pendingAML ?? 0,
      description: `${stats?.flaggedAML ?? 0} flagged, ${stats?.clearedAML ?? 0} cleared`,
      icon: Shield,
      href: '/compliance/aml-screening',
      urgent: (stats?.flaggedAML ?? 0) > 0,
      testId: 'kpi-pending-aml',
    },
    {
      title: 'Pending Accreditations',
      value: stats?.pendingAccreditations ?? 0,
      description: `${stats?.approvedAccreditations ?? 0} approved`,
      icon: CheckCircle,
      href: '/compliance/accreditation',
      urgent: (stats?.pendingAccreditations ?? 0) > 0,
      testId: 'kpi-pending-accreditations',
    },
    {
      title: 'Audit Log Entries',
      value: stats?.totalAuditLogs ?? 0,
      description: 'Total compliance actions recorded',
      icon: ClipboardList,
      href: '/compliance/audit-logs',
      urgent: false,
      testId: 'kpi-audit-logs',
    },
  ];

  return (
    <div className="container mx-auto py-8" data-testid="compliance-dashboard">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Compliance Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of all compliance workflows and outstanding actions
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading dashboard...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpiCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title} className={card.urgent ? 'border-orange-300' : ''} data-testid={card.testId}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      {card.urgent && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" data-testid={`${card.testId}-alert`} />
                      )}
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1" data-testid={`${card.testId}-count`}>{card.value}</div>
                    <p className="text-xs text-muted-foreground mb-3">{card.description}</p>
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link to={card.href}>
                        View <ArrowRight className="ml-2 h-3 w-3" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  KYC Review
                </CardTitle>
                <CardDescription>
                  Review and verify investor identity documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Badge variant="secondary">{stats?.pendingKYC ?? 0} Pending</Badge>
                  <Badge variant="default">{stats?.verifiedKYC ?? 0} Verified</Badge>
                </div>
                <Button asChild className="w-full mt-4" variant="outline">
                  <Link to="/compliance/kyc-review">Open KYC Review</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  AML Screening
                </CardTitle>
                <CardDescription>
                  Screen investors against AML databases and sanctions lists
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Badge variant="secondary">{stats?.pendingAML ?? 0} Pending</Badge>
                  {(stats?.flaggedAML ?? 0) > 0 && (
                    <Badge variant="destructive">{stats?.flaggedAML ?? 0} Flagged</Badge>
                  )}
                </div>
                <Button asChild className="w-full mt-4" variant="outline">
                  <Link to="/compliance/aml-screening">Open AML Screening</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Accreditation
                </CardTitle>
                <CardDescription>
                  Verify investor accreditation status and income eligibility
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Badge variant="secondary">{stats?.pendingAccreditations ?? 0} Pending</Badge>
                  <Badge variant="default">{stats?.approvedAccreditations ?? 0} Approved</Badge>
                </div>
                <Button asChild className="w-full mt-4" variant="outline">
                  <Link to="/compliance/accreditation">Open Accreditation</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

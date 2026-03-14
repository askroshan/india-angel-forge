import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Calendar, Building2, CheckCircle } from 'lucide-react';

interface PerformanceSummary {
  totalReferrals: number;
  acceptedReferrals: number;
  referralsThisMonth: number;
  eventsAttended: number;
  upcomingEvents: number;
}

export default function OperatorPerformance() {
  const { user } = useAuth();

  const { data: summary, isLoading } = useQuery<PerformanceSummary>({
    queryKey: ['operator-performance'],
    queryFn: () => apiClient.get<PerformanceSummary>('/api/operator/performance-summary'),
    enabled: !!user,
  });

  const metrics = [
    {
      label: 'Total Deal Referrals',
      value: summary?.totalReferrals ?? 0,
      sub: `${summary?.referralsThisMonth ?? 0} this month`,
      icon: <Building2 className="h-5 w-5 text-blue-500" />,
      testId: 'metric-total-referrals',
    },
    {
      label: 'Referrals Accepted',
      value: summary?.acceptedReferrals ?? 0,
      sub: summary?.totalReferrals
        ? `${Math.round(((summary?.acceptedReferrals ?? 0) / summary.totalReferrals) * 100)}% acceptance rate`
        : '—',
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      testId: 'metric-accepted-referrals',
    },
    {
      label: 'Events Attended',
      value: summary?.eventsAttended ?? 0,
      sub: `${summary?.upcomingEvents ?? 0} upcoming`,
      icon: <Calendar className="h-5 w-5 text-purple-500" />,
      testId: 'metric-events-attended',
    },
    {
      label: 'Engagement Score',
      value: summary
        ? ((summary.eventsAttended * 2) + (summary.acceptedReferrals * 5) + summary.totalReferrals)
        : 0,
      sub: 'Based on events + referrals',
      icon: <TrendingUp className="h-5 w-5 text-amber-500" />,
      testId: 'metric-engagement-score',
    },
  ];

  return (
    <div className="space-y-6" data-testid="operator-performance-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Performance Overview</h1>
        <p className="text-muted-foreground mt-1">
          Your impact and engagement as an Operator Angel
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="performance-metrics">
        {metrics.map(metric => (
          <Card key={metric.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
              {metric.icon}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div
                    className="text-3xl font-bold"
                    data-testid={metric.testId}
                  >
                    {metric.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{metric.sub}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          ) : (
            <ul className="space-y-2 text-sm" data-testid="activity-summary-list">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>
                  Referred <strong>{summary?.totalReferrals ?? 0}</strong> startups to the forum
                  {(summary?.acceptedReferrals ?? 0) > 0 && `, ${summary!.acceptedReferrals} accepted`}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-500" />
                <span>
                  Confirmed for <strong>{summary?.eventsAttended ?? 0}</strong> forum events
                  {(summary?.upcomingEvents ?? 0) > 0 && `, ${summary!.upcomingEvents} upcoming`}
                </span>
              </li>
              {(summary?.referralsThisMonth ?? 0) > 0 && (
                <li className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                  <span>
                    Submitted <strong>{summary?.referralsThisMonth}</strong> referral(s) this month
                  </span>
                </li>
              )}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

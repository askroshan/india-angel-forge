import { useQuery } from '@tanstack/react-query';
import { getSystemStatistics } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function SystemStatistics() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['system-statistics'],
    queryFn: getSystemStatistics,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-600">
          Failed to load statistics. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">System Statistics</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Total Users */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users.total || 0}</div>
          </CardContent>
        </Card>

        {/* Total Deals */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.deals.total || 0}</div>
          </CardContent>
        </Card>

        {/* Total Investment */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Investment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats?.deals.totalInvestment || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {/* Total Events */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.events.total || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Users by Role */}
        <Card>
          <CardHeader>
            <CardTitle>Users by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.users.byRole && Object.entries(stats.users.byRole).map(([role, count]) => (
                <div key={role} className="flex justify-between items-center">
                  <span className="capitalize">
                    {role.replace('_', ' ')}s
                  </span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Event Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Event Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Total Events</span>
                <span className="font-semibold">{stats?.events.total || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Attendees</span>
                <span className="font-semibold">{stats?.events.totalAttendees || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Growth Chart */}
      {stats?.growth && stats.growth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>User Growth Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.growth.map((data) => (
                <div key={data.month} className="flex justify-between items-center">
                  <span>{data.month}</span>
                  <span className="font-semibold">{data.users}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

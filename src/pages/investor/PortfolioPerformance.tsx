import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, IndianRupee, AlertCircle, Briefcase, BarChart3, Info, PieChart } from 'lucide-react';

// Types
interface PerformanceOverview {
  total_deployed_capital: number;
  total_current_value: number;
  unrealized_gains: number;
  realized_returns: number;
  portfolio_irr: number;
  total_companies: number;
  active_companies: number;
  exited_companies: number;
}

interface SectorPerformance {
  sector: string;
  deployed: number;
  current_value: number;
  return_percentage: number;
}

interface StagePerformance {
  stage: string;
  deployed: number;
  current_value: number;
  return_percentage: number;
}

interface PerformanceData {
  overview: PerformanceOverview;
  by_sector: SectorPerformance[];
  by_stage: StagePerformance[];
  performance_over_time: Array<{ month: string; portfolio_value: number }>;
}

// Helper functions
const formatIndianCurrency = (amount: number): string => {
  const absAmount = Math.abs(amount);
  if (absAmount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)} Cr`;
  } else if (absAmount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)} Lac`;
  } else if (absAmount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount.toFixed(0)}`;
};

const STAGE_LABELS: Record<string, string> = {
  SEED: 'Seed',
  SERIES_A: 'Series A',
  SERIES_B: 'Series B',
  SERIES_C: 'Series C',
  SERIES_D: 'Series D',
  PRE_SEED: 'Pre-Seed',
};

const PortfolioPerformance = () => {
  // Fetch portfolio performance data
  const { data: performanceData, isLoading, error } = useQuery<PerformanceData>({
    queryKey: ['portfolio-performance'],
    queryFn: async () => {
      const response = await apiClient.get<PerformanceData>('/api/portfolio/performance');
      return response;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading performance data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading performance data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!performanceData || performanceData.overview.total_companies === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Portfolio Performance</h1>
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No performance data available</h3>
            <p className="text-muted-foreground">
              Make investments to start tracking your portfolio performance
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { overview, by_sector, by_stage } = performanceData;
  const totalGains = overview.unrealized_gains + overview.realized_returns;
  const totalReturnPercentage = overview.total_deployed_capital > 0
    ? (totalGains / overview.total_deployed_capital) * 100
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Portfolio Performance</h1>
          <p className="text-muted-foreground">
            Comprehensive analysis of your investment returns
          </p>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Deployed Capital
              </CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatIndianCurrency(overview.total_deployed_capital)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Invested amount
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Current Value
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatIndianCurrency(overview.total_current_value)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Mark-to-market
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Unrealized Gains
              </CardTitle>
              {overview.unrealized_gains >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${overview.unrealized_gains >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatIndianCurrency(overview.unrealized_gains)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Active investments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Realized Returns
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatIndianCurrency(overview.realized_returns)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From {overview.exited_companies} exits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Portfolio IRR
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${overview.portfolio_irr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {overview.portfolio_irr >= 0 ? '+' : ''}{overview.portfolio_irr.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Annualized return
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Performance</CardTitle>
            <CardDescription>
              Total return across {overview.total_companies} portfolio companies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Return</span>
              <span className={`text-lg font-bold ${totalReturnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalReturnPercentage >= 0 ? '+' : ''}{totalReturnPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={Math.min(Math.abs(totalReturnPercentage), 100)}
              className="h-2"
            />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Active Companies:</span>
                <span className="ml-2 font-semibold">{overview.active_companies}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Exited:</span>
                <span className="ml-2 font-semibold">{overview.exited_companies}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance by Sector */}
        {by_sector.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Performance by Sector
              </CardTitle>
              <CardDescription>
                Returns across different industry sectors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {by_sector.map((sector) => (
                  <div key={sector.sector} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{sector.sector}</div>
                        <div className="text-sm text-muted-foreground">
                          Deployed: {formatIndianCurrency(sector.deployed)} • Current: {formatIndianCurrency(sector.current_value)}
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${sector.return_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {sector.return_percentage >= 0 ? '+' : ''}{sector.return_percentage.toFixed(1)}%
                      </div>
                    </div>
                    <Progress
                      value={Math.min(Math.abs(sector.return_percentage), 100)}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance by Stage */}
        {by_stage.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance by Stage
              </CardTitle>
              <CardDescription>
                Returns across different funding stages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {by_stage.map((stage) => (
                  <div key={stage.stage} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{STAGE_LABELS[stage.stage] || stage.stage}</div>
                        <div className="text-sm text-muted-foreground">
                          Deployed: {formatIndianCurrency(stage.deployed)} • Current: {formatIndianCurrency(stage.current_value)}
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${stage.return_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stage.return_percentage >= 0 ? '+' : ''}{stage.return_percentage.toFixed(1)}%
                      </div>
                    </div>
                    <Progress
                      value={Math.min(Math.abs(stage.return_percentage), 100)}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Understanding Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-1">Deployed Capital</h4>
              <p className="text-sm text-muted-foreground">
                Total amount you've invested across all portfolio companies.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Current Value (Mark-to-Market)</h4>
              <p className="text-sm text-muted-foreground">
                Present value of your investments based on latest valuations or exit prices.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Unrealized Gains/Losses</h4>
              <p className="text-sm text-muted-foreground">
                Profit or loss on active investments that haven't been exited yet. These gains are "paper gains" until exit.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Realized Returns</h4>
              <p className="text-sm text-muted-foreground">
                Actual profit from companies you've exited through sales or IPOs.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Portfolio IRR</h4>
              <p className="text-sm text-muted-foreground">
                Internal Rate of Return - the annualized rate at which your portfolio is growing, considering timing of investments and returns.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PortfolioPerformance;

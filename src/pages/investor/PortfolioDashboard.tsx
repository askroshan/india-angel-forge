import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  DollarSign, 
  Briefcase,
  Clock,
  ArrowRight,
  Building
} from 'lucide-react';

interface PortfolioCompany {
  id: string;
  company_name: string;
  investment_amount: number;
  investment_date: string;
  current_valuation?: number;
  exit_valuation?: number;
  ownership_percentage: number;
  status: string;
  sector?: string;
  stage?: string;
}

export default function PortfolioDashboard() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<PortfolioCompany[]>([]);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('portfolio_companies')
        .select('*')
        .eq('investor_id', session.user.id);

      if (error) {
        console.error('Error fetching portfolio:', error);
        return;
      }

      if (data) {
        setCompanies(data);
      }

    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateROI = (company: PortfolioCompany) => {
    const currentValue = company.status === 'exited' 
      ? (company.exit_valuation || 0)
      : (company.current_valuation || company.investment_amount);
    
    return ((currentValue - company.investment_amount) / company.investment_amount) * 100;
  };

  const totalInvested = companies.reduce((sum, c) => sum + c.investment_amount, 0);
  
  const currentPortfolioValue = companies.reduce((sum, c) => {
    if (c.status === 'exited') {
      return sum + (c.exit_valuation || 0);
    }
    return sum + (c.current_valuation || c.investment_amount);
  }, 0);

  const activeInvestments = companies.filter(c => c.status === 'active').length;

  // Group by sector
  const sectorBreakdown = companies.reduce((acc, company) => {
    const sector = company.sector || 'Other';
    if (!acc[sector]) {
      acc[sector] = 0;
    }
    acc[sector] += company.investment_amount;
    return acc;
  }, {} as Record<string, number>);

  // Group by stage
  const stageBreakdown = companies.reduce((acc, company) => {
    const stage = company.stage || 'Unknown';
    if (!acc[stage]) {
      acc[stage] = 0;
    }
    acc[stage] += company.investment_amount;
    return acc;
  }, {} as Record<string, number>);

  // Top performers (sorted by ROI)
  const topPerformers = [...companies]
    .sort((a, b) => calculateROI(b) - calculateROI(a))
    .slice(0, 3);

  // Recent investments
  const recentInvestments = [...companies]
    .sort((a, b) => new Date(b.investment_date).getTime() - new Date(a.investment_date).getTime())
    .slice(0, 5);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(amount / 100000).toFixed(2)} L`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Clock className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Portfolio Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your investments
            </p>
          </div>
          {companies.length > 0 && (
            <Button onClick={() => navigate('/investor/portfolio/performance')}>
              View Detailed Performance
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        {companies.length > 0 ? (
          <>
            {/* Overview Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Invested</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalInvested)}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Portfolio Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(currentPortfolioValue)}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Briefcase className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Investments</p>
                    <p className="text-2xl font-bold">{activeInvestments}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Portfolio Composition */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* By Sector */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Portfolio by Sector</h3>
                <div className="space-y-3">
                  {Object.entries(sectorBreakdown).map(([sector, amount]) => {
                    const percentage = (amount / totalInvested) * 100;
                    return (
                      <div key={sector}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{sector}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(amount)} ({percentage.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* By Stage */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Portfolio by Stage</h3>
                <div className="space-y-3">
                  {Object.entries(stageBreakdown).map(([stage, amount]) => {
                    const percentage = (amount / totalInvested) * 100;
                    return (
                      <div key={stage}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{stage}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(amount)} ({percentage.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-600" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Top Performers */}
            {topPerformers.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Top Performers</h3>
                <div className="space-y-3">
                  {topPerformers.map((company) => {
                    const roi = calculateROI(company);
                    return (
                      <div key={company.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Building className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{company.company_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Invested {formatCurrency(company.investment_amount)}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className={roi >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {roi.toFixed(1)}% ROI
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Recent Investments</h3>
              <div className="space-y-3">
                {recentInvestments.map((company) => (
                  <div key={company.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{company.company_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(company.investment_date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(company.investment_amount)}</p>
                      {company.sector && (
                        <p className="text-sm text-muted-foreground">{company.sector}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        ) : (
          <Card className="p-12 text-center">
            <Briefcase className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No investments yet</h3>
            <p className="text-muted-foreground mb-6">
              Your portfolio will appear here once you make investments
            </p>
            <Button onClick={() => navigate('/investor/deals')}>
              Explore Investment Opportunities
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Clock, TrendingUp, DollarSign, BarChart3, PieChart } from 'lucide-react';

interface Deal {
  id: string;
  company_name?: string;
  valuation?: number;
  amount: number;
  status?: string;
  industry?: string;
  stage?: string;
}

interface IndustryStats {
  industry: string;
  count: number;
  totalAmount: number;
}

interface StageStats {
  stage: string;
  count: number;
  totalAmount: number;
}

export default function DealAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<Deal[]>([]);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('investor_id', session.user.id);

      if (error) {
        console.error('Error fetching deals:', error);
        return;
      }

      setDeals(data || []);

    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number): string => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount}`;
  };

  const getTotalInvestment = (): number => {
    return deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
  };

  const getAverageDealSize = (): number => {
    if (deals.length === 0) return 0;
    return getTotalInvestment() / deals.length;
  };

  const getAverageValuation = (): number => {
    const dealsWithValuation = deals.filter(d => d.valuation);
    if (dealsWithValuation.length === 0) return 0;
    const totalValuation = dealsWithValuation.reduce((sum, deal) => sum + (deal.valuation || 0), 0);
    return totalValuation / dealsWithValuation.length;
  };

  const getIndustryDistribution = (): IndustryStats[] => {
    const industryMap = new Map<string, IndustryStats>();
    
    deals.forEach(deal => {
      const industry = deal.industry || 'Unknown';
      const existing = industryMap.get(industry);
      
      if (existing) {
        existing.count += 1;
        existing.totalAmount += deal.amount || 0;
      } else {
        industryMap.set(industry, {
          industry,
          count: 1,
          totalAmount: deal.amount || 0,
        });
      }
    });

    return Array.from(industryMap.values()).sort((a, b) => b.count - a.count);
  };

  const getStageDistribution = (): StageStats[] => {
    const stageMap = new Map<string, StageStats>();
    
    deals.forEach(deal => {
      const stage = deal.stage || 'Unknown';
      const existing = stageMap.get(stage);
      
      if (existing) {
        existing.count += 1;
        existing.totalAmount += deal.amount || 0;
      } else {
        stageMap.set(stage, {
          stage,
          count: 1,
          totalAmount: deal.amount || 0,
        });
      }
    });

    return Array.from(stageMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
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

  const industryStats = getIndustryDistribution();
  const stageStats = getStageDistribution();
  const totalInvestment = getTotalInvestment();
  const averageDealSize = getAverageDealSize();
  const averageValuation = getAverageValuation();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Deal Analytics</h1>
          <p className="text-muted-foreground">
            Insights and metrics from your investment portfolio
          </p>
        </div>

        {/* Empty State */}
        {deals.length === 0 && (
          <Card className="p-12 text-center">
            <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Deal Data Available</h2>
            <p className="text-muted-foreground">
              Analytics will appear here once you start making investments
            </p>
          </Card>
        )}

        {/* Summary Cards */}
        {deals.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Deals</span>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-3xl font-bold">{deals.length}</div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Investment</span>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-3xl font-bold">{formatAmount(totalInvestment)}</div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Avg Deal Size</span>
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-3xl font-bold">{formatAmount(averageDealSize)}</div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Avg Valuation</span>
                  <PieChart className="h-4 w-4 text-orange-600" />
                </div>
                <div className="text-3xl font-bold">{formatAmount(averageValuation)}</div>
              </Card>
            </div>

            {/* Industry Distribution */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Industry Distribution
              </h2>
              <div className="space-y-4">
                {industryStats.map((stat) => (
                  <div key={stat.industry} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{stat.industry}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {stat.count} {stat.count === 1 ? 'deal' : 'deals'}
                        </span>
                        <span className="font-semibold">{formatAmount(stat.totalAmount)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(stat.totalAmount / totalInvestment) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Stage Distribution */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Funding Stage Distribution
              </h2>
              <div className="space-y-4">
                {stageStats.map((stat) => (
                  <div key={stat.stage} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{stat.stage}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {stat.count} {stat.count === 1 ? 'deal' : 'deals'}
                        </span>
                        <span className="font-semibold">{formatAmount(stat.totalAmount)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${(stat.totalAmount / totalInvestment) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Briefcase,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface PortfolioCompany {
  id: string;
  companyName: string;
  investmentAmount: number;
  investmentDate: string;
  currentValuation?: number;
  exitValuation?: number;
  equityPercentage: number;
  status: string;
}

export default function PortfolioPerformance() {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<PortfolioCompany[]>([]);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      if (!token) {
        navigate('/auth');
        return;
      }

      const response = await fetch('/api/portfolio/companies', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/auth');
        }
        return;
      }

      const data = await response.json();
      setCompanies(data || []);

    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateROI = (company: PortfolioCompany) => {
    const currentValue = company.status === 'exited' 
      ? (company.exitValuation || 0)
      : (company.currentValuation || company.investmentAmount);
    
    const roi = ((currentValue - company.investmentAmount) / company.investmentAmount) * 100;
    return roi.toFixed(1);
  };

  const calculateGain = (company: PortfolioCompany) => {
    const currentValue = company.status === 'exited' 
      ? (company.exitValuation || 0)
      : (company.currentValuation || company.investmentAmount);
    
    return currentValue - company.investmentAmount;
  };

  const totalInvested = companies.reduce((sum, c) => sum + c.investmentAmount, 0);
  
  const currentPortfolioValue = companies.reduce((sum, c) => {
    if (c.status === 'exited') {
      return sum + (c.exitValuation || 0);
    }
    return sum + (c.currentValuation || c.investmentAmount);
  }, 0);

  const realizedGains = companies
    .filter(c => c.status === 'exited')
    .reduce((sum, c) => sum + calculateGain(c), 0);

  const unrealizedGains = companies
    .filter(c => c.status === 'active')
    .reduce((sum, c) => sum + calculateGain(c), 0);

  const totalReturn = ((currentPortfolioValue - totalInvested) / totalInvested) * 100;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'exited':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <TrendingUp className="h-3 w-3 mr-1" />
            Exited
          </Badge>
        );
      case 'closed':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Closed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

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
        <div>
          <h1 className="text-3xl font-bold mb-2">Portfolio Performance</h1>
          <p className="text-muted-foreground">
            Track your investments and returns
          </p>
        </div>

        {/* Statistics Cards */}
        {companies.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <p className="text-sm text-muted-foreground">Current Value</p>
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
                    <p className="text-sm text-muted-foreground">Investments</p>
                    <p className="text-2xl font-bold">{companies.length}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${totalReturn >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    {totalReturn >= 0 ? (
                      <TrendingUp className={`h-6 w-6 ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    ) : (
                      <TrendingDown className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Return</p>
                    <p className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalReturn.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Gains Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6">
                <h3 className="font-semibold mb-2">Realized Gains</h3>
                <p className={`text-3xl font-bold ${realizedGains >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(realizedGains)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">From exited investments</p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-2">Unrealized Gains</h3>
                <p className={`text-3xl font-bold ${unrealizedGains >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(unrealizedGains)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">From active investments</p>
              </Card>
            </div>
          </>
        )}

        {/* Portfolio Companies */}
        {companies.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Portfolio Companies</h2>
            {companies.map((company) => {
              const roi = parseFloat(calculateROI(company));
              const gain = calculateGain(company);

              return (
                <Card key={company.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{company.companyName}</h3>
                        {getStatusBadge(company.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Investment</p>
                          <p className="font-semibold">{formatCurrency(company.investmentAmount)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Current Value</p>
                          <p className="font-semibold">
                            {formatCurrency(
                              company.status === 'exited' 
                                ? (company.exitValuation || 0)
                                : (company.currentValuation || company.investmentAmount)
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">ROI</p>
                          <p className={`font-semibold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {roi}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Gain/Loss</p>
                          <p className={`font-semibold ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(gain)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Invested: {formatDate(company.investmentDate)}</span>
                        <span>•</span>
                        <span>Ownership: {company.equityPercentage}%</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Briefcase className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No investments yet</h3>
            <p className="text-muted-foreground">
              Your portfolio performance will appear here once you make investments
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

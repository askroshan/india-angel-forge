import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Clock, Search, Users, Target, TrendingUp } from 'lucide-react';

interface InvestorProfile {
  focus_areas: string[];
  ticket_size_min: number;
  ticket_size_max: number;
  bio?: string;
  portfolio_count?: number;
}

interface Investor {
  id: string;
  email: string;
  full_name: string;
  investor_profile: InvestorProfile;
}

export default function InvestorDirectory() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [filteredInvestors, setFilteredInvestors] = useState<Investor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInvestors();
  }, []);

  useEffect(() => {
    filterInvestors();
  }, [searchQuery, investors]);

  const fetchInvestors = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Fetch investors with profiles
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          investor_profile:investor_profiles(
            focus_areas,
            ticket_size_min,
            ticket_size_max,
            bio,
            portfolio_count
          )
        `)
        .eq('role', 'investor')
        .order('full_name');

      if (error) {
        console.error('Error fetching investors:', error);
        return;
      }

      if (data) {
        // Filter out investors without profiles and flatten structure
        const investorsWithProfiles = data
          .filter(inv => inv.investor_profile)
          .map(inv => ({
            ...inv,
            investor_profile: Array.isArray(inv.investor_profile) 
              ? inv.investor_profile[0] 
              : inv.investor_profile
          })) as Investor[];
        
        setInvestors(investorsWithProfiles);
        setFilteredInvestors(investorsWithProfiles);
      }

    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterInvestors = () => {
    if (!searchQuery.trim()) {
      setFilteredInvestors(investors);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = investors.filter(investor => {
      const nameMatch = investor.full_name?.toLowerCase().includes(query);
      const emailMatch = investor.email.toLowerCase().includes(query);
      const focusMatch = investor.investor_profile.focus_areas?.some(
        area => area.toLowerCase().includes(query)
      );
      return nameMatch || emailMatch || focusMatch;
    });

    setFilteredInvestors(filtered);
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(amount / 100000).toFixed(2)} L`;
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
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Users className="h-8 w-8" />
            Investor Directory
          </h1>
          <p className="text-muted-foreground">
            Browse and connect with investors who match your startup's focus
          </p>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search investors by name, focus area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Statistics */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{investors.length}</p>
                <p className="text-sm text-muted-foreground">Total Investors</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{filteredInvestors.length}</p>
                <p className="text-sm text-muted-foreground">Showing Results</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {investors.reduce((sum, inv) => sum + (inv.investor_profile.portfolio_count || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Investments</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Investor List */}
        {filteredInvestors.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No investors match your search' : 'No investors available'}
            </p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInvestors.map((investor) => (
              <Card key={investor.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  {/* Investor Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      {investor.full_name || investor.email}
                    </h3>
                    <p className="text-sm text-muted-foreground">{investor.email}</p>
                  </div>

                  {/* Bio */}
                  {investor.investor_profile.bio && (
                    <p className="text-sm line-clamp-2">{investor.investor_profile.bio}</p>
                  )}

                  {/* Focus Areas */}
                  {investor.investor_profile.focus_areas && investor.investor_profile.focus_areas.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">FOCUS AREAS</p>
                      <div className="flex flex-wrap gap-2">
                        {investor.investor_profile.focus_areas.map((area, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ticket Size */}
                  <div className="pt-3 border-t">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">TICKET SIZE</p>
                    <p className="text-sm font-semibold">
                      {formatCurrency(investor.investor_profile.ticket_size_min)} - {formatCurrency(investor.investor_profile.ticket_size_max)}
                    </p>
                  </div>

                  {/* Portfolio Count */}
                  {investor.investor_profile.portfolio_count !== undefined && investor.investor_profile.portfolio_count > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span>{investor.investor_profile.portfolio_count} investments</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

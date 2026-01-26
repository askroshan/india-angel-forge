import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Clock, Search, Users, Target, TrendingUp } from 'lucide-react';

interface Investor {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

export default function InvestorDirectory() {
  const navigate = useNavigate();
  const { token } = useAuth();
  
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
      if (!token) {
        navigate('/auth');
        return;
      }

      // Fetch investors
      const response = await fetch('/api/admin/investors', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error('Error fetching investors');
        return;
      }

      const data = await response.json();
      setInvestors(data || []);
      setFilteredInvestors(data || []);

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
                  {filteredInvestors.length}
                </p>
                <p className="text-sm text-muted-foreground">Active Investors</p>
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
                      {investor.fullName || investor.email}
                    </h3>
                    <p className="text-sm text-muted-foreground">{investor.email}</p>
                  </div>

                  {/* Member Since */}
                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Member since {new Date(investor.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

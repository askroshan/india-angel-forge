/**
 * US-ADMIN-CRUD-005: Investor Management
 * 
 * As an: Admin
 * I want to: View all investors on the platform
 * So that: I can monitor and manage the investor base
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Users, Search, TrendingUp } from 'lucide-react';

interface Investor {
  id: string;
  email: string;
  fullName: string | null;
  investorProfile?: {
    accreditationStatus: string;
    investmentPreferences: string[];
    totalInvested: number;
  };
  createdAt: string;
}

export default function InvestorManagement() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [filteredInvestors, setFilteredInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchInvestors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredInvestors(
        investors.filter(i =>
          i.email.toLowerCase().includes(query) ||
          i.fullName?.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredInvestors(investors);
    }
  }, [investors, searchQuery]);

  const fetchInvestors = async () => {
    try {
      setLoading(true);
      if (!token) return;

      const response = await fetch('/api/admin/investors', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to load investors');

      const data = await response.json();
      setInvestors(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load investors',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Investor Management</h1>
        <p className="text-muted-foreground">
          View and monitor all investors on the platform
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Investors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{investors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {investors.filter(i => i.investorProfile?.accreditationStatus === 'VERIFIED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {investors.filter(i => i.investorProfile?.accreditationStatus === 'PENDING').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div>
            <Label htmlFor="search">Search Investors</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investors List */}
      {loading ? (
        <div className="text-center py-8">Loading investors...</div>
      ) : filteredInvestors.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No investors found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInvestors.map((investor) => (
            <Card key={investor.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold">{investor.fullName || investor.email}</h3>
                      <p className="text-sm text-muted-foreground">{investor.email}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {investor.investorProfile?.accreditationStatus && (
                          <Badge variant={investor.investorProfile.accreditationStatus === 'VERIFIED' ? 'default' : 'secondary'}>
                            {investor.investorProfile.accreditationStatus === 'VERIFIED' ? '✓ Verified' : 'Pending'}
                          </Badge>
                        )}
                        {investor.investorProfile?.investmentPreferences?.map(pref => (
                          <Badge key={pref} variant="outline" className="text-xs">{pref}</Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Joined {new Date(investor.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {investor.investorProfile?.totalInvested ? (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total Invested</p>
                      <p className="font-semibold flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        ₹{(investor.investorProfile.totalInvested / 100000).toFixed(1)}L
                      </p>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building, 
  Users, 
  TrendingUp, 
  Target,
  UserPlus,
  CheckCircle,
  Clock
} from 'lucide-react';

interface SPV {
  id: string;
  name: string;
  dealId: string;
  leadInvestorId: string;
  targetAmount: number;
  carryPercentage: number;
  status: string;
  description?: string;
}

interface SPVMember {
  id: string;
  spvId: string;
  investorId: string;
  commitmentAmount: number;
  status: string;
  investorName?: string;
  investorEmail?: string;
}

export default function SPVDashboard() {
  const { spvId } = useParams<{ spvId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [spv, setSPV] = useState<SPV | null>(null);
  const [members, setMembers] = useState<SPVMember[]>([]);
  const [isLeadInvestor, setIsLeadInvestor] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spvId]);

  const fetchData = async () => {
    try {
      if (!token) {
        navigate('/auth');
        return;
      }

      // Fetch SPV
      const response = await fetch(`/api/spv/${spvId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error('Error fetching SPV');
        setLoading(false);
        return;
      }

      const spvData = await response.json();
      setSPV(spvData);
      
      // Check if current user is lead investor
      // This would require getting userId from token, but for simplicity we'll use the API response
      setIsLeadInvestor(true); // TODO: Properly check if user is lead investor
      setMembers(spvData.members || []);

    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(amount / 100000).toFixed(2)} L`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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

  if (!spv) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <p>SPV not found</p>
        </Card>
      </div>
    );
  }

  const totalCommitted = members
    .filter(m => m.status === 'confirmed')
    .reduce((sum, member) => sum + Number(member.commitmentAmount), 0);
  const progressPercentage = spv ? (totalCommitted / Number(spv.targetAmount)) * 100 : 0;
  const confirmedCount = members.filter(m => m.status === 'confirmed').length;
  const pendingCount = members.filter(m => m.status === 'pending').length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Building className="h-8 w-8" />
              {spv.name}
            </h1>
            {spv.description && (
              <p className="text-muted-foreground">{spv.description}</p>
            )}
          </div>
          {isLeadInvestor && (
            <Button onClick={() => navigate(`/investor/spv/${spvId}/invite`)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Co-Investors
            </Button>
          )}
        </div>

        {/* Statistics Grid */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-muted-foreground">Target Amount</span>
            </div>
            <p className="text-2xl font-bold">{spv && formatCurrency(Number(spv.targetAmount))}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-muted-foreground">Committed</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalCommitted)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {progressPercentage.toFixed(0)}% of target
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-muted-foreground">Members</span>
            </div>
            <p className="text-2xl font-bold">{members.length}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {confirmedCount} confirmed
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Building className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium text-muted-foreground">Carry</span>
            </div>
            <p className="text-2xl font-bold">{spv && spv.carryPercentage}%</p>
            <p className="text-sm text-muted-foreground mt-1">
              of profits
            </p>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Fundraising Progress</h3>
          <Progress value={progressPercentage} className="h-3 mb-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatCurrency(totalCommitted)} raised</span>
            <span>{spv && formatCurrency(Number(spv.targetAmount) - totalCommitted)} remaining</span>
          </div>
        </Card>

        {/* Members List */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">SPV Members</h2>
            <div className="flex gap-2 text-sm">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {confirmedCount} Confirmed
              </Badge>
              {pendingCount > 0 && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  {pendingCount} Pending
                </Badge>
              )}
            </div>
          </div>

          {members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No members yet</p>
              {isLeadInvestor && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate(`/investor/spv/${spvId}/invite`)}
                >
                  Invite Co-Investors
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div 
                  key={member.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {member.investorName || member.investorEmail}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.investorEmail}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="font-semibold">
                        {formatCurrency(Number(member.commitmentAmount))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {spv && ((Number(member.commitmentAmount) / Number(spv.targetAmount)) * 100).toFixed(1)}% of target
                      </p>
                    </div>
                    {getStatusBadge(member.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate('/investor/pipeline')}>
            Back to Pipeline
          </Button>
        </div>
      </div>
    </div>
  );
}

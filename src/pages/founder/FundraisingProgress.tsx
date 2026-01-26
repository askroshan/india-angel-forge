import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  Plus,
  TrendingUp,
  Target,
  DollarSign,
  Calendar,
} from 'lucide-react';

interface FundraisingRound {
  id: string;
  roundName: string;
  targetAmount: number;
  raisedAmount: number;
  status: string;
  startDate?: string;
  targetCloseDate?: string;
}

export default function FundraisingProgress() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rounds, setRounds] = useState<FundraisingRound[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [newRound, setNewRound] = useState({
    roundName: '',
    targetAmount: '',
    raisedAmount: '0',
    status: 'planning',
    targetCloseDate: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (!token) {
        navigate('/auth');
        return;
      }

      // Get fundraising rounds
      const response = await fetch('/api/company/fundraising-rounds', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/auth');
        } else if (response.status === 404) {
          // No company profile yet
          setLoading(false);
          return;
        }
        return;
      }

      const roundsData = await response.json();
      setRounds(roundsData || []);

      setRounds(roundsData || []);
      const roundsData = await response.json();
      setRounds(roundsData || []);

    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRound = async () => {
    if (!newRound.roundName || !newRound.targetAmount) {
      alert('Please fill in round name and target amount');
      return;
    }

    try {
      setSaving(true);

      if (!token) {
        navigate('/auth');
        return;
      }

      const response = await fetch('/api/company/fundraising-rounds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          roundName: newRound.roundName,
          targetAmount: parseFloat(newRound.targetAmount),
          raisedAmount: parseFloat(newRound.raisedAmount || '0'),
          status: newRound.status,
          targetCloseDate: newRound.targetCloseDate || null,
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          alert('Please create a company profile first');
        } else {
          alert('Failed to create round');
        }
        return;
      }

      const data = await response.json();
      setRounds([data, ...rounds]);
      setShowAddDialog(false);
      setNewRound({
        roundName: '',
        targetAmount: '',
        raisedAmount: '0',
        status: 'planning',
        targetCloseDate: '',
      });

    } catch (err) {
      console.error('Error:', err);
      alert('Failed to create round');
    } finally {
      setSaving(false);
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

  const getProgress = (raised: number, target: number): number => {
    if (target === 0) return 0;
    return Math.min((raised / target) * 100, 100);
  };

  const getStatusBadgeColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (!companyId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <TrendingUp className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Create Company Profile First</h2>
          <p className="text-muted-foreground mb-6">
            You need to create a company profile before tracking fundraising progress
          </p>
          <Button onClick={() => navigate('/founder/company-profile')}>
            Create Company Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Fundraising Progress</h1>
            <p className="text-muted-foreground">
              Track your fundraising rounds and progress
            </p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Round
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Fundraising Round</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="roundName">Round Name *</Label>
                  <Input
                    id="roundName"
                    value={newRound.roundName}
                    onChange={(e) => setNewRound({ ...newRound, roundName: e.target.value })}
                    placeholder="Seed Round"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAmount">Target Amount (₹) *</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    value={newRound.targetAmount}
                    onChange={(e) => setNewRound({ ...newRound, targetAmount: e.target.value })}
                    placeholder="1000000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="raisedAmount">Raised Amount (₹)</Label>
                  <Input
                    id="raisedAmount"
                    type="number"
                    value={newRound.raisedAmount}
                    onChange={(e) => setNewRound({ ...newRound, raisedAmount: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newRound.status}
                    onValueChange={(value) => setNewRound({ ...newRound, status: value })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_close_date">Target Close Date</Label>
                  <Input
                    id="target_close_date"
                    type="date"
                    value={newRound.target_close_date}
                    onChange={(e) => setNewRound({ ...newRound, target_close_date: e.target.value })}
                  />
                </div>

                <Button onClick={handleAddRound} disabled={saving} className="w-full">
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Empty State */}
        {rounds.length === 0 && (
          <Card className="p-12 text-center">
            <TrendingUp className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Fundraising Rounds Yet</h2>
            <p className="text-muted-foreground mb-6">
              Start tracking your fundraising progress by adding your first round
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Round
            </Button>
          </Card>
        )}

        {/* Rounds List */}
        {rounds.length > 0 && (
          <div className="space-y-4">
            {rounds.map((round) => {
              const progress = getProgress(round.raisedAmount, round.targetAmount);
              return (
                <Card key={round.id} className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{round.roundName}</h3>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(round.status)}`}>
                          {round.status.charAt(0).toUpperCase() + round.status.slice(1)}
                        </span>
                      </div>
                      {round.targetCloseDate && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Target: {new Date(round.targetCloseDate).toLocaleDateString('en-IN')}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          Raised
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatAmount(round.raisedAmount)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Target className="h-4 w-4" />
                          Target
                        </div>
                        <div className="text-2xl font-bold">
                          {formatAmount(round.targetAmount)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

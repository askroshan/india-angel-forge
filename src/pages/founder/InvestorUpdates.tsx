import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Clock,
  Mail
} from 'lucide-react';

interface InvestorUpdate {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  investorName: string;
  investorEmail: string;
}

export default function InvestorUpdates() {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState<InvestorUpdate[]>([]);

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    try {
      if (!token) {
        navigate('/auth');
        return;
      }

      // Fetch updates (companyId is resolved on backend via founder's portfolio company)
      const response = await fetch('/api/portfolio/updates', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        navigate('/auth');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setUpdates(data);
      }

    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
          <h1 className="text-3xl font-bold mb-2">Investor Updates</h1>
          <p className="text-muted-foreground">
            Messages and updates from your investors
          </p>
        </div>

        {/* Updates List */}
        {updates.length > 0 ? (
          <div className="space-y-4">
            {updates.map((update) => (
              <Card key={update.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {getInitials(update.investorName || update.investorEmail)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">
                          {update.investorName || update.investorEmail}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {update.investorEmail}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatDate(update.createdAt)}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">{update.title}</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {update.content}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Mail className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No updates yet</h3>
            <p className="text-muted-foreground">
              You'll see updates from your investors here
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

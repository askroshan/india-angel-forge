import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
  created_at: string;
  investor: {
    full_name: string;
    email: string;
  };
}

export default function InvestorUpdates() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState<InvestorUpdate[]>([]);

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // First, get the company_id for this founder
      const { data: companyData } = await supabase
        .from('portfolio_companies')
        .select('id')
        .eq('founder_id', session.user.id)
        .single();

      if (!companyData) {
        setLoading(false);
        return;
      }

      // Fetch updates for this company
      const { data, error } = await supabase
        .from('portfolio_updates')
        .select(`
          *,
          investor:investor_id(full_name, email)
        `)
        .eq('company_id', companyData.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching updates:', error);
        return;
      }

      if (data) {
        setUpdates(data as any);
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
                        {getInitials(update.investor.full_name || update.investor.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">
                          {update.investor.full_name || update.investor.email}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {update.investor.email}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatDate(update.created_at)}
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

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Send, 
  Clock,
  Building,
  Plus
} from 'lucide-react';

interface PortfolioCompany {
  id: string;
  company_name: string;
}

interface PortfolioUpdate {
  id: string;
  title: string;
  content: string;
  created_at: string;
  company: {
    company_name: string;
  };
}

export default function PortfolioUpdates() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<PortfolioCompany[]>([]);
  const [updates, setUpdates] = useState<PortfolioUpdate[]>([]);
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [sending, setSending] = useState(false);
  
  const [updateData, setUpdateData] = useState({
    company_id: '',
    title: '',
    content: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Fetch portfolio companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('portfolio_companies')
        .select('id, company_name')
        .eq('investor_id', session.user.id);

      if (companiesError) {
        console.error('Error fetching companies:', companiesError);
      } else if (companiesData) {
        setCompanies(companiesData);
      }

      // Fetch sent updates
      const { data: updatesData, error: updatesError } = await supabase
        .from('portfolio_updates')
        .select(`
          *,
          company:company_id(company_name)
        `)
        .eq('investor_id', session.user.id)
        .order('created_at', { ascending: false });

      if (updatesError) {
        console.error('Error fetching updates:', updatesError);
      } else if (updatesData) {
        setUpdates(updatesData as any);
      }

    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendUpdate = async () => {
    if (!updateData.company_id || !updateData.title || !updateData.content) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setSending(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('portfolio_updates')
        .insert({
          investor_id: session.user.id,
          company_id: updateData.company_id,
          title: updateData.title,
          content: updateData.content,
        });

      if (error) {
        console.error('Error sending update:', error);
        alert('Failed to send update');
        return;
      }

      setShowComposeDialog(false);
      setUpdateData({
        company_id: '',
        title: '',
        content: '',
      });
      fetchData();

    } catch (err) {
      console.error('Error:', err);
      alert('Failed to send update');
    } finally {
      setSending(false);
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
            <h1 className="text-3xl font-bold mb-2">Portfolio Updates</h1>
            <p className="text-muted-foreground">
              Send updates to your portfolio companies
            </p>
          </div>
          
          {companies.length > 0 && (
            <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Compose Update
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Send Portfolio Update</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Select
                      value={updateData.company_id}
                      onValueChange={(value) => setUpdateData({ ...updateData, company_id: value })}
                    >
                      <SelectTrigger id="company">
                        <SelectValue placeholder="Select a company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={updateData.title}
                      onChange={(e) => setUpdateData({ ...updateData, title: e.target.value })}
                      placeholder="Q1 2024 Performance Update"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Message</Label>
                    <Textarea
                      id="content"
                      value={updateData.content}
                      onChange={(e) => setUpdateData({ ...updateData, content: e.target.value })}
                      placeholder="Share your update with the portfolio company..."
                      rows={8}
                    />
                  </div>
                  <Button 
                    onClick={handleSendUpdate} 
                    className="w-full"
                    disabled={sending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sending ? 'Sending...' : 'Send Update'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Updates List */}
        {updates.length > 0 ? (
          <div className="space-y-4">
            {updates.map((update) => (
              <Card key={update.id} className="p-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {update.company.company_name}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{update.title}</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {update.content}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatDate(update.created_at)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Send className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No updates sent yet</h3>
            <p className="text-muted-foreground mb-6">
              {companies.length > 0
                ? 'Send updates to keep your portfolio companies informed'
                : 'You need portfolio companies to send updates'}
            </p>
            {companies.length > 0 && (
              <Button onClick={() => setShowComposeDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Compose Your First Update
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

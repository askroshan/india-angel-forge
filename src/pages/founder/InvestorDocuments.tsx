import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  FileText, 
  Download,
  Clock,
  User
} from 'lucide-react';

interface InvestorDocument {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  shared_at: string;
  file_path: string;
  investor: {
    full_name: string;
    email: string;
  };
}

export default function InvestorDocuments() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<InvestorDocument[]>([]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
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

      // Fetch documents shared with this company
      const { data, error } = await supabase
        .from('shared_documents')
        .select(`
          *,
          investor:investor_id(full_name, email)
        `)
        .eq('company_id', companyData.id)
        .order('shared_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        return;
      }

      if (data) {
        setDocuments(data as any);
      }

    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: InvestorDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('shared-documents')
        .download(doc.file_path);

      if (error) {
        console.error('Download error:', error);
        alert('Failed to download file');
        return;
      }

      // Create download link
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      console.error('Error:', err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
          <h1 className="text-3xl font-bold mb-2">Investor Documents</h1>
          <p className="text-muted-foreground">
            Documents shared by your investors
          </p>
        </div>

        {/* Documents List */}
        {documents.length > 0 ? (
          <div className="space-y-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{doc.file_name}</h3>
                      
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                            {getInitials(doc.investor.full_name || doc.investor.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-sm">
                          <p className="font-medium">
                            {doc.investor.full_name || doc.investor.email}
                          </p>
                          <p className="text-muted-foreground">
                            {doc.investor.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>•</span>
                        <span>Shared {formatDate(doc.shared_at)}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
            <p className="text-muted-foreground">
              Your investors will share documents with you here
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Upload as UploadIcon,
  Clock,
  Building,
  Share2
} from 'lucide-react';

interface PortfolioCompany {
  id: string;
  company_name: string;
}

interface SharedDocument {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  shared_at: string;
  company: {
    company_name: string;
  };
}

export default function SharedDocuments() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<PortfolioCompany[]>([]);
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

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

      // Fetch shared documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('shared_documents')
        .select(`
          *,
          company:company_id(company_name)
        `)
        .eq('investor_id', session.user.id)
        .order('shared_at', { ascending: false });

      if (documentsError) {
        console.error('Error fetching documents:', documentsError);
      } else if (documentsData) {
        setDocuments(documentsData as any);
      }

    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleShare = async () => {
    if (!selectedFile || !selectedCompanyId) {
      alert('Please select both a file and a company');
      return;
    }

    try {
      setUploading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Upload to storage
      const filePath = `${session.user.id}/${Date.now()}-${selectedFile.name}`;
      const { error: storageError } = await supabase.storage
        .from('shared-documents')
        .upload(filePath, selectedFile);

      if (storageError) {
        console.error('Storage error:', storageError);
        alert('Failed to upload file');
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('shared-documents')
        .getPublicUrl(filePath);

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('shared_documents')
        .insert({
          investor_id: session.user.id,
          company_id: selectedCompanyId,
          file_name: selectedFile.name,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          file_path: filePath,
        });

      if (dbError) {
        console.error('Database error:', dbError);
        alert('Failed to save document metadata');
        return;
      }

      setShowShareDialog(false);
      setSelectedFile(null);
      setSelectedCompanyId('');
      fetchData();

    } catch (err) {
      console.error('Error:', err);
      alert('Failed to share document');
    } finally {
      setUploading(false);
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
            <h1 className="text-3xl font-bold mb-2">Shared Documents</h1>
            <p className="text-muted-foreground">
              Share documents with your portfolio companies
            </p>
          </div>
          
          {companies.length > 0 && (
            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Document with Company</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Select
                      value={selectedCompanyId}
                      onValueChange={setSelectedCompanyId}
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
                    <Label htmlFor="file">Document</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </p>
                    )}
                  </div>
                  <Button 
                    onClick={handleShare} 
                    className="w-full"
                    disabled={!selectedFile || !selectedCompanyId || uploading}
                  >
                    <UploadIcon className="h-4 w-4 mr-2" />
                    {uploading ? 'Sharing...' : 'Share Document'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Documents List */}
        {documents.length > 0 ? (
          <div className="space-y-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{doc.file_name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {doc.company.company_name}
                        </div>
                        <span>•</span>
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>•</span>
                        <span>Shared {formatDate(doc.shared_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No documents shared yet</h3>
            <p className="text-muted-foreground mb-6">
              {companies.length > 0
                ? 'Share documents with your portfolio companies'
                : 'You need portfolio companies to share documents'}
            </p>
            {companies.length > 0 && (
              <Button onClick={() => setShowShareDialog(true)}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Your First Document
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

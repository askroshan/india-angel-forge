import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  companyName: string;
}

interface SharedDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  sharedAt: string;
  companyName: string;
}

export default function SharedDocuments() {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<PortfolioCompany[]>([]);
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      if (!token) {
        navigate('/auth');
        return;
      }

      // Fetch portfolio companies
      const companiesRes = await fetch('/api/portfolio/companies', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (companiesRes.status === 401) {
        navigate('/auth');
        return;
      }

      if (companiesRes.ok) {
        const companiesData = await companiesRes.json();
        setCompanies(companiesData);
      }

      // Fetch shared documents
      const documentsRes = await fetch('/api/documents?sharedWith=company', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (documentsRes.ok) {
        const documentsData = await documentsRes.json();
        setDocuments(documentsData);
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

      if (!token) {
        navigate('/auth');
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('sharedWithId', selectedCompanyId);
      formData.append('sharedWithType', 'company');

      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        navigate('/auth');
        return;
      }

      if (!response.ok) {
        alert('Failed to share document');
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
                            {company.companyName}
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
                      <h3 className="font-semibold mb-1">{doc.fileName}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {doc.companyName}
                        </div>
                        <span>•</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>Shared {formatDate(doc.sharedAt)}</span>
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

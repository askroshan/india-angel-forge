/**
 * US-INVESTOR-006: View Deal Documents
 * 
 * Secure document viewer for deal due diligence materials.
 * Only accessible to investors who have expressed interest in the deal.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Download, 
  Lock,
  AlertCircle,
  Calendar,
  FileIcon
} from 'lucide-react';

interface DealDocument {
  id: string;
  dealId: string;
  title: string;
  description?: string;
  filePath: string;
  fileType: string;
  uploadedBy: string;
  createdAt: string;
  // Additional fields used in the component
  file_name?: string;
  file_path?: string;
  document_type?: string;
  file_size?: number;
  uploaded_at?: string;
}

const DealDocuments = () => {
  const { dealId } = useParams<{ dealId: string }>();
  const [documents, setDocuments] = useState<DealDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [dealTitle, setDealTitle] = useState('');
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token, user } = useAuth();

  useEffect(() => {
    checkAccessAndLoadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

  const checkAccessAndLoadDocuments = async () => {
    if (!token || !user) {
      navigate('/auth');
      return;
    }

    if (!dealId) {
      toast({
        title: 'Error',
        description: 'Deal ID is required',
        variant: 'destructive',
      });
      navigate('/deals');
      return;
    }

    await checkInterest(user.id);
  };

  const checkInterest = async (userId: string) => {
    try {
      // Check if user has expressed interest in this deal
      const interest = await apiClient.get<{ id: string; deal: { title: string } }>(
        `/api/deals/${dealId}/interest`
      );

      if (!interest) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      setHasAccess(true);
      setDealTitle(interest.deal?.title || '');
      await fetchDocuments();
    } catch (err) {
      setHasAccess(false);
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<DealDocument[]>(`/api/deals/${dealId}/documents`);

      setDocuments(data || []);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (doc: DealDocument) => {
    try {
      const data = await apiClient.get<{ signedUrl: string }>(
        `/api/documents/${doc.id}/download`
      );

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
        toast({
          title: 'Download Started',
          description: 'Opening document in new tab',
        });
      }
    } catch (err) {
      const error = err as { message?: string };
      toast({
        title: 'Download Failed',
        description: error.message || 'Failed to download document',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocumentTypeBadge = (type: string) => {
    const types: Record<string, { label: string; className: string }> = {
      pitch_deck: { label: 'Pitch Deck', className: 'bg-blue-100 text-blue-800' },
      financials: { label: 'Financials', className: 'bg-green-100 text-green-800' },
      legal: { label: 'Legal', className: 'bg-purple-100 text-purple-800' },
      due_diligence: { label: 'Due Diligence', className: 'bg-amber-100 text-amber-800' },
      other: { label: 'Other', className: 'bg-gray-100 text-gray-800' },
    };

    const config = types[type] || types.other;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getDocumentIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="h-8 w-8 text-red-500" />;
    if (['doc', 'docx'].includes(ext || '')) return <FileText className="h-8 w-8 text-blue-500" />;
    if (['xls', 'xlsx'].includes(ext || '')) return <FileText className="h-8 w-8 text-green-500" />;
    return <FileIcon className="h-8 w-8 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p>Loading documents...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-12 text-center">
            <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-6">
              You need to express interest in this deal to view documents
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/deals')}>
                Browse Deals
              </Button>
              <Button onClick={() => navigate(`/deals/${dealId}`)}>
                View Deal & Express Interest
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate(`/deals/${dealId}`)} className="mb-4">
          ← Back to Deal
        </Button>
        <h1 className="text-3xl font-bold mb-2">Deal Documents</h1>
        <p className="text-muted-foreground">
          {dealTitle || 'Due diligence materials and legal documents'}
        </p>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Documents Available</h3>
            <p className="text-muted-foreground">
              Documents will be uploaded by the deal lead soon
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getDocumentIcon(doc.file_name)}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-2 truncate">
                        {doc.file_name}
                      </CardTitle>
                      {getDocumentTypeBadge(doc.document_type)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <FileIcon className="h-4 w-4" />
                    <span>Size: {formatFileSize(doc.file_size)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button 
                  onClick={() => downloadDocument(doc)} 
                  className="w-full"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {documents.length > 0 && (
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-1">Confidential Information</h4>
                <p className="text-sm text-blue-800">
                  These documents contain confidential and proprietary information. 
                  Do not share, distribute, or reproduce without written permission from the deal lead.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DealDocuments;

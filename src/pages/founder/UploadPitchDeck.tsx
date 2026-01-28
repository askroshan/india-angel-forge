import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, Eye, Clock, Calendar, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';

/**
 * Document type definition
 */
type DocumentType = 'pitch_deck' | 'financial_model' | 'demo_video' | 'cap_table';

/**
 * Deal document structure from API
 */
interface DealDocument {
  id: string;
  deal_id: string;
  document_type: DocumentType;
  file_name: string;
  file_url: string;
  file_size: number;
  uploaded_at: string;
  view_count: number;
  last_viewed_at?: string;
}

/**
 * Document viewer information
 */
interface DocumentViewer {
  investor_id: string;
  investor_name: string;
  document_id: string;
  viewed_at: string;
  view_duration: number;
}

/**
 * Document type configurations
 */
const DOCUMENT_TYPES: Record<DocumentType, { label: string; accept: string; description: string }> = {
  pitch_deck: {
    label: 'Pitch Deck',
    accept: '.pdf,.ppt,.pptx',
    description: 'Your company presentation (PDF or PowerPoint)',
  },
  financial_model: {
    label: 'Financial Model',
    accept: '.xlsx,.xls,.csv',
    description: 'Revenue projections and financial forecasts',
  },
  demo_video: {
    label: 'Demo Video',
    accept: '.mp4,.mov,.avi',
    description: 'Product demo or company overview video',
  },
  cap_table: {
    label: 'Cap Table',
    accept: '.xlsx,.xls,.pdf',
    description: 'Current capitalization table',
  },
};

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format duration in minutes
 */
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

/**
 * UploadPitchDeck component - allows founders to upload and manage deal documents
 */
export default function UploadPitchDeck() {
  const queryClient = useQueryClient();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isViewersDialogOpen, setIsViewersDialogOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DealDocument | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isReplace, setIsReplace] = useState(false);

  // Fetch documents
  const { data: documents = [], isLoading, error } = useQuery<DealDocument[]>({
    queryKey: ['deal-documents'],
    queryFn: async () => {
      const response = await apiClient.get<DealDocument[]>('/api/deal-documents');
      return response;
    },
  });

  // Fetch document viewers
  const { data: viewers = [] } = useQuery<DocumentViewer[]>({
    queryKey: ['document-views', selectedDocument?.id],
    queryFn: async () => {
      if (!selectedDocument) return [];
      const response = await apiClient.get<DocumentViewer[]>(`/api/document-views/${selectedDocument.id}`);
      return response;
    },
    enabled: !!selectedDocument && isViewersDialogOpen,
  });

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: { file: File; documentType: DocumentType }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('document_type', data.documentType);
      
      const response = await apiClient.post<DealDocument>('/api/deal-documents', formData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Document uploaded successfully');
      toast.success('Investors can now access this document');
      queryClient.invalidateQueries({ queryKey: ['deal-documents'] });
      handleCloseUploadDialog();
    },
    onError: () => {
      toast.error('Failed to upload document');
    },
  });

  // Replace document mutation
  const replaceMutation = useMutation({
    mutationFn: async (data: { documentId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      
      const response = await apiClient.put<DealDocument>(`/api/deal-documents/${data.documentId}`, formData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Document replaced successfully');
      queryClient.invalidateQueries({ queryKey: ['deal-documents'] });
      handleCloseUploadDialog();
    },
    onError: () => {
      toast.error('Failed to replace document');
    },
  });

  const handleOpenUploadDialog = (docType: DocumentType) => {
    setSelectedDocType(docType);
    setIsReplace(false);
    setSelectedFile(null);
    setIsUploadDialogOpen(true);
  };

  const handleOpenReplaceDialog = (document: DealDocument) => {
    setSelectedDocument(document);
    setSelectedDocType(document.document_type);
    setIsReplace(true);
    setSelectedFile(null);
    setIsUploadDialogOpen(true);
  };

  const handleCloseUploadDialog = () => {
    setIsUploadDialogOpen(false);
    setSelectedDocType(null);
    setSelectedDocument(null);
    setSelectedFile(null);
    setIsReplace(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !selectedDocType) return;

    if (isReplace && selectedDocument) {
      replaceMutation.mutate({
        documentId: selectedDocument.id,
        file: selectedFile,
      });
    } else {
      uploadMutation.mutate({
        file: selectedFile,
        documentType: selectedDocType,
      });
    }
  };

  const handleViewDetails = (document: DealDocument) => {
    setSelectedDocument(document);
    setIsViewersDialogOpen(true);
  };

  const getDocumentByType = (type: DocumentType) => {
    return documents.find(doc => doc.document_type === type);
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-red-500">Error loading documents</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload Pitch Materials</h1>
        <p className="text-muted-foreground">
          Upload and manage documents for your deal room
        </p>
      </div>

      {/* Upload Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {(Object.entries(DOCUMENT_TYPES) as [DocumentType, typeof DOCUMENT_TYPES[DocumentType]][]).map(
          ([type, config]) => {
            const existingDoc = getDocumentByType(type);

            return (
              <Card key={type}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {config.label}
                      </CardTitle>
                      <CardDescription>{config.description}</CardDescription>
                    </div>
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {existingDoc ? (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-green-900 mb-1">
                          {existingDoc.file_name}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-green-700">
                          <span>{formatFileSize(existingDoc.file_size)}</span>
                          <span>•</span>
                          <span>{formatDate(existingDoc.uploaded_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-green-700">
                          <Eye className="h-3 w-3" />
                          <span>{existingDoc.view_count} views</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(existingDoc)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenReplaceDialog(existingDoc)}
                          className="flex-1"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Replace
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button
                      onClick={() => handleOpenUploadDialog(type)}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload {config.label}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          }
        )}
      </div>

      {/* Uploaded Documents List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p>Loading documents...</p>
        </div>
      ) : documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Documents</CardTitle>
            <CardDescription>Complete list of uploaded documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{doc.file_name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <Badge variant="secondary">
                          {DOCUMENT_TYPES[doc.document_type].label}
                        </Badge>
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(doc.uploaded_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {doc.view_count} views
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(doc)}
                  >
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload/Replace Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isReplace ? 'Replace Document' : 'Upload Document'}
            </DialogTitle>
            <DialogDescription>
              {isReplace 
                ? 'Select a new file to replace the existing document'
                : selectedDocType && DOCUMENT_TYPES[selectedDocType].description
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isReplace && selectedDocument && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> This will replace the existing document
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Current file: {selectedDocument.file_name}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="file-upload">
                Select File
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept={selectedDocType ? DOCUMENT_TYPES[selectedDocType].accept : '*'}
                onChange={handleFileChange}
                aria-label="Select File"
              />
              {selectedDocType && (
                <p className="text-xs text-muted-foreground">
                  Accepted formats: {DOCUMENT_TYPES[selectedDocType].accept}
                </p>
              )}
            </div>

            {selectedFile && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Selected:</strong> {selectedFile.name}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Size: {formatFileSize(selectedFile.size)}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseUploadDialog}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploadMutation.isPending || replaceMutation.isPending}
                className="flex-1"
              >
                {uploadMutation.isPending || replaceMutation.isPending ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Viewers Dialog */}
      <Dialog open={isViewersDialogOpen} onOpenChange={setIsViewersDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Document Views</DialogTitle>
            <DialogDescription>
              {selectedDocument?.file_name} - {selectedDocument?.view_count} total views
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {viewers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No one has viewed this document yet
              </p>
            ) : (
              viewers.map((viewer, index) => (
                <div
                  key={`${viewer.investor_id}-${index}`}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{viewer.investor_name}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(viewer.viewed_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(viewer.view_duration)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

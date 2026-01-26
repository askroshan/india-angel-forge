/**
 * Investor KYC Document Upload Page
 * 
 * Allows investors to:
 * - Upload required KYC documents (PAN, Aadhaar, Bank Statement, Income Proof)
 * - View upload status for each document
 * - Reupload rejected documents
 * - Track verification progress
 * 
 * Part of US-INVESTOR-002
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface KYCDocument {
  id: string;
  document_type: 'pan' | 'aadhaar' | 'bank_statement' | 'income_proof';
  file_path: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  uploaded_at: string;
  verified_at?: string;
  rejection_reason?: string;
}

interface DocumentRequirement {
  type: 'pan' | 'aadhaar' | 'bank_statement' | 'income_proof';
  label: string;
  description: string;
  required: boolean;
}

const DOCUMENT_REQUIREMENTS: DocumentRequirement[] = [
  {
    type: 'pan',
    label: 'PAN Card',
    description: 'Clear copy of PAN card (front side)',
    required: true,
  },
  {
    type: 'aadhaar',
    label: 'Aadhaar Card',
    description: 'Masked Aadhaar card (both sides)',
    required: true,
  },
  {
    type: 'bank_statement',
    label: 'Bank Statement',
    description: 'Last 6 months bank statement',
    required: true,
  },
  {
    type: 'income_proof',
    label: 'Income Proof',
    description: 'ITR/Salary slips/Form 16 for last 2 years',
    required: true,
  },
];

export default function KYCUpload() {
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [investorId, setInvestorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndLoadDocuments();
  }, []);

  const checkAuthAndLoadDocuments = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    try {
      // Get investor application ID
      const { data: application, error: appError } = await supabase
        .from('investor_applications')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (appError || !application) {
        toast({
          title: 'Error',
          description: 'No investor application found. Please apply first.',
          variant: 'destructive',
        });
        navigate('/apply/investor');
        return;
      }

      setInvestorId(application.id);

      // Load existing documents
      const { data: docs, error: docsError } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('investor_id', application.id);

      if (docsError) throw docsError;

      setDocuments(docs || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (docType: string, file: File) => {
    if (!investorId) return;

    try {
      setUploading(docType);
      setUploadProgress(0);

      // Validate file
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size must be less than 10MB');
      }

      if (!file.type.includes('pdf') && !file.type.includes('image')) {
        throw new Error('Only PDF and image files are allowed');
      }

      // Upload to storage
      const fileName = `${investorId}/${docType}_${Date.now()}.${file.name.split('.').pop()}`;
      setUploadProgress(30);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;
      setUploadProgress(60);

      // Save to database
      const { error: dbError } = await supabase
        .from('kyc_documents')
        .insert({
          investor_id: investorId,
          document_type: docType,
          file_path: uploadData.path,
          verification_status: 'pending',
        });

      if (dbError) throw dbError;
      setUploadProgress(100);

      toast({
        title: 'Success',
        description: `${DOCUMENT_REQUIREMENTS.find(d => d.type === docType)?.label} uploaded successfully`,
      });

      // Reload documents
      await checkAuthAndLoadDocuments();
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setUploading(null);
      setUploadProgress(0);
    }
  };

  const getDocumentStatus = (docType: string) => {
    return documents.find(d => d.document_type === docType);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500">Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending Review</Badge>;
      default:
        return <Badge variant="outline">Not Uploaded</Badge>;
    }
  };

  const completionPercentage = () => {
    const total = DOCUMENT_REQUIREMENTS.length;
    const verified = documents.filter(d => d.verification_status === 'verified').length;
    return Math.round((verified / total) * 100);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload KYC Documents</h1>
        <p className="text-muted-foreground">
          Upload the required documents to complete your membership verification
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Verification Progress</CardTitle>
          <CardDescription>
            {documents.filter(d => d.verification_status === 'verified').length} of{' '}
            {DOCUMENT_REQUIREMENTS.length} documents verified
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercentage()} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            {completionPercentage()}% complete
          </p>
        </CardContent>
      </Card>

      {/* Document Upload Cards */}
      <div className="space-y-4">
        {DOCUMENT_REQUIREMENTS.map((req) => {
          const doc = getDocumentStatus(req.type);
          const isUploading = uploading === req.type;

          return (
            <Card key={req.type}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(doc?.verification_status)}
                    <div>
                      <CardTitle className="text-lg">{req.label}</CardTitle>
                      <CardDescription>{req.description}</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(doc?.verification_status)}
                </div>
              </CardHeader>
              <CardContent>
                {doc?.verification_status === 'rejected' && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Rejected:</strong> {doc.rejection_reason}
                    </AlertDescription>
                  </Alert>
                )}

                {doc?.verification_status === 'verified' && doc.verified_at && (
                  <Alert className="mb-4">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Verified on {new Date(doc.verified_at).toLocaleDateString()}
                    </AlertDescription>
                  </Alert>
                )}

                {doc?.verification_status === 'pending' && (
                  <Alert className="mb-4">
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Document uploaded on {new Date(doc.uploaded_at).toLocaleDateString()}.
                      Awaiting review by compliance team.
                    </AlertDescription>
                  </Alert>
                )}

                {(!doc || doc.verification_status === 'rejected') && (
                  <div>
                    <Label htmlFor={`upload-${req.type}`} className="cursor-pointer">
                      <div className="border-2 border-dashed rounded-lg p-6 hover:bg-accent hover:border-primary transition-colors">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm font-medium">
                            {doc ? 'Upload Again' : 'Click to Upload'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF or Image (Max 10MB)
                          </p>
                        </div>
                      </div>
                    </Label>
                    <input
                      id={`upload-${req.type}`}
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      aria-label={`Upload ${req.label}`}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(req.type, file);
                        }
                      }}
                      disabled={isUploading}
                    />

                    {isUploading && (
                      <div className="mt-4">
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-sm text-muted-foreground mt-2">
                          Uploading... {uploadProgress}%
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {doc && doc.verification_status !== 'rejected' && (
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Document uploaded</span>
                    </div>
                    {doc.verification_status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const input = document.getElementById(`upload-${req.type}`) as HTMLInputElement;
                          input?.click();
                        }}
                      >
                        Reupload
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help Text */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Document Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>All documents must be clear and legible</li>
            <li>Aadhaar card should be masked (first 8 digits hidden)</li>
            <li>Bank statements must show last 6 months of transactions</li>
            <li>Income proof should be for the last 2 financial years</li>
            <li>Maximum file size: 10MB per document</li>
            <li>Accepted formats: PDF, JPG, PNG</li>
            <li>Verification typically takes 2-3 business days</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

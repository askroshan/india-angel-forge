import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Award, Download, ExternalLink, Calendar, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Certificate {
  id: string;
  certificateId: string;
  pdfUrl: string;
  verificationUrl: string;
  issuedAt: string;
  duration: number;
  attendeeName: string;
  eventName: string;
  eventDate: string;
  event?: { title: string; eventDate: string; };
}

export default function Certificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);

  useEffect(() => { fetchCertificates(); }, []);

  const fetchCertificates = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/certificates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch certificates');
      const data = await response.json();
      const certs = data.data?.certificates || data.data || data.certificates || [];
      setCertificates(Array.isArray(certs) ? certs : []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load certificates.' });
    } finally { setIsLoading(false); }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const downloadCertificate = (cert: Certificate) => {
    const link = document.createElement('a');
    link.href = cert.pdfUrl || `/api/certificates/${cert.id}/download`;
    link.download = `certificate-${cert.certificateId || cert.id}.pdf`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" data-testid="certificates-loader" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="certificate-list">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Certificates</h1>
        <p className="text-muted-foreground">View and download certificates from events you have attended</p>
      </div>

      {certificates.length === 0 ? (
        <Card><CardContent className="pt-6 text-center">
          <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">No certificates yet</p>
          <p className="text-muted-foreground">Attend events and complete check-out to earn certificates</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map(certificate => (
            <Card key={certificate.id || certificate.certificateId} data-testid="certificate-item">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Award className="h-6 w-6 text-primary" />
                  <Badge variant="secondary" data-testid="cert-id">{certificate.certificateId}</Badge>
                </div>
                <CardTitle className="text-lg" data-testid="cert-event-name">{certificate.eventName || certificate.event?.title || 'Event'}</CardTitle>
                <CardDescription>{certificate.attendeeName}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span data-testid="cert-date">{formatDate(certificate.eventDate || certificate.event?.eventDate || certificate.issuedAt)}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Issued: {formatDate(certificate.issuedAt)}</span>
                  </div>
                  <div className="pt-4 space-y-2">
                    <Button className="w-full" data-testid="download-certificate" onClick={() => downloadCertificate(certificate)}>
                      <Download className="h-4 w-4 mr-2" /> Download PDF
                    </Button>
                    <Button variant="outline" className="w-full" data-testid="view-certificate" onClick={() => setPreviewCert(certificate)}>
                      <ExternalLink className="h-4 w-4 mr-2" /> View Certificate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!previewCert} onOpenChange={() => setPreviewCert(null)}>
        <DialogContent data-testid="certificate-preview">
          <DialogHeader><DialogTitle>Certificate Preview</DialogTitle></DialogHeader>
          {previewCert && (
            <div className="space-y-4">
              <div className="text-center p-6 border rounded-lg bg-muted/30">
                <Award className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">Certificate of Attendance</h3>
                <p className="text-lg">{previewCert.attendeeName}</p>
                <p className="text-muted-foreground mt-2">{previewCert.eventName || previewCert.event?.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{formatDate(previewCert.eventDate || previewCert.event?.eventDate || previewCert.issuedAt)}</p>
                <Badge variant="secondary" className="mt-4">{previewCert.certificateId}</Badge>
              </div>
              <Button className="w-full" onClick={() => downloadCertificate(previewCert)}>
                <Download className="h-4 w-4 mr-2" /> Download PDF
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

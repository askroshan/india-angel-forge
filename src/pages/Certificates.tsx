import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Award, Download, ExternalLink, Calendar, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Certificate {
  id: number;
  certificateId: string;
  pdfUrl: string;
  verificationUrl: string;
  issuedAt: string;
  duration: number;
  attendeeName: string;
  eventName: string;
  eventDate: string;
}

/**
 * Certificates Page Component
 * 
 * Displays all certificates earned by the user from events they attended.
 * Allows viewing, downloading, and verifying certificates.
 * 
 * E2E Tests: EA-E2E-004, EA-E2E-005
 */
export default function Certificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/certificates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch certificates');
      }

      const data = await response.json();
      if (data.success) {
        setCertificates(data.data);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load certificates. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} minutes`;
    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins} min`;
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
        <p className="text-muted-foreground">
          View and download certificates from events you've attended
        </p>
      </div>

      {certificates.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">No certificates yet</p>
            <p className="text-muted-foreground">
              Attend events and complete check-out to earn certificates
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((certificate) => (
            <Card key={certificate.id} data-testid={`certificate-card-${certificate.certificateId}`}>
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Award className="h-6 w-6 text-primary" />
                  <Badge variant="secondary" data-testid={`certificate-badge-${certificate.certificateId}`}>
                    {certificate.certificateId}
                  </Badge>
                </div>
                <CardTitle className="text-lg" data-testid={`certificate-event-${certificate.certificateId}`}>
                  {certificate.eventName}
                </CardTitle>
                <CardDescription data-testid={`certificate-name-${certificate.certificateId}`}>
                  {certificate.attendeeName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span data-testid={`certificate-date-${certificate.certificateId}`}>
                      {formatDate(certificate.eventDate)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    <span data-testid={`certificate-duration-${certificate.certificateId}`}>
                      {formatDuration(certificate.duration)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Award className="h-4 w-4 mr-2" />
                    <span data-testid={`certificate-issued-${certificate.certificateId}`}>
                      Issued: {formatDate(certificate.issuedAt)}
                    </span>
                  </div>

                  <div className="pt-4 space-y-2">
                    <Button
                      className="w-full"
                      onClick={() => window.open(certificate.pdfUrl, '_blank')}
                      data-testid={`certificate-download-btn-${certificate.certificateId}`}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(certificate.verificationUrl, '_blank')}
                      data-testid={`certificate-verify-btn-${certificate.certificateId}`}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Verify Certificate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

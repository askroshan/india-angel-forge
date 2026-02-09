import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Award, Calendar, User, Clock } from 'lucide-react';

interface VerificationResult {
  verified: boolean;
  certificateId: string;
  attendeeName: string;
  eventName: string;
  eventDate: string;
  duration: number;
  issuedAt: string;
}

export default function CertificateVerification() {
  const { certificateId: urlCertId } = useParams<{ certificateId: string }>();
  const [certificateIdInput, setCertificateIdInput] = useState(urlCertId || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (urlCertId) {
      verifyCertificate(urlCertId);
    }
  }, [urlCertId]);

  const verifyCertificate = async (certId: string) => {
    try {
      setIsVerifying(true);
      setResult(null);
      setError(null);
      const response = await fetch(`/api/certificates/verify/${certId}`);
      const data = await response.json();
      if (data.success && data.verified) {
        setResult({
          verified: true,
          certificateId: data.data.certificateId,
          attendeeName: data.data.attendeeName,
          eventName: data.data.eventName,
          eventDate: data.data.eventDate,
          duration: data.data.duration,
          issuedAt: data.data.issuedAt,
        });
      } else {
        setError(data.error || 'Certificate not found');
      }
    } catch (err) {
      setError('Certificate not found or verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerify = () => {
    if (certificateIdInput.trim()) {
      verifyCertificate(certificateIdInput.trim());
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Verify Certificate</h1>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              data-testid="certificate-id-input"
              placeholder="Enter Certificate ID (e.g., CERT-2025-000001)"
              value={certificateIdInput}
              onChange={e => setCertificateIdInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleVerify()}
            />
            <Button data-testid="verify-button" onClick={handleVerify} disabled={isVerifying || !certificateIdInput.trim()}>
              {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {(result || error) && (
        <div data-testid="verification-result">
          {result && (
            <Card data-testid="verification-success" className="border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <CardTitle className="text-green-700">Certificate Verified</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-muted-foreground">Attendee:</span>
                  <span data-testid="verified-attendee-name" className="font-medium">{result.attendeeName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  <span className="text-muted-foreground">Event:</span>
                  <span data-testid="verified-event-name" className="font-medium">{result.eventName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-muted-foreground">Event Date:</span>
                  <span data-testid="verified-event-date" className="font-medium">{formatDate(result.eventDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-muted-foreground">Issued:</span>
                  <span data-testid="verified-issued-date" className="font-medium">{formatDate(result.issuedAt)}</span>
                </div>
                <Badge variant="secondary">{result.certificateId}</Badge>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card data-testid="verification-error" className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-700">
                  <XCircle className="h-6 w-6" />
                  <span>Certificate not found or invalid</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Award, CheckCircle, XCircle, Calendar, Clock, User } from 'lucide-react';

interface CertificateVerification {
  certificateId: string;
  issuedAt: string;
  duration: number;
  attendeeName: string;
  eventName: string;
  eventDate: string;
  userId: number;
  eventId: number;
}

/**
 * Certificate Verification Page Component
 * 
 * Public page for verifying certificates by their ID.
 * No authentication required.
 * 
 * E2E Tests: EA-E2E-008
 */
export default function CertificateVerification() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [certificate, setCertificate] = useState<CertificateVerification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (certificateId) {
      verifyCertificate();
    }
  }, [certificateId]);

  const verifyCertificate = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/certificates/verify/${certificateId}`);

      if (!response.ok) {
        setIsValid(false);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setCertificate(data.data);
        setIsValid(true);
      } else {
        setIsValid(false);
      }
    } catch (error) {
      console.error('Error verifying certificate:', error);
      setIsValid(false);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
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
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" data-testid="verification-loader" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16" data-testid="certificate-verification-page">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Certificate Verification</h1>
          <p className="text-muted-foreground">
            Verify the authenticity of India Angel Forum certificates
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              {isValid ? (
                <CheckCircle className="h-16 w-16 text-green-500" data-testid="verification-valid-icon" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500" data-testid="verification-invalid-icon" />
              )}
            </div>
            <CardTitle className="text-center text-2xl">
              {isValid ? 'Valid Certificate' : 'Invalid Certificate'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isValid && certificate ? (
              <div className="space-y-6" data-testid="verification-details">
                <div className="text-center">
                  <Badge variant="secondary" className="text-lg px-4 py-2" data-testid="verification-certificate-id">
                    {certificate.certificateId}
                  </Badge>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-start">
                    <Award className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Event</p>
                      <p className="text-lg font-semibold" data-testid="verification-event-name">
                        {certificate.eventName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <User className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Attendee</p>
                      <p className="text-lg font-semibold" data-testid="verification-attendee-name">
                        {certificate.attendeeName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Event Date</p>
                      <p className="text-lg font-semibold" data-testid="verification-event-date">
                        {formatDate(certificate.eventDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Clock className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Duration</p>
                      <p className="text-lg font-semibold" data-testid="verification-duration">
                        {formatDuration(certificate.duration)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Issued On</p>
                      <p className="text-lg font-semibold" data-testid="verification-issued-date">
                        {formatDate(certificate.issuedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800 text-center">
                      ✓ This certificate is authentic and was issued by India Angel Forum
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8" data-testid="verification-invalid-message">
                <p className="text-lg mb-4">
                  The certificate ID <strong>{certificateId}</strong> could not be verified.
                </p>
                <p className="text-muted-foreground mb-6">
                  This certificate may not exist or the ID might be incorrect.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    ⚠ Warning: This certificate could not be authenticated
                  </p>
                </div>
              </div>
            )}

            <div className="mt-8 text-center">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                data-testid="verification-home-btn"
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

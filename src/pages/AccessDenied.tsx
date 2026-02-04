/**
 * AccessDenied Page (403 Forbidden)
 * 
 * US-AUTH-003: WCAG 2.2 AA compliant access denied page
 * 
 * Accessibility Features:
 * - Proper heading hierarchy (single h1)
 * - Main landmark for content
 * - Color contrast ≥4.5:1
 * - Keyboard navigable
 * - Screen reader friendly
 * - Responsive design (mobile, tablet, desktop)
 * - Focus management
 */

import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldX, Home, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';

interface AccessDeniedProps {
  /** The roles that are required to access the page (passed from ProtectedRoute) */
  requiredRoles?: string[];
}

/**
 * Get the appropriate dashboard URL based on user's primary role
 */
function getDashboardUrl(roles: string[] = []): string {
  if (roles.includes('admin')) return '/admin';
  if (roles.includes('compliance_officer')) return '/compliance/kyc-review';
  if (roles.includes('moderator')) return '/moderator/applications';
  if (roles.includes('founder')) return '/founder/application-status';
  if (roles.includes('operator_angel')) return '/operator/advisory';
  if (roles.includes('investor') || roles.includes('family_office')) return '/investor/deals';
  return '/';
}

/**
 * Format role names for display (convert snake_case to Title Case)
 */
function formatRoleName(role: string): string {
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function AccessDenied({ requiredRoles = [] }: AccessDeniedProps) {
  const { user } = useAuth();
  const dashboardUrl = getDashboardUrl(user?.roles);
  const displayRoles = user?.roles?.map(formatRoleName).join(', ') || 'Guest';
  const displayRequiredRoles = requiredRoles.length > 0 
    ? requiredRoles.map(formatRoleName).join(' or ') 
    : null;

  return (
    <main 
      className="min-h-screen flex items-center justify-center p-4 bg-background"
      role="main"
      aria-labelledby="access-denied-heading"
    >
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="text-center space-y-4">
          {/* Decorative icon - hidden from screen readers */}
          <div 
            className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center"
            aria-hidden="true"
          >
            <ShieldX className="w-8 h-8 text-destructive" />
          </div>
          
          {/* Status code for visual users */}
          <p 
            className="text-6xl font-bold text-destructive"
            aria-hidden="true"
          >
            403
          </p>
          
          {/* Main heading - screen reader accessible */}
          <h1 
            id="access-denied-heading"
            className="text-2xl md:text-3xl font-bold text-foreground"
          >
            Access Denied
          </h1>
          
          <CardDescription className="text-base text-muted-foreground">
            You don't have permission to access this page.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Explanation */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-foreground">
              The page you're trying to access requires different permissions than your current account has.
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Your current role:</span>{' '}
              <span className="text-foreground font-semibold">{displayRoles}</span>
            </p>
            {displayRequiredRoles && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Required role:</span>{' '}
                <span className="text-foreground font-semibold">{displayRequiredRoles}</span>
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              asChild 
              className="flex-1"
              size="lg"
            >
              <Link 
                to={dashboardUrl}
                aria-label={`Go to your dashboard at ${dashboardUrl}`}
              >
                <Home className="w-4 h-4 mr-2" aria-hidden="true" />
                Go to Dashboard
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant="outline" 
              className="flex-1"
              size="lg"
            >
              <Link 
                to="/contact"
                aria-label="Contact support for help with access issues"
              >
                <Mail className="w-4 h-4 mr-2" aria-hidden="true" />
                Contact Support
              </Link>
            </Button>
          </div>

          {/* Back link */}
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Go Back
            </Button>
          </div>

          {/* Help text */}
          <p className="text-xs text-center text-muted-foreground">
            If you believe this is an error, please{' '}
            <Link 
              to="/contact" 
              className="underline hover:text-foreground focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
            >
              contact our support team
            </Link>
            {' '}with details about what you were trying to access.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

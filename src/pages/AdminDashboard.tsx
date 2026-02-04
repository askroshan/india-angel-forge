import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Users, Building2, Calendar, FileText, Shield } from "lucide-react";
import { EventManagement } from "@/components/admin/EventManagement";

interface FounderApplication {
  id: string;
  company_name: string;
  founder_name: string;
  founder_email: string;
  stage: string;
  status: string;
  created_at: string;
}

interface InvestorApplication {
  id: string;
  full_name: string;
  email: string;
  membership_type: string;
  status: string;
  created_at: string;
}

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [founderApps, setFounderApps] = useState<FounderApplication[]>([]);
  const [investorApps, setInvestorApps] = useState<InvestorApplication[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Check if user has admin role from AuthContext
  // Note: ProtectedRoute already verifies this, but we keep it for data fetching logic
  const isAdmin = user?.roles?.includes('admin') ?? false;

  useEffect(() => {
    const fetchApplications = async () => {
      if (!isAdmin || !user) return;

      setLoadingData(true);

      try {
        // Use fetch directly with token from localStorage
        const token = localStorage.getItem('auth_token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const [founderRes, investorRes] = await Promise.all([
          fetch('/api/applications/founders', { headers }).then(r => r.ok ? r.json() : []),
          fetch('/api/applications/investors', { headers }).then(r => r.ok ? r.json() : [])
        ]);

        setFounderApps(founderRes || []);
        setInvestorApps(investorRes || []);
      } catch (error) {
        console.error('[AdminDashboard] Error fetching applications:', error);
      }
      
      setLoadingData(false);
    };

    if (!loading && isAdmin) {
      fetchApplications();
    }
  }, [user, loading, isAdmin]);

  const updateApplicationStatus = async (
    table: 'founder_applications' | 'investor_applications',
    id: string,
    status: string
  ) => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const endpoint = table === 'founder_applications' 
        ? `/api/applications/founders/${id}` 
        : `/api/applications/investors/${id}`;
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast({
        title: "Success",
        description: "Application status updated",
      });
      
      // Refresh data
      if (table === 'founder_applications') {
        const data = await fetch('/api/applications/founders', { headers }).then(r => r.ok ? r.json() : []);
        setFounderApps(data || []);
      } else {
        const data = await fetch('/api/applications/investors', { headers }).then(r => r.ok ? r.json() : []);
        setInvestorApps(data || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      submitted: "secondary",
      approved: "default",
      rejected: "destructive",
      under_review: "outline",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  // Show loading spinner while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // ProtectedRoute handles auth redirect, but we add this as a safety check
  if (!user) {
    navigate('/auth');
    return null;
  }

  // Note: ProtectedRoute already handles access denial, this should never show
  // if the route is properly wrapped, but keeping as a defensive check
  if (!isAdmin) {
    console.warn('[AdminDashboard] User accessed without admin role - ProtectedRoute should have blocked this');
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-destructive" />
                Access Denied
              </CardTitle>
              <CardDescription>
                You don't have admin privileges to access this page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')} className="w-full">
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage applications, events, and users</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Founder Applications</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{founderApps.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investor Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{investorApps.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {founderApps.filter(a => a.status === 'submitted').length + 
                 investorApps.filter(a => a.status === 'submitted').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {founderApps.filter(a => a.status === 'approved').length + 
                 investorApps.filter(a => a.status === 'approved').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="events" className="space-y-4">
          <TabsList>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="founders">Founder Applications</TabsTrigger>
            <TabsTrigger value="investors">Investor Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            <EventManagement />
          </TabsContent>

          <TabsContent value="founders">
            <Card>
              <CardHeader>
                <CardTitle>Founder Applications</CardTitle>
                <CardDescription>Review and manage startup applications</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : founderApps.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No applications yet</p>
                ) : (
                  <div className="space-y-4">
                    {founderApps.map((app) => (
                      <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-semibold">{app.company_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {app.founder_name} • {app.founder_email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Stage: {app.stage} • Applied: {new Date(app.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(app.status)}
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateApplicationStatus('founder_applications', app.id, 'under_review')}
                            >
                              Review
                            </Button>
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => updateApplicationStatus('founder_applications', app.id, 'approved')}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => updateApplicationStatus('founder_applications', app.id, 'rejected')}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="investors">
            <Card>
              <CardHeader>
                <CardTitle>Investor Applications</CardTitle>
                <CardDescription>Review and manage investor membership applications</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : investorApps.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No applications yet</p>
                ) : (
                  <div className="space-y-4">
                    {investorApps.map((app) => (
                      <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-semibold">{app.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{app.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Membership: {app.membership_type} • Applied: {new Date(app.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(app.status)}
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateApplicationStatus('investor_applications', app.id, 'under_review')}
                            >
                              Review
                            </Button>
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => updateApplicationStatus('investor_applications', app.id, 'approved')}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => updateApplicationStatus('investor_applications', app.id, 'rejected')}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;

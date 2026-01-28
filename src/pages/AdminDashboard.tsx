import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
// ...existing code...
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [founderApps, setFounderApps] = useState<FounderApplication[]>([]);
  const [investorApps, setInvestorApps] = useState<InvestorApplication[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setCheckingRole(false);
        return;
      }

      // Use the has_role function to check if user is admin
      // TODO: Replace supabase call with new API
      // const { data, error } = await fetch('/api/roles/has_role', ...)
        _user_id: user.id,
        _role: 'admin'
      });

      if (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data === true);
      }
      setCheckingRole(false);
    };

    if (!loading) {
      checkAdminRole();
    }
  }, [user, loading]);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!isAdmin) return;

      setLoadingData(true);

      const [founderRes, investorRes] = await Promise.all([
        // ...existing code...
          .from('founder_applications')
          .select('id, company_name, founder_name, founder_email, stage, status, created_at')
          .order('created_at', { ascending: false }),
        // ...existing code...
          .from('investor_applications')
          .select('id, full_name, email, membership_type, status, created_at')
          .order('created_at', { ascending: false })
      ]);

      if (founderRes.data) setFounderApps(founderRes.data);
      if (investorRes.data) setInvestorApps(investorRes.data);
      
      setLoadingData(false);
    };

    if (isAdmin) {
      fetchApplications();
    }
  }, [isAdmin]);

  const updateApplicationStatus = async (
    table: 'founder_applications' | 'investor_applications',
    id: string,
    status: string
  ) => {
    // TODO: Replace supabase call with new API
    // const { error } = await fetch('/api/logout', ...)
      .from(table)
      .update({ status })
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Application status updated",
      });
      
      // Refresh data
      if (table === 'founder_applications') {
        // TODO: Replace supabase call with new API
        // const { data } = await fetch('/api/roles', ...)
          .from('founder_applications')
          .select('id, company_name, founder_name, founder_email, stage, status, created_at')
          .order('created_at', { ascending: false });
        if (data) setFounderApps(data);
      } else {
        // TODO: Replace supabase call with new API
        // const { data } = await fetch('/api/roles', ...)
          .from('investor_applications')
          .select('id, full_name, email, membership_type, status, created_at')
          .order('created_at', { ascending: false });
        if (data) setInvestorApps(data);
      }
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

  if (loading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!isAdmin) {
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

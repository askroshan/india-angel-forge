/**
 * US-ADMIN-CRUD-004: Company Management
 * 
 * As an: Admin
 * I want to: View and delete company profiles
 * So that: I can manage companies on the platform
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Building2, Search, Trash2, Globe, MapPin, ExternalLink } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  description: string | null;
  sector: string | null;
  stage: string | null;
  website: string | null;
  location: string | null;
  founder: { email: string; fullName: string } | null;
  createdAt: string;
}

export default function CompanyManagement() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Company | null>(null);

  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredCompanies(
        companies.filter(c =>
          c.name.toLowerCase().includes(query) ||
          c.sector?.toLowerCase().includes(query) ||
          c.founder?.fullName?.toLowerCase().includes(query) ||
          c.location?.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredCompanies(companies);
    }
  }, [companies, searchQuery]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      if (!token) return;

      const response = await fetch('/api/admin/companies', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to load companies');

      const data = await response.json();
      setCompanies(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load companies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/admin/companies/${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete company');
      }

      toast({
        title: 'Success',
        description: `Company "${deleteConfirm.name}" has been deleted`,
      });

      setDeleteConfirm(null);
      fetchCompanies();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete company',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Company Management</h1>
        <p className="text-muted-foreground">
          View and manage company profiles on the platform
        </p>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div>
            <Label htmlFor="search">Search Companies</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name, sector, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Companies List */}
      {loading ? (
        <div className="text-center py-8">Loading companies...</div>
      ) : filteredCompanies.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No companies found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCompanies.map((company) => (
            <Card key={company.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4">
                    <Building2 className="h-8 w-8 text-muted-foreground mt-1" />
                    <div>
                      <h3 className="font-semibold">{company.name}</h3>
                      {company.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{company.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {company.sector && (
                          <Badge variant="secondary">{company.sector}</Badge>
                        )}
                        {company.stage && (
                          <Badge variant="outline">{company.stage}</Badge>
                        )}
                        {company.location && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {company.location}
                          </span>
                        )}
                        {company.website && (
                          <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-xs text-accent flex items-center gap-1">
                            <Globe className="h-3 w-3" /> Website <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      {company.founder && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Founder: {company.founder.fullName} ({company.founder.email})
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirm(company)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

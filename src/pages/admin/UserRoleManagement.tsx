/**
 * US-ADMIN-001: Assign User Roles
 * 
 * As an: Admin
 * I want to: Assign and manage user roles (investor, moderator, compliance officer)
 * So that: Users have appropriate access permissions
 * 
 * Priority: Critical
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Users, Shield, Edit, Search } from 'lucide-react';

interface User {
  id: string;
  email: string;
  fullName?: string;
  createdAt: string;
  role?: 'admin' | 'moderator' | 'compliance_officer' | 'user';
}

const AVAILABLE_ROLES = [
  { value: 'admin', label: 'Administrator', description: 'Full system access' },
  { value: 'moderator', label: 'Moderator', description: 'Content moderation and event management' },
  { value: 'compliance_officer', label: 'Compliance Officer', description: 'KYC and AML verification' },
  { value: 'user', label: 'Standard User', description: 'Basic platform access' },
];

export default function UserRoleManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [accessDenied, setAccessDenied] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token, user } = useAuth();

  useEffect(() => {
    checkAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!accessDenied) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessDenied]);

  useEffect(() => {
    filterUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, searchQuery, filterRole]);

  const checkAccess = async () => {
    if (!token || !user) {
      navigate('/auth');
      return;
    }

    setCurrentUserId(user.id);

    // Check if user is admin via API
    const response = await fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 403 || response.status === 401) {
      setAccessDenied(true);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      if (!token) return;

      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        setAccessDenied(true);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load users');
      }

      const data = await response.json();
      setUsers(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.email.toLowerCase().includes(query) ||
        u.fullName?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleOpenRoleDialog = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role || 'user');
  };

  const handleCloseDialog = () => {
    setSelectedUser(null);
    setNewRole('');
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !newRole) return;

    if (selectedUser.id === currentUserId && newRole !== 'admin') {
      toast({
        title: 'Error',
        description: 'You cannot remove your own admin role',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign role');
      }

      toast({
        title: 'Success',
        description: `Role updated to ${AVAILABLE_ROLES.find(r => r.value === newRole)?.label}`,
      });

      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign role',
        variant: 'destructive',
      });
    }
  };

  if (accessDenied) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only administrators can access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">User Role Management</h1>
        <p className="text-muted-foreground">
          Assign and manage user roles across the platform
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search User</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="role">Filter by Role</Label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {AVAILABLE_ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilterRole('all');
                  setSearchQuery('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {AVAILABLE_ROLES.map(role => {
          const count = users.filter(u => u.role === role.value).length;
          return (
            <Card key={role.value}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{role.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Users List */}
      {loading ? (
        <div className="text-center py-8">Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No users found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold">{user.fullName || user.email}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          <Shield className="h-3 w-3 mr-1" />
                          {AVAILABLE_ROLES.find(r => r.value === user.role)?.label || 'User'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenRoleDialog(user)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Change Role
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Role Assignment Dialog */}
      <Dialog open={selectedUser !== null} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="new-role">Select Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger id="new-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      <div>
                        <div className="font-medium">{role.label}</div>
                        <div className="text-xs text-muted-foreground">{role.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUser?.id === currentUserId && newRole !== 'admin' && (
              <div className="p-3 bg-destructive/10 rounded-md text-sm text-destructive">
                Warning: You cannot remove your own admin role
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleAssignRole}>
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

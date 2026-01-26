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
import { supabase } from '@/integrations/supabase/client';
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
  full_name?: string;
  created_at: string;
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

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (!accessDenied) {
      fetchUsers();
    }
  }, [accessDenied]);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, filterRole]);

  const checkAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    setCurrentUserId(session.user.id);

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      setAccessDenied(true);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all users with their roles
      const { data: usersData, error: usersError } = await supabase
        .from('auth.users')
        .select('id, email, raw_user_meta_data, created_at')
        .order('created_at', { ascending: false });

      if (usersError) {
        // Fallback: try getting from user_roles table
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');

        if (rolesError) throw rolesError;

        const usersWithRoles = rolesData.map(r => ({
          id: r.user_id,
          email: `user-${r.user_id.slice(0, 8)}`,
          created_at: new Date().toISOString(),
          role: r.role as any,
        }));

        setUsers(usersWithRoles);
      } else {
        // Get roles for each user
        const userIds = usersData.map(u => u.id);
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);

        const rolesMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);

        const usersWithRoles = usersData.map(u => ({
          id: u.id,
          email: u.email || 'No email',
          full_name: u.raw_user_meta_data?.full_name,
          created_at: u.created_at,
          role: rolesMap.get(u.id) || 'user',
        }));

        setUsers(usersWithRoles);
      }
    } catch (error: any) {
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
        u.full_name?.toLowerCase().includes(query)
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Check if role exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', selectedUser.id)
        .single();

      if (existingRole) {
        // Update existing role
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', selectedUser.id);

        if (updateError) throw updateError;
      } else {
        // Insert new role
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: selectedUser.id,
            role: newRole,
          });

        if (insertError) throw insertError;
      }

      // Log audit trail
      await supabase.from('audit_logs').insert({
        user_id: session.user.id,
        action: 'role_assigned',
        entity_type: 'user_role',
        entity_id: selectedUser.id,
        details: {
          previous_role: selectedUser.role,
          new_role: newRole,
          user_email: selectedUser.email,
        },
      });

      toast({
        title: 'Success',
        description: `Role updated to ${AVAILABLE_ROLES.find(r => r.value === newRole)?.label}`,
      });

      handleCloseDialog();
      fetchUsers();
    } catch (error: any) {
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
                      <h3 className="font-semibold">{user.full_name || user.email}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          <Shield className="h-3 w-3 mr-1" />
                          {AVAILABLE_ROLES.find(r => r.value === user.role)?.label || 'User'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Joined {new Date(user.created_at).toLocaleDateString()}
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

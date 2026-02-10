import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  useAdminTeamMembers,
  useCreateTeamMember,
  useUpdateTeamMember,
  useDeleteTeamMember,
  useAdminPartners,
  useCreatePartner,
  useUpdatePartner,
  useDeletePartner,
  type TeamMember,
  type Partner,
} from "@/hooks/useCMS";
import { Plus, Pencil, Trash2, Upload, Users, Building2, ExternalLink } from "lucide-react";

export default function CMSManagement() {
  const [activeTab, setActiveTab] = useState('team');

  return (
    <div className="min-h-screen bg-background" data-testid="cms-management-page">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">CMS Management</h1>
        <p className="text-muted-foreground mb-8">Manage team members and partners displayed on the About page</p>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Team Members
            </TabsTrigger>
            <TabsTrigger value="partners" className="gap-2">
              <Building2 className="h-4 w-4" />
              Partners
            </TabsTrigger>
          </TabsList>

          <TabsContent value="team">
            <TeamMembersManager />
          </TabsContent>

          <TabsContent value="partners">
            <PartnersManager />
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}

// ==================== Team Members Manager ====================

function TeamMembersManager() {
  const { data: members, isLoading } = useAdminTeamMembers();
  const createMutation = useCreateTeamMember();
  const updateMutation = useUpdateTeamMember();
  const deleteMutation = useDeleteTeamMember();
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingMember(null);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => setDeleteConfirm(null),
    });
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Team Members</h2>
        <Button onClick={handleCreate} className="gap-2" data-testid="add-team-member">
          <Plus className="h-4 w-4" />
          Add Team Member
        </Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : members && members.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <Card key={member.id} className={`${!member.isActive ? 'opacity-60' : ''}`} data-testid="admin-team-card">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    {member.photoUrl ? (
                      <AvatarImage src={member.photoUrl} alt={member.name} />
                    ) : null}
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{member.name}</h3>
                    <p className="text-sm text-accent">{member.role}</p>
                    {member.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{member.bio}</p>}
                    <p className="text-xs text-muted-foreground mt-1">Order: {member.displayOrder} | {member.isActive ? '✅ Active' : '❌ Inactive'}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(member)} data-testid="edit-team-member">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(member.id)} data-testid="delete-team-member">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No team members yet. Click "Add Team Member" to get started.
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <TeamMemberForm
        open={showForm}
        onOpenChange={setShowForm}
        member={editingMember}
        onSubmit={(formData) => {
          if (editingMember) {
            updateMutation.mutate({ id: editingMember.id, formData }, {
              onSuccess: () => setShowForm(false),
            });
          } else {
            createMutation.mutate(formData, {
              onSuccess: () => setShowForm(false),
            });
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team Member</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this team member? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} disabled={deleteMutation.isPending} data-testid="confirm-delete">
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== Team Member Form ====================

function TeamMemberForm({ open, onOpenChange, member, onSubmit, isLoading }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  onSubmit: (formData: FormData) => void;
  isLoading: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(member?.photoUrl || null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData();
    
    formData.append('name', (form.elements.namedItem('name') as HTMLInputElement).value);
    formData.append('role', (form.elements.namedItem('role') as HTMLInputElement).value);
    formData.append('bio', (form.elements.namedItem('bio') as HTMLTextAreaElement).value);
    formData.append('linkedinUrl', (form.elements.namedItem('linkedinUrl') as HTMLInputElement).value);
    formData.append('displayOrder', (form.elements.namedItem('displayOrder') as HTMLInputElement).value);
    formData.append('isActive', String((form.elements.namedItem('isActive') as HTMLInputElement)?.checked ?? true));
    
    const fileInput = fileInputRef.current;
    if (fileInput?.files?.[0]) {
      formData.append('photo', fileInput.files[0]);
    }
    
    onSubmit(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{member ? 'Edit' : 'Add'} Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="team-member-form">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" defaultValue={member?.name || ''} required data-testid="team-name-input" />
          </div>
          <div>
            <Label htmlFor="role">Role *</Label>
            <Input id="role" name="role" defaultValue={member?.role || ''} required data-testid="team-role-input" />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" name="bio" defaultValue={member?.bio || ''} rows={3} data-testid="team-bio-input" />
          </div>
          <div>
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input id="linkedinUrl" name="linkedinUrl" defaultValue={member?.linkedinUrl || ''} data-testid="team-linkedin-input" />
          </div>
          <div>
            <Label htmlFor="photo">Photo</Label>
            <div className="flex items-center gap-3">
              {(preview || member?.photoUrl) && (
                <Avatar className="h-12 w-12">
                  <AvatarImage src={preview || member?.photoUrl || ''} />
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1">
                <Upload className="h-4 w-4" />
                {preview || member?.photoUrl ? 'Change' : 'Upload'}
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} data-testid="team-photo-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input id="displayOrder" name="displayOrder" type="number" defaultValue={member?.displayOrder || 0} data-testid="team-order-input" />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch id="isActive" name="isActive" defaultChecked={member?.isActive ?? true} data-testid="team-active-switch" />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading} data-testid="team-submit">
              {isLoading ? 'Saving...' : member ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Partners Manager ====================

function PartnersManager() {
  const { data: partners, isLoading } = useAdminPartners();
  const createMutation = useCreatePartner();
  const updateMutation = useUpdatePartner();
  const deleteMutation = useDeletePartner();
  const [showForm, setShowForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingPartner(null);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => setDeleteConfirm(null),
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Partners</h2>
        <Button onClick={handleCreate} className="gap-2" data-testid="add-partner">
          <Plus className="h-4 w-4" />
          Add Partner
        </Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : partners && partners.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((partner) => (
            <Card key={partner.id} className={`${!partner.isActive ? 'opacity-60' : ''}`} data-testid="admin-partner-card">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  {partner.logoUrl ? (
                    <img src={partner.logoUrl} alt={partner.name} className="h-10 w-10 object-contain" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{partner.name}</h3>
                    {partner.websiteUrl && (
                      <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent flex items-center gap-1">
                        Visit <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {partner.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{partner.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">Order: {partner.displayOrder} | {partner.isActive ? '✅ Active' : '❌ Inactive'}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(partner)} data-testid="edit-partner">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(partner.id)} data-testid="delete-partner">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No partners yet. Click "Add Partner" to get started.
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <PartnerForm
        open={showForm}
        onOpenChange={setShowForm}
        partner={editingPartner}
        onSubmit={(formData) => {
          if (editingPartner) {
            updateMutation.mutate({ id: editingPartner.id, formData }, {
              onSuccess: () => setShowForm(false),
            });
          } else {
            createMutation.mutate(formData, {
              onSuccess: () => setShowForm(false),
            });
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Partner</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this partner? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} disabled={deleteMutation.isPending} data-testid="confirm-delete-partner">
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== Partner Form ====================

function PartnerForm({ open, onOpenChange, partner, onSubmit, isLoading }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: Partner | null;
  onSubmit: (formData: FormData) => void;
  isLoading: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(partner?.logoUrl || null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData();
    
    formData.append('name', (form.elements.namedItem('name') as HTMLInputElement).value);
    formData.append('websiteUrl', (form.elements.namedItem('websiteUrl') as HTMLInputElement).value);
    formData.append('description', (form.elements.namedItem('description') as HTMLTextAreaElement).value);
    formData.append('displayOrder', (form.elements.namedItem('displayOrder') as HTMLInputElement).value);
    formData.append('isActive', String((form.elements.namedItem('isActive') as HTMLInputElement)?.checked ?? true));
    
    const fileInput = fileInputRef.current;
    if (fileInput?.files?.[0]) {
      formData.append('logo', fileInput.files[0]);
    }
    
    onSubmit(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{partner ? 'Edit' : 'Add'} Partner</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="partner-form">
          <div>
            <Label htmlFor="partner-name">Name *</Label>
            <Input id="partner-name" name="name" defaultValue={partner?.name || ''} required data-testid="partner-name-input" />
          </div>
          <div>
            <Label htmlFor="partner-website">Website URL</Label>
            <Input id="partner-website" name="websiteUrl" defaultValue={partner?.websiteUrl || ''} data-testid="partner-website-input" />
          </div>
          <div>
            <Label htmlFor="partner-desc">Description</Label>
            <Textarea id="partner-desc" name="description" defaultValue={partner?.description || ''} rows={2} data-testid="partner-description-input" />
          </div>
          <div>
            <Label htmlFor="partner-logo">Logo</Label>
            <div className="flex items-center gap-3">
              {(preview || partner?.logoUrl) && (
                <img src={preview || partner?.logoUrl || ''} alt="Logo preview" className="h-10 w-auto object-contain" />
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1">
                <Upload className="h-4 w-4" />
                {preview || partner?.logoUrl ? 'Change' : 'Upload'}
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} data-testid="partner-logo-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="partner-order">Display Order</Label>
              <Input id="partner-order" name="displayOrder" type="number" defaultValue={partner?.displayOrder || 0} data-testid="partner-order-input" />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch id="isActive" name="isActive" defaultChecked={partner?.isActive ?? true} data-testid="partner-active-switch" />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading} data-testid="partner-submit">
              {isLoading ? 'Saving...' : partner ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

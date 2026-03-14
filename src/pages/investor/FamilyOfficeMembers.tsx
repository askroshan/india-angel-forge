/**
 * US-FO-05: Family Office Multi-Seat Members
 *
 * As a: Family Office primary investor
 * I want to: Manage co-investor seats (VIEWER / MANAGER roles)
 * So that: My family members can access deal flow under my umbrella account
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, UserPlus, UserMinus, Users, AlertCircle } from "lucide-react";

interface FamilyMember {
  id: string;
  memberUserId: string;
  role: "VIEWER" | "MANAGER";
  addedAt: string;
  isActive: boolean;
  memberEmail?: string;
  memberName?: string;
}

interface AddMemberPayload {
  email: string;
  role: "VIEWER" | "MANAGER";
}

export default function FamilyOfficeMembers() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"VIEWER" | "MANAGER">("VIEWER");

  const { data: members = [], isLoading, error } = useQuery<FamilyMember[]>({
    queryKey: ["family-office-members"],
    queryFn: () => apiClient.get<FamilyMember[]>("/api/family-office/members"),
  });

  const addMemberMutation = useMutation({
    mutationFn: (payload: AddMemberPayload) =>
      apiClient.post("/api/family-office/members", payload),
    onSuccess: () => {
      toast.success("Co-investor added successfully");
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["family-office-members"] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to add member";
      toast.error("Failed to add co-investor", { description: message });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) =>
      apiClient.delete(`/api/family-office/members/${memberId}`),
    onSuccess: () => {
      toast.success("Co-investor removed");
      queryClient.invalidateQueries({ queryKey: ["family-office-members"] });
    },
    onError: () => toast.error("Failed to remove co-investor"),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    addMemberMutation.mutate({ email: email.trim(), role });
  };

  const roleLabel = (r: string) =>
    r === "MANAGER" ? "Manager" : "Viewer";

  const roleBadgeVariant = (r: string): "default" | "secondary" =>
    r === "MANAGER" ? "default" : "secondary";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7" />
            Family Office Members
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage co-investor seats for your family office account
          </p>
        </div>

        {/* Add Member Form */}
        <Card className="mb-6" data-testid="add-member-card">
          <CardHeader>
            <CardTitle className="text-lg">Add Co-Investor</CardTitle>
            <CardDescription>
              Invite a family member or trusted co-investor by email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="flex gap-3" data-testid="add-member-form">
              <Input
                type="email"
                placeholder="member@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1"
                data-testid="member-email-input"
                required
              />
              <Select value={role} onValueChange={(v: "VIEWER" | "MANAGER") => setRole(v)}>
                <SelectTrigger className="w-36" data-testid="member-role-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="submit"
                disabled={addMemberMutation.isPending || !email.trim()}
                data-testid="add-member-button"
              >
                {addMemberMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                <span className="ml-2">Add</span>
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              <strong>Viewer</strong>: Read-only access to deals and portfolio.{" "}
              <strong>Manager</strong>: Can express interest and manage commitments.
            </p>
          </CardContent>
        </Card>

        {/* Member List */}
        <Card data-testid="members-list-card">
          <CardHeader>
            <CardTitle className="text-lg">
              Active Members
              {members.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {members.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Failed to load members. Please try again.</AlertDescription>
              </Alert>
            )}

            {!isLoading && !error && members.length === 0 && (
              <p className="text-muted-foreground text-center py-8">
                No co-investors added yet. Use the form above to invite family members.
              </p>
            )}

            {members.length > 0 && (
              <ul className="space-y-3" data-testid="members-list">
                {members.map(member => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                    data-testid={`member-row-${member.id}`}
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {member.memberName || member.memberEmail || member.memberUserId}
                      </p>
                      {member.memberName && member.memberEmail && (
                        <p className="text-xs text-muted-foreground">{member.memberEmail}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(member.addedAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={roleBadgeVariant(member.role)}>
                        {roleLabel(member.role)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMemberMutation.mutate(member.id)}
                        disabled={removeMemberMutation.isPending}
                        data-testid={`remove-member-${member.id}`}
                      >
                        <UserMinus className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Clock, Plus, CheckCircle2, ListChecks } from 'lucide-react';

interface ChecklistItem {
  id: string;
  item_name: string;
  completed: boolean;
  notes?: string;
  category?: string;
}

interface Deal {
  id: string;
  company_name: string;
}

export default function DueDiligenceChecklist() {
  const navigate = useNavigate();
  const { dealId } = useParams<{ dealId: string }>();
  const [loading, setLoading] = useState(true);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [newItem, setNewItem] = useState({
    item_name: '',
    category: 'General',
    notes: '',
  });

  useEffect(() => {
    if (dealId) {
      fetchData();
    }
  }, [dealId]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Get deal info
      const { data: dealData, error: dealError } = await supabase
        .from('deals')
        .select('id, company_name')
        .eq('id', dealId)
        .single();

      if (dealError) {
        console.error('Error fetching deal:', dealError);
        return;
      }

      setDeal(dealData);

      // Get checklist items
      const { data: itemsData, error: itemsError } = await supabase
        .from('due_diligence_items')
        .select('*')
        .eq('deal_id', dealId);

      if (itemsError) {
        console.error('Error fetching items:', itemsError);
        return;
      }

      setItems(itemsData || []);

    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.item_name || !dealId) {
      alert('Please enter item name');
      return;
    }

    try {
      setSaving(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('due_diligence_items')
        .insert({
          deal_id: dealId,
          investor_id: session.user.id,
          item_name: newItem.item_name,
          category: newItem.category,
          notes: newItem.notes,
          completed: false,
        })
        .select();

      if (error) {
        console.error('Error creating item:', error);
        alert('Failed to create item');
        return;
      }

      setItems([...(data || []), ...items]);
      setShowAddDialog(false);
      setNewItem({
        item_name: '',
        category: 'General',
        notes: '',
      });

    } catch (err) {
      console.error('Error:', err);
      alert('Failed to create item');
    } finally {
      setSaving(false);
    }
  };

  const toggleCompletion = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('due_diligence_items')
        .update({ completed: !currentStatus })
        .eq('id', itemId);

      if (error) {
        console.error('Error updating item:', error);
        return;
      }

      setItems(items.map(item => 
        item.id === itemId ? { ...item, completed: !currentStatus } : item
      ));

    } catch (err) {
      console.error('Error:', err);
    }
  };

  const updateNotes = async (itemId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('due_diligence_items')
        .update({ notes })
        .eq('id', itemId);

      if (error) {
        console.error('Error updating notes:', error);
        return;
      }

      setItems(items.map(item => 
        item.id === itemId ? { ...item, notes } : item
      ));

    } catch (err) {
      console.error('Error:', err);
    }
  };

  const getCompletionPercentage = (): number => {
    if (items.length === 0) return 0;
    const completedCount = items.filter(item => item.completed).length;
    return Math.round((completedCount / items.length) * 100);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Clock className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Deal Not Found</h2>
          <Button onClick={() => navigate('/investor/deals')}>
            Back to Deals
          </Button>
        </div>
      </div>
    );
  }

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Due Diligence Checklist</h1>
          <p className="text-muted-foreground">{deal.company_name}</p>
        </div>

        {/* Progress Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Completion Progress</h2>
            <span className="text-2xl font-bold">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            {items.filter(i => i.completed).length} of {items.length} items completed
          </p>
        </Card>

        {/* Add Item Button */}
        <div className="flex justify-end">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Checklist Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="item_name">Item Name *</Label>
                  <Input
                    id="item_name"
                    value={newItem.item_name}
                    onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                    placeholder="Review Financial Statements"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newItem.category}
                    onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Financial">Financial</SelectItem>
                      <SelectItem value="Legal">Legal</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                      <SelectItem value="Team">Team</SelectItem>
                      <SelectItem value="Market">Market</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newItem.notes}
                    onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                    placeholder="Add any notes or details..."
                    rows={3}
                  />
                </div>

                <Button onClick={handleAddItem} disabled={saving} className="w-full">
                  {saving ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Empty State */}
        {items.length === 0 && (
          <Card className="p-12 text-center">
            <ListChecks className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Checklist Items Yet</h2>
            <p className="text-muted-foreground mb-6">
              Start adding items to track your due diligence progress
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Item
            </Button>
          </Card>
        )}

        {/* Checklist Items */}
        {items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => toggleCompletion(item.id, item.completed)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {item.item_name}
                      </h3>
                      {item.completed && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    {item.category && (
                      <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {item.category}
                      </span>
                    )}
                    <Textarea
                      value={item.notes || ''}
                      onChange={(e) => updateNotes(item.id, e.target.value)}
                      placeholder="Add notes..."
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

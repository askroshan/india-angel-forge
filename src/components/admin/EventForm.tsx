import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Event, EVENT_TYPE_LABELS } from "@/hooks/useEvents";
import { CreateEventInput } from "@/hooks/useAdminEvents";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

interface EventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Event | null;
  onSubmit: (data: CreateEventInput & { id?: string }) => void;
  isLoading?: boolean;
}

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export function EventForm({ open, onOpenChange, event, onSubmit, isLoading }: EventFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateEventInput>({
    title: "",
    slug: "",
    description: "",
    event_type: "monthly_forum",
    date: "",
    start_time: "",
    end_time: "",
    location: "",
    venue_name: "",
    venue_address: "",
    max_attendees: undefined,
    is_featured: false,
    is_members_only: true,
    registration_deadline: "",
    image_url: "",
    status: "upcoming",
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        slug: event.slug,
        description: event.description,
        event_type: event.event_type,
        date: event.date,
        start_time: event.start_time,
        end_time: event.end_time,
        location: event.location,
        venue_name: event.venue_name || "",
        venue_address: event.venue_address || "",
        max_attendees: event.max_attendees || undefined,
        is_featured: event.is_featured,
        is_members_only: event.is_members_only,
        registration_deadline: event.registration_deadline || "",
        image_url: event.image_url || "",
        status: event.status,
      });
      setImagePreview(event.image_url || null);
    } else {
      setFormData({
        title: "",
        slug: "",
        description: "",
        event_type: "monthly_forum",
        date: "",
        start_time: "",
        end_time: "",
        location: "",
        venue_name: "",
        venue_address: "",
        max_attendees: undefined,
        is_featured: false,
        is_members_only: true,
        registration_deadline: "",
        image_url: "",
        status: "upcoming",
      });
      setImagePreview(null);
    }
  }, [event, open]);

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: !event ? generateSlug(title) : prev.slug,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `events/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      setImagePreview(publicUrl);
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    // If there's an uploaded image URL, try to delete it from storage
    if (formData.image_url && formData.image_url.includes('event-images')) {
      try {
        // Extract file path from URL
        const urlParts = formData.image_url.split('/event-images/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage.from('event-images').remove([filePath]);
        }
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    }

    setFormData(prev => ({ ...prev, image_url: '' }));
    setImagePreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      max_attendees: formData.max_attendees || null,
      registration_deadline: formData.registration_deadline || null,
      image_url: formData.image_url || null,
      venue_name: formData.venue_name || null,
      venue_address: formData.venue_address || null,
    };
    
    if (event) {
      onSubmit({ ...submitData, id: event.id } as CreateEventInput & { id: string });
    } else {
      onSubmit(submitData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "Create New Event"}</DialogTitle>
          <DialogDescription>
            {event ? "Update the event details below." : "Fill in the details to create a new event."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                placeholder="Monthly Forum - January 2026"
              />
            </div>

            <div>
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                required
                placeholder="monthly-forum-january-2026"
              />
            </div>

            <div>
              <Label htmlFor="event_type">Event Type *</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, event_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                rows={3}
                placeholder="Describe the event..."
              />
            </div>

            <div>
              <Label htmlFor="date">Event Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="registration_deadline">Registration Deadline</Label>
              <Input
                id="registration_deadline"
                type="date"
                value={formData.registration_deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, registration_deadline: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                required
                placeholder="Chennai"
              />
            </div>

            <div>
              <Label htmlFor="venue_name">Venue Name</Label>
              <Input
                id="venue_name"
                value={formData.venue_name}
                onChange={(e) => setFormData(prev => ({ ...prev, venue_name: e.target.value }))}
                placeholder="ITC Grand Chola"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="venue_address">Venue Address</Label>
              <Input
                id="venue_address"
                value={formData.venue_address}
                onChange={(e) => setFormData(prev => ({ ...prev, venue_address: e.target.value }))}
                placeholder="63, Mount Road, Guindy, Chennai"
              />
            </div>

            <div>
              <Label htmlFor="max_attendees">Max Attendees</Label>
              <Input
                id="max_attendees"
                type="number"
                value={formData.max_attendees || ""}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  max_attendees: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                placeholder="50"
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Image Upload Section */}
            <div className="col-span-2 space-y-3">
              <Label>Event Image</Label>
              
              {imagePreview ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img 
                    src={imagePreview} 
                    alt="Event preview" 
                    className="w-full h-48 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Uploading...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload an image
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {/* Manual URL input as fallback */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">or</span>
                <Input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, image_url: e.target.value }));
                    setImagePreview(e.target.value || null);
                  }}
                  placeholder="Paste image URL"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
              />
              <Label htmlFor="is_featured">Featured Event</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_members_only"
                checked={formData.is_members_only}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_members_only: checked }))}
              />
              <Label htmlFor="is_members_only">Members Only</Label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || uploading}>
              {isLoading ? "Saving..." : (event ? "Update Event" : "Create Event")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

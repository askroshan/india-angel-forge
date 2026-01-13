import { useState, useEffect } from "react";
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
    }
  }, [event, open]);

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: !event ? generateSlug(title) : prev.slug,
    }));
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

            <div className="col-span-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://example.com/event-image.jpg"
              />
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : (event ? "Update Event" : "Create Event")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

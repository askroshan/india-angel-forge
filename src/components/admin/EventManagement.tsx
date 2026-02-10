/**
 * EventManagement Component
 * 
 * Admin dashboard tab for managing events and viewing registrations.
 * 
 * data-testid trace:
 *   admin-event-card          — Each event card wrapper
 *   toggle-registrations      — Button to expand/collapse registrations
 *   event-registration-count  — Registration count display
 *   registrations-section     — Expanded registrations container
 *   registrations-heading     — "Registrations" heading text
 *   registration-row          — Each registration row
 *   registration-name         — Registrant full name
 *   registration-email        — Registrant email address
 *   registration-status       — Registration status badge
 * 
 * E2E Tests: REG-E2E-003 to REG-E2E-010
 */
import { useState } from "react";
import { format, isValid } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Users, Calendar } from "lucide-react";
import { useAdminEvents, useCreateEvent, useUpdateEvent, useDeleteEvent, useEventRegistrationsList, CreateEventInput } from "@/hooks/useAdminEvents";
import { Event, EVENT_TYPE_LABELS } from "@/hooks/useEvents";
import { EventForm } from "./EventForm";

export function EventManagement() {
  const { data: events, isLoading } = useAdminEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const [formOpen, setFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [viewingRegistrations, setViewingRegistrations] = useState<string | null>(null);

  const { data: registrations } = useEventRegistrationsList(viewingRegistrations || undefined);

  const handleCreate = () => {
    setSelectedEvent(null);
    setFormOpen(true);
  };

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setFormOpen(true);
  };

  const handleDelete = (event: Event) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (eventToDelete) {
      await deleteEvent.mutateAsync(eventToDelete.id);
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };

  const handleSubmit = async (data: CreateEventInput & { id?: string }) => {
    if (data.id) {
      await updateEvent.mutateAsync(data as CreateEventInput & { id: string });
    } else {
      await createEvent.mutateAsync(data);
    }
    setFormOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      upcoming: "default",
      ongoing: "secondary",
      completed: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Event Management</h2>
          <p className="text-muted-foreground">Create, edit, and manage events</p>
        </div>
        <Button onClick={handleCreate} data-testid="create-event-button">
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {!events || events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No events yet. Create your first event!</p>
            <Button onClick={handleCreate} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const regCount = (event as any).registration_count ?? (event as any)._count?.registrations ?? 0;
            return (
            <Card key={event.id} data-testid="admin-event-card">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      {event.is_featured && (
                        <Badge variant="secondary" className="text-xs">Featured</Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-4 flex-wrap">
                      <span>{EVENT_TYPE_LABELS[event.event_type as keyof typeof EVENT_TYPE_LABELS]}</span>
                      <span>•</span>
                      <span>{(() => {
                        const d = new Date(event.eventDate || event.date || '');
                        return isValid(d) ? format(d, "MMMM d, yyyy") : 'Date TBD';
                      })()}</span>
                      <span>•</span>
                      <span>{event.location}</span>
                      <span>•</span>
                      <span data-testid="event-registration-count">
                        {regCount} registered
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(event.status)}
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid="toggle-registrations"
                      onClick={() => setViewingRegistrations(
                        viewingRegistrations === event.id ? null : event.id
                      )}
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(event)} data-testid="edit-event-button">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(event)}
                      data-testid="delete-event-button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {event.description}
                </p>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Time: {event.start_time} - {event.end_time}</span>
                  {event.max_attendees && <span>Max: {event.max_attendees} attendees</span>}
                  {event.is_members_only && <span>Members only</span>}
                </div>

                {viewingRegistrations === event.id && (
                  <div className="mt-4 pt-4 border-t" data-testid="registrations-section">
                    <h4 className="font-semibold mb-3" data-testid="registrations-heading">Registrations</h4>
                    {!registrations || registrations.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No registrations yet</p>
                    ) : (
                      <div className="space-y-2">
                        {registrations.map((reg) => (
                          <div
                            key={reg.id}
                            data-testid="registration-row"
                            className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm"
                          >
                            <div>
                              <span className="font-medium" data-testid="registration-name">{reg.full_name}</span>
                              <span className="text-muted-foreground ml-2" data-testid="registration-email">{reg.email}</span>
                              {reg.company && (
                                <span className="text-muted-foreground ml-2">• {reg.company}</span>
                              )}
                            </div>
                            <Badge
                              variant={reg.status === "registered" ? "default" : "secondary"}
                              data-testid="registration-status"
                            >
                              {reg.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      <EventForm
        open={formOpen}
        onOpenChange={setFormOpen}
        event={selectedEvent}
        onSubmit={handleSubmit}
        isLoading={createEvent.isPending || updateEvent.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{eventToDelete?.title}"? This action cannot be undone.
              All registrations for this event will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

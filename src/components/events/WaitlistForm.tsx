import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useJoinWaitlist } from "@/hooks/useWaitlist";
import { Event } from "@/hooks/useEvents";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CheckCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const waitlistSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  company: z.string().optional(),
});

type WaitlistFormData = z.infer<typeof waitlistSchema>;

interface WaitlistFormProps {
  event: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WaitlistForm({ event, open, onOpenChange }: WaitlistFormProps) {
  const { user } = useAuth();
  const joinWaitlistMutation = useJoinWaitlist();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      fullName: "",
      email: user?.email || "",
      phone: "",
      company: "",
    },
  });

  const onSubmit = async (data: WaitlistFormData) => {
    try {
      await joinWaitlistMutation.mutateAsync({
        eventId: event.id,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        company: data.company,
      });
      setIsSuccess(true);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    form.reset();
    onOpenChange(false);
  };

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in Required</DialogTitle>
            <DialogDescription>
              You need to be signed in to join the waitlist.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button asChild className="flex-1">
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="py-6 space-y-4">
            <div className="relative">
              <Clock className="h-16 w-16 text-amber-500 mx-auto" />
              <CheckCircle className="h-6 w-6 text-green-500 absolute bottom-0 right-1/3" />
            </div>
            <DialogTitle>You're on the Waitlist!</DialogTitle>
            <DialogDescription className="text-base">
              We'll notify you at <strong>{form.getValues('email')}</strong> when a spot opens up for <strong>{event.title}</strong>.
            </DialogDescription>
            <Button onClick={handleClose} className="mt-4">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Join Waitlist for {event.title}
          </DialogTitle>
          <DialogDescription>
            This event is currently sold out. Join the waitlist and we'll notify you when a spot becomes available.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+91 98765 43210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company / Organization</FormLabel>
                  <FormControl>
                    <Input placeholder="Your company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={joinWaitlistMutation.isPending}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                {joinWaitlistMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Join Waitlist
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

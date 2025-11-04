import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const founderApplicationSchema = z.object({
  // Company Information
  company_name: z.string().min(2, "Company name must be at least 2 characters").max(100),
  company_website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  industry_sector: z.string().min(1, "Please select an industry sector"),
  stage: z.enum(["Pre-seed", "Seed", "Series A"]),
  
  // Founder Information
  founder_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  founder_email: z.string().email("Invalid email address"),
  founder_phone: z.string().regex(/^\+?[0-9\s\-()]{10,}$/, "Invalid phone number format"),
  founder_linkedin: z.string().url("Must be a valid LinkedIn URL").optional().or(z.literal("")),
  co_founders: z.string().max(500).optional(),
  
  // Business Details
  founding_date: z.string().optional(),
  team_size: z.string().transform(Number).pipe(z.number().int().positive()).optional().or(z.literal("")),
  location: z.string().min(2, "Location is required"),
  business_model: z.string().min(50, "Please provide at least 50 characters").max(500),
  problem_statement: z.string().min(50, "Please provide at least 50 characters").max(1000),
  solution_description: z.string().min(50, "Please provide at least 50 characters").max(1000),
  target_market: z.string().min(50, "Please provide at least 50 characters").max(500),
  unique_value_proposition: z.string().min(50, "Please provide at least 50 characters").max(500),
  
  // Traction & Financials
  current_revenue: z.string().max(100).optional(),
  monthly_burn_rate: z.string().max(100).optional(),
  customers_count: z.string().max(100).optional(),
  
  // Funding
  previous_funding: z.string().max(500).optional(),
  amount_raising: z.string().min(1, "Please specify the amount you're raising"),
  use_of_funds: z.string().min(100, "Please provide at least 100 characters").max(1000),
  
  // Additional
  pitch_deck_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  video_pitch_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  referral_source: z.string().max(200).optional(),
});

type FounderApplicationFormValues = z.infer<typeof founderApplicationSchema>;

export function FounderApplicationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FounderApplicationFormValues>({
    resolver: zodResolver(founderApplicationSchema),
    defaultValues: {
      stage: "Pre-seed",
    },
  });

  const onSubmit = async (values: FounderApplicationFormValues) => {
    setIsSubmitting(true);
    try {
      const submissionData = {
        company_name: values.company_name,
        company_website: values.company_website || null,
        industry_sector: values.industry_sector,
        stage: values.stage,
        founder_name: values.founder_name,
        founder_email: values.founder_email,
        founder_phone: values.founder_phone,
        founder_linkedin: values.founder_linkedin || null,
        co_founders: values.co_founders || null,
        founding_date: values.founding_date || null,
        team_size: values.team_size ? Number(values.team_size) : null,
        location: values.location,
        business_model: values.business_model,
        problem_statement: values.problem_statement,
        solution_description: values.solution_description,
        target_market: values.target_market,
        unique_value_proposition: values.unique_value_proposition,
        current_revenue: values.current_revenue || null,
        monthly_burn_rate: values.monthly_burn_rate || null,
        customers_count: values.customers_count || null,
        previous_funding: values.previous_funding || null,
        amount_raising: values.amount_raising,
        use_of_funds: values.use_of_funds,
        pitch_deck_url: values.pitch_deck_url || null,
        video_pitch_url: values.video_pitch_url || null,
        referral_source: values.referral_source || null,
      };

      const { error } = await supabase
        .from("founder_applications")
        .insert([submissionData]);

      if (error) throw error;

      toast.success("Application submitted successfully!", {
        description: "We'll review your application and get back to you within 2 weeks.",
      });
      form.reset();
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application", {
        description: "Please try again or contact us directly.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Tell us about your company</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="TechCorp Pvt Ltd" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company_website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Website</FormLabel>
                  <FormControl>
                    <Input placeholder="https://yourcompany.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="industry_sector"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry Sector *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sector" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background">
                      <SelectItem value="AI & Deep Tech">AI & Deep Tech</SelectItem>
                      <SelectItem value="Fintech">Fintech</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="SaaS">SaaS</SelectItem>
                      <SelectItem value="Consumer">Consumer</SelectItem>
                      <SelectItem value="Climate Tech">Climate Tech</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funding Stage *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background">
                      <SelectItem value="Pre-seed">Pre-seed</SelectItem>
                      <SelectItem value="Seed">Seed</SelectItem>
                      <SelectItem value="Series A">Series A</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location *</FormLabel>
                  <FormControl>
                    <Input placeholder="Mumbai, India" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Founder Information */}
        <Card>
          <CardHeader>
            <CardTitle>Founder Information</CardTitle>
            <CardDescription>Information about you and your team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="founder_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Rajesh Kumar" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="founder_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="rajesh@company.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="founder_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="+91 98765 43210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="founder_linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn Profile</FormLabel>
                  <FormControl>
                    <Input placeholder="https://linkedin.com/in/yourprofile" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="co_founders"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Co-Founders</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="List co-founder names and their backgrounds"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="team_size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Size</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="founding_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Founding Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Business Details */}
        <Card>
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
            <CardDescription>Describe your business and value proposition</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="problem_statement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Problem Statement *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What problem are you solving? (min 50 characters)"
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0} / 1000 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="solution_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Solution Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="How does your product/service solve this problem? (min 50 characters)"
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0} / 1000 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target_market"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Market *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Who are your customers? (min 50 characters)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0} / 500 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unique_value_proposition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unique Value Proposition *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What makes you different from competitors? (min 50 characters)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0} / 500 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="business_model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Model *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="How do you make money? (min 50 characters)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0} / 500 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Traction & Financials */}
        <Card>
          <CardHeader>
            <CardTitle>Traction & Financials</CardTitle>
            <CardDescription>Share your current metrics and financial status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="current_revenue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Monthly Revenue</FormLabel>
                  <FormControl>
                    <Input placeholder="₹5 lakhs/month" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="monthly_burn_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Burn Rate</FormLabel>
                  <FormControl>
                    <Input placeholder="₹3 lakhs/month" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customers_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Count</FormLabel>
                  <FormControl>
                    <Input placeholder="500 active users" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Funding */}
        <Card>
          <CardHeader>
            <CardTitle>Funding Information</CardTitle>
            <CardDescription>Details about your funding requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="previous_funding"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Previous Funding</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe any previous funding rounds, amounts, and investors"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount_raising"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Raising *</FormLabel>
                  <FormControl>
                    <Input placeholder="₹2-3 Cr" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="use_of_funds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Use of Funds *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="How will you use the funds? (min 100 characters)"
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0} / 1000 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Supporting materials and references</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="pitch_deck_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pitch Deck URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://drive.google.com/your-pitch-deck" {...field} />
                  </FormControl>
                  <FormDescription>
                    Share a Google Drive, Dropbox, or Docsend link
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="video_pitch_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video Pitch URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://youtube.com/your-pitch-video" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referral_source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How did you hear about us?</FormLabel>
                  <FormControl>
                    <Input placeholder="LinkedIn, Referral, Event, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button 
          type="submit" 
          size="lg" 
          className="w-full" 
          variant="accent"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </Button>
      </form>
    </Form>
  );
}

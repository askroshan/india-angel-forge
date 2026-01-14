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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const investorApplicationSchema = z.object({
  // Personal Information
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[0-9\s\-()]{10,}$/, "Invalid phone number format"),
  linkedin_profile: z.string().url("Must be a valid LinkedIn URL").optional().or(z.literal("")),
  
  // Professional Details
  professional_role: z.string().min(2, "Professional role is required"),
  company_organization: z.string().max(200).optional(),
  years_of_experience: z.string().optional(),
  
  // Investment Profile
  membership_type: z.enum(["Standard Member", "Operator Angel", "Family Office"]),
  investment_thesis: z.string().min(100, "Please provide at least 100 characters").max(1000),
  preferred_sectors: z.array(z.string()).min(1, "Select at least one sector"),
  typical_check_size: z.string().min(1, "Please specify your typical check size"),
  investment_experience: z.string().min(50, "Please provide at least 50 characters").max(1000),
  
  // Accreditation
  net_worth_range: z.string().min(1, "Please select your net worth range"),
  annual_income_range: z.string().min(1, "Please select your annual income range"),
  previous_angel_investments: z.string(),
  portfolio_examples: z.string().max(500).optional(),
  
  // References
  reference_name_1: z.string().max(100).optional(),
  reference_email_1: z.string().email("Invalid email").optional().or(z.literal("")),
  reference_name_2: z.string().max(100).optional(),
  reference_email_2: z.string().email("Invalid email").optional().or(z.literal("")),
  
  // Additional
  how_did_you_hear: z.string().max(200).optional(),
  motivation: z.string().min(100, "Please provide at least 100 characters").max(1000),
});

type InvestorApplicationFormValues = z.infer<typeof investorApplicationSchema>;

export function InvestorApplicationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);

  const sectors = [
    "AI & Deep Tech",
    "Fintech",
    "Healthcare",
    "SaaS",
    "Consumer",
    "Climate Tech",
  ];

  const form = useForm<InvestorApplicationFormValues>({
    resolver: zodResolver(investorApplicationSchema),
    defaultValues: {
      membership_type: "Standard Member",
      preferred_sectors: [],
      previous_angel_investments: "0",
      years_of_experience: "",
    },
  });

  const onSubmit = async (values: InvestorApplicationFormValues) => {
    setIsSubmitting(true);
    try {
      const submissionData = {
        full_name: values.full_name,
        email: values.email,
        phone: values.phone,
        linkedin_profile: values.linkedin_profile || null,
        professional_role: values.professional_role,
        company_organization: values.company_organization || null,
        years_of_experience: values.years_of_experience && values.years_of_experience !== "" 
          ? parseInt(values.years_of_experience, 10) 
          : null,
        membership_type: values.membership_type,
        investment_thesis: values.investment_thesis,
        preferred_sectors: values.preferred_sectors,
        typical_check_size: values.typical_check_size,
        investment_experience: values.investment_experience,
        net_worth_range: values.net_worth_range,
        annual_income_range: values.annual_income_range,
        previous_angel_investments: parseInt(values.previous_angel_investments, 10) || 0,
        portfolio_examples: values.portfolio_examples || null,
        reference_name_1: values.reference_name_1 || null,
        reference_email_1: values.reference_email_1 || null,
        reference_name_2: values.reference_name_2 || null,
        reference_email_2: values.reference_email_2 || null,
        how_did_you_hear: values.how_did_you_hear || null,
        motivation: values.motivation,
      };

      // Submit via edge function for server-side validation and rate limiting
      const { data, error } = await supabase.functions.invoke("submit-investor-application", {
        body: submissionData,
      });

      if (error) throw error;
      
      // Check for application-level errors from edge function
      if (data?.error) {
        if (data.error.includes("already exists")) {
          toast.error("Application already submitted", {
            description: "An application with this email address already exists.",
          });
        } else if (data.error.includes("Too many submissions")) {
          toast.error("Too many attempts", {
            description: "Please wait before submitting another application.",
          });
        } else if (data.details) {
          toast.error("Validation error", {
            description: data.details.join(", "),
          });
        } else {
          throw new Error(data.error);
        }
        return;
      }

      toast.success("Application submitted successfully!", {
        description: "We'll review your application and initiate the KYC process within 1 week.",
      });
      form.reset();
      setSelectedSectors([]);
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
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Priya Sharma" {...field} />
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
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="priya@example.com" {...field} />
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
              name="linkedin_profile"
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
          </CardContent>
        </Card>

        {/* Professional Details */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Details</CardTitle>
            <CardDescription>Your professional background</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="professional_role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Role *</FormLabel>
                  <FormControl>
                    <Input placeholder="CEO, CTO, Angel Investor, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company_organization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company/Organization</FormLabel>
                  <FormControl>
                    <Input placeholder="Your company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="years_of_experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Years of Professional Experience</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="15" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Membership Type */}
        <Card>
          <CardHeader>
            <CardTitle>Membership Type</CardTitle>
            <CardDescription>Choose the membership that fits you</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="membership_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Membership Plan *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background">
                      <SelectItem value="Standard Member">Standard Member (₹60,000/year)</SelectItem>
                      <SelectItem value="Operator Angel">Operator Angel (₹36,000/year)</SelectItem>
                      <SelectItem value="Family Office">Family Office (₹2,50,000/year)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Investment Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Profile</CardTitle>
            <CardDescription>Your investment preferences and experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="preferred_sectors"
              render={() => (
                <FormItem>
                  <FormLabel>Preferred Sectors * (Select all that apply)</FormLabel>
                  <div className="space-y-2">
                    {sectors.map((sector) => (
                      <FormField
                        key={sector}
                        control={form.control}
                        name="preferred_sectors"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={sector}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(sector)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, sector])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== sector
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {sector}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="typical_check_size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Typical Check Size *</FormLabel>
                  <FormControl>
                    <Input placeholder="₹10-25 lakhs" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="investment_thesis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Investment Thesis *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What are you looking for in a startup? What sectors and stages interest you? (min 100 characters)"
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
              name="investment_experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Investment Experience *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your angel investing experience (min 50 characters)"
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

        {/* Accreditation */}
        <Card>
          <CardHeader>
            <CardTitle>Accreditation Information</CardTitle>
            <CardDescription>Required for membership verification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="net_worth_range"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Net Worth Range *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background">
                      <SelectItem value="1-5cr">₹1-5 Crores</SelectItem>
                      <SelectItem value="5-10cr">₹5-10 Crores</SelectItem>
                      <SelectItem value="10-25cr">₹10-25 Crores</SelectItem>
                      <SelectItem value="25-50cr">₹25-50 Crores</SelectItem>
                      <SelectItem value="50cr+">₹50+ Crores</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="annual_income_range"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Income Range *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background">
                      <SelectItem value="25-50L">₹25-50 Lakhs</SelectItem>
                      <SelectItem value="50L-1cr">₹50L - 1 Crore</SelectItem>
                      <SelectItem value="1-2cr">₹1-2 Crores</SelectItem>
                      <SelectItem value="2-5cr">₹2-5 Crores</SelectItem>
                      <SelectItem value="5cr+">₹5+ Crores</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="previous_angel_investments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Previous Angel Investments *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="portfolio_examples"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portfolio Examples</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="List some companies you've invested in (optional)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* References */}
        <Card>
          <CardHeader>
            <CardTitle>References</CardTitle>
            <CardDescription>Professional references (optional but recommended)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-semibold">Reference 1</h4>
              <FormField
                control={form.control}
                name="reference_name_1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Reference name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reference_email_1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="reference@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold">Reference 2</h4>
              <FormField
                control={form.control}
                name="reference_name_2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Reference name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reference_email_2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="reference@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Help us understand you better</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="how_did_you_hear"
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

            <FormField
              control={form.control}
              name="motivation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why do you want to join India Angel Forum? *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What motivates you to become a member? (min 100 characters)"
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

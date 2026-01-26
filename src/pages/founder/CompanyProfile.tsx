import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Building,
  Clock,
  Save,
  Globe,
  Users,
  Calendar
} from 'lucide-react';

interface CompanyProfile {
  id?: string;
  company_name: string;
  description: string;
  industry: string;
  stage: string;
  founded_year?: number;
  team_size?: number;
  website?: string;
  linkedin?: string;
  twitter?: string;
  location?: string;
}

export default function CompanyProfile() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<CompanyProfile>({
    company_name: '',
    description: '',
    industry: '',
    stage: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('founder_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
      }

    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile.company_name || !profile.description) {
      alert('Please fill in company name and description');
      return;
    }

    try {
      setSaving(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (profile.id) {
        // Update existing profile
        const { error } = await supabase
          .from('company_profiles')
          .update({
            company_name: profile.company_name,
            description: profile.description,
            industry: profile.industry,
            stage: profile.stage,
            founded_year: profile.founded_year,
            team_size: profile.team_size,
            website: profile.website,
            linkedin: profile.linkedin,
            twitter: profile.twitter,
            location: profile.location,
          })
          .eq('id', profile.id);

        if (error) {
          console.error('Error updating profile:', error);
          alert('Failed to update profile');
          return;
        }
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('company_profiles')
          .insert({
            founder_id: session.user.id,
            company_name: profile.company_name,
            description: profile.description,
            industry: profile.industry,
            stage: profile.stage,
            founded_year: profile.founded_year,
            team_size: profile.team_size,
            website: profile.website,
            linkedin: profile.linkedin,
            twitter: profile.twitter,
            location: profile.location,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating profile:', error);
          alert('Failed to create profile');
          return;
        }

        if (data) {
          setProfile(data);
        }
      }

      alert('Profile saved successfully!');

    } catch (err) {
      console.error('Error:', err);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (field: keyof CompanyProfile, value: any) => {
    setProfile({ ...profile, [field]: value });
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Company Profile</h1>
            <p className="text-muted-foreground">
              Manage your company information
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>

        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Building className="h-5 w-5" />
            Basic Information
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={profile.company_name}
                onChange={(e) => updateProfile('company_name', e.target.value)}
                placeholder="TechStartup Inc"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={profile.description}
                onChange={(e) => updateProfile('description', e.target.value)}
                placeholder="Describe your company's mission and what you do..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={profile.industry}
                  onValueChange={(value) => updateProfile('industry', value)}
                >
                  <SelectTrigger id="industry">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="FinTech">FinTech</SelectItem>
                    <SelectItem value="HealthTech">HealthTech</SelectItem>
                    <SelectItem value="EdTech">EdTech</SelectItem>
                    <SelectItem value="E-commerce">E-commerce</SelectItem>
                    <SelectItem value="SaaS">SaaS</SelectItem>
                    <SelectItem value="Consumer">Consumer</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage">Funding Stage</Label>
                <Select
                  value={profile.stage}
                  onValueChange={(value) => updateProfile('stage', value)}
                >
                  <SelectTrigger id="stage">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pre-Seed">Pre-Seed</SelectItem>
                    <SelectItem value="Seed">Seed</SelectItem>
                    <SelectItem value="Series A">Series A</SelectItem>
                    <SelectItem value="Series B">Series B</SelectItem>
                    <SelectItem value="Series C+">Series C+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={profile.location || ''}
                onChange={(e) => updateProfile('location', e.target.value)}
                placeholder="Bangalore, India"
              />
            </div>
          </div>
        </Card>

        {/* Company Details */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Company Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="founded_year">Founded Year</Label>
              <Input
                id="founded_year"
                type="number"
                value={profile.founded_year || ''}
                onChange={(e) => updateProfile('founded_year', parseInt(e.target.value) || undefined)}
                placeholder="2022"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team_size">Team Size</Label>
              <Input
                id="team_size"
                type="number"
                value={profile.team_size || ''}
                onChange={(e) => updateProfile('team_size', parseInt(e.target.value) || undefined)}
                placeholder="15"
                min="1"
              />
            </div>
          </div>
        </Card>

        {/* Online Presence */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Online Presence
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={profile.website || ''}
                onChange={(e) => updateProfile('website', e.target.value)}
                placeholder="https://yourcompany.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                type="url"
                value={profile.linkedin || ''}
                onChange={(e) => updateProfile('linkedin', e.target.value)}
                placeholder="https://linkedin.com/company/yourcompany"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter/X</Label>
              <Input
                id="twitter"
                type="url"
                value={profile.twitter || ''}
                onChange={(e) => updateProfile('twitter', e.target.value)}
                placeholder="https://twitter.com/yourcompany"
              />
            </div>
          </div>
        </Card>

        {/* Save Button (Bottom) */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>
    </div>
  );
}

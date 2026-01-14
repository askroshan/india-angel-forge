-- Create private storage buckets for sensitive documents
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('kyc-documents', 'kyc-documents', false),
  ('pitch-materials', 'pitch-materials', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for kyc-documents bucket (PAN, Aadhaar, bank statements)

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own KYC docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own KYC documents
CREATE POLICY "Users can view own KYC docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own KYC documents
CREATE POLICY "Users can update own KYC docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own KYC documents
CREATE POLICY "Users can delete own KYC docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can view all KYC documents
CREATE POLICY "Admins can view all KYC docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can manage all KYC documents
CREATE POLICY "Admins can manage all KYC docs"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'kyc-documents'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- RLS Policies for pitch-materials bucket (pitch decks, video pitches)

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own pitch materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pitch-materials'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own pitch materials
CREATE POLICY "Users can view own pitch materials"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pitch-materials'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own pitch materials
CREATE POLICY "Users can update own pitch materials"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pitch-materials'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own pitch materials
CREATE POLICY "Users can delete own pitch materials"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pitch-materials'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can view all pitch materials
CREATE POLICY "Admins can view all pitch materials"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pitch-materials'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can manage all pitch materials
CREATE POLICY "Admins can manage all pitch materials"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'pitch-materials'
  AND public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'pitch-materials'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);
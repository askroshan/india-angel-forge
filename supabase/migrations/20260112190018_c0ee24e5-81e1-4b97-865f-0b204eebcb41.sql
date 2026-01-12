-- Admin SELECT policies
CREATE POLICY "Admins can view all founder applications"
ON public.founder_applications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all investor applications"
ON public.investor_applications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin UPDATE policies
CREATE POLICY "Admins can update founder applications"
ON public.founder_applications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update investor applications"
ON public.investor_applications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin DELETE policies
CREATE POLICY "Admins can delete founder applications"
ON public.founder_applications
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete investor applications"
ON public.investor_applications
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
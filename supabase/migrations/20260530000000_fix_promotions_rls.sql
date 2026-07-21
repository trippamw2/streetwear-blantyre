-- Fix promotions RLS for admin access
-- Drop restrictive policies
DROP POLICY IF EXISTS "Public read active promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins manage promotions" ON public.promotions;

-- Allow anyone to read active promotions (for public slider)
CREATE POLICY "promotions_read_active" ON public.promotions
  FOR SELECT USING (is_active = true);

-- Allow authenticated users to insert/update/delete
CREATE POLICY "promotions_manage_all" ON public.promotions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));
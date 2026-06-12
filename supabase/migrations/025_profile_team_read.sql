-- Allow restaurant members to read all profiles in their restaurant
-- (required for Team page to show all staff)
CREATE POLICY "profile_restaurant_read" ON public.profiles
  FOR SELECT USING (
    restaurant_id = public.my_restaurant_id()
  );

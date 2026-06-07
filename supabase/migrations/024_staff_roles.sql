-- Expand staff roles beyond owner/chef so owners can assign more specific roles when inviting

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('owner', 'manager', 'head_chef', 'chef', 'foh'));

ALTER TABLE public.invites DROP CONSTRAINT IF EXISTS invites_role_check;
ALTER TABLE public.invites ADD CONSTRAINT invites_role_check
  CHECK (role IN ('owner', 'manager', 'head_chef', 'chef', 'foh'));

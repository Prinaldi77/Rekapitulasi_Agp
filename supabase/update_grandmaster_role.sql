-- UPDATE ROLE GRAND MASTER DI TABEL PROFILES
UPDATE public.profiles 
SET role = 'GRAND_MASTER', full_name = 'Sekretaris Utama AGP (Grand Master)'
WHERE username = 'grandmaster' OR id = 'f66d0746-0209-4676-b50c-50a01def36f9';

-- JIKA PROFIL BELUM ADA, INSERT OTOMATIS:
INSERT INTO public.profiles (id, username, full_name, role)
SELECT id, 'grandmaster', 'Sekretaris Utama AGP (Grand Master)', 'GRAND_MASTER'::public.user_role
FROM auth.users WHERE email = 'grandmaster@agp.local'
ON CONFLICT (id) DO UPDATE SET role = 'GRAND_MASTER'::public.user_role;

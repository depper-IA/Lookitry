-- Migration: Create authors table and link to blogs
-- Purpose: EEAT compliance - real human authors with Person schema
-- Date: 2026-07-02
-- IMPORTANT: First drop the pre-existing FK to brands table

BEGIN;

-- 1. Drop existing FK constraint that incorrectly points to brands table
ALTER TABLE public.blogs DROP CONSTRAINT IF EXISTS blogs_author_id_fkey;

-- 2. Drop author_id column if it exists (will be recreated fresh)
ALTER TABLE public.blogs DROP COLUMN IF EXISTS author_id;

-- 3. Create authors table
CREATE TABLE IF NOT EXISTS public.authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  expertise TEXT[] DEFAULT ARRAY[]::TEXT[],
  credentials TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_authors_slug ON public.authors(slug);
CREATE INDEX IF NOT EXISTS idx_authors_is_active ON public.authors(is_active);

-- 4. Insert Sam Wilkie (Founder & Full Stack Developer)
INSERT INTO public.authors (slug, name, role, bio, avatar_url, social_links, expertise, credentials)
VALUES (
  'sam-wilkie',
  'Sam Wilkie',
  'Full Stack Developer & Founder',
  'Fundador y CTO de Lookitry. Venezolano, especialista en arquitectura de software y soluciones de IA escalables. Más de 10 años de experiencia construyendo productos SaaS B2B para el mercado global, con foco en computer vision aplicada al e-commerce de moda.',
  '/team/sam.webp',
  jsonb_build_object(
    'linkedin', 'https://www.linkedin.com/in/samu-wilkie/',
    'instagram', 'https://www.instagram.com/wilkie_design/',
    'github', 'https://github.com/depper-IA',
    'behance', 'https://www.behance.net/samuelwilkie'
  ),
  ARRAY['Inteligencia Artificial', 'Arquitectura de Software', 'Computer Vision', 'E-commerce', 'SaaS B2B', 'DevOps'],
  'Fundador y CTO de Lookitry. +10 años en desarrollo de software y soluciones de IA. Habla español e inglés.'
)
ON CONFLICT (slug) DO UPDATE SET
  role = EXCLUDED.role,
  bio = EXCLUDED.bio,
  avatar_url = EXCLUDED.avatar_url,
  social_links = EXCLUDED.social_links,
  expertise = EXCLUDED.expertise,
  credentials = EXCLUDED.credentials,
  updated_at = now();

-- 5. Insert Melissa Urbano (Junior Front-End Developer)
INSERT INTO public.authors (slug, name, role, bio, avatar_url, social_links, expertise, credentials)
VALUES (
  'melissa-urbano',
  'Melissa Urbano',
  'Junior Front-End Developer',
  'Desarrolladora frontend colombiana. Encargada de la evolución estética, accesibilidad y experiencia de usuario en Lookitry. Apasionada por crear interfaces modernas, inclusivas y de alto rendimiento con React y Next.js.',
  '/team/juli.webp',
  jsonb_build_object(
    'linkedin', 'https://www.linkedin.com/in/juliana-urbano-69b13939b/',
    'behance', 'https://www.behance.net/ummell',
    'github', 'https://github.com/ummell'
  ),
  ARRAY['Frontend Development', 'UX/UI Design', 'React', 'Next.js', 'Accesibilidad Web', 'Design Systems'],
  'Frontend Developer en Lookitry. Especialista en interfaces accesibles (WCAG) y de alto rendimiento.'
)
ON CONFLICT (slug) DO UPDATE SET
  role = EXCLUDED.role,
  bio = EXCLUDED.bio,
  avatar_url = EXCLUDED.avatar_url,
  social_links = EXCLUDED.social_links,
  expertise = EXCLUDED.expertise,
  credentials = EXCLUDED.credentials,
  updated_at = now();

-- 6. Add author_id column to blogs (fresh, with FK to authors)
ALTER TABLE public.blogs ADD COLUMN author_id UUID REFERENCES public.authors(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_blogs_author_id ON public.blogs(author_id);

-- 7. Populate existing articles: alternate between Sam (odd) and Melissa (even)
-- Starting with newest articles assigned to Sam
DO $$
DECLARE
  article_record RECORD;
  sam_id UUID;
  melissa_id UUID;
  counter INTEGER := 0;
BEGIN
  SELECT id INTO sam_id FROM public.authors WHERE slug = 'sam-wilkie';
  SELECT id INTO melissa_id FROM public.authors WHERE slug = 'melissa-urbano';

  FOR article_record IN
    SELECT id FROM public.blogs
    WHERE author_id IS NULL AND status = 'published'
    ORDER BY COALESCE(published_at, created_at) DESC
  LOOP
    counter := counter + 1;
    IF counter % 2 = 1 THEN
      UPDATE public.blogs SET author_id = sam_id WHERE id = article_record.id;
    ELSE
      UPDATE public.blogs SET author_id = melissa_id WHERE id = article_record.id;
    END IF;
  END LOOP;
END $$;

-- 8. RLS Policies
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_active_authors" ON public.authors;
CREATE POLICY "public_read_active_authors" ON public.authors
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "service_role_all_authors" ON public.authors;
CREATE POLICY "service_role_all_authors" ON public.authors
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

COMMIT;

-- Verification
SELECT slug, name, role FROM public.authors ORDER BY slug;
SELECT COUNT(*) AS articles_with_author FROM public.blogs WHERE author_id IS NOT NULL;
SELECT a.name AS author, COUNT(b.id) AS article_count
FROM public.authors a
LEFT JOIN public.blogs b ON b.author_id = a.id AND b.status = 'published'
GROUP BY a.id, a.name
ORDER BY a.name;
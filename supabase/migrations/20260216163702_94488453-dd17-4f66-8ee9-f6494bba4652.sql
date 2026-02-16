
-- Create cms_pages table for About, Blog, Gallery content
CREATE TABLE public.cms_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  page_type TEXT NOT NULL DEFAULT 'page',
  is_published BOOLEAN NOT NULL DEFAULT false,
  featured_image TEXT,
  excerpt TEXT,
  meta_description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cms_gallery table for gallery images
CREATE TABLE public.cms_gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_gallery ENABLE ROW LEVEL SECURITY;

-- Public read for published content
CREATE POLICY "Anyone can view published cms pages" ON public.cms_pages
  FOR SELECT USING (is_published = true);

CREATE POLICY "Super admins can CRUD cms_pages" ON public.cms_pages
  FOR ALL USING (is_super_admin());

CREATE POLICY "Anyone can view published gallery items" ON public.cms_gallery
  FOR SELECT USING (is_published = true);

CREATE POLICY "Super admins can CRUD cms_gallery" ON public.cms_gallery
  FOR ALL USING (is_super_admin());

-- Create storage bucket for CMS images
INSERT INTO storage.buckets (id, name, public) VALUES ('cms-images', 'cms-images', true);

-- Storage policies for CMS images
CREATE POLICY "Anyone can view cms images" ON storage.objects
  FOR SELECT USING (bucket_id = 'cms-images');

CREATE POLICY "Super admins can upload cms images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'cms-images' AND is_super_admin());

CREATE POLICY "Super admins can update cms images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'cms-images' AND is_super_admin());

CREATE POLICY "Super admins can delete cms images" ON storage.objects
  FOR DELETE USING (bucket_id = 'cms-images' AND is_super_admin());

-- Trigger for updated_at
CREATE TRIGGER update_cms_pages_updated_at
  BEFORE UPDATE ON public.cms_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cms_gallery_updated_at
  BEFORE UPDATE ON public.cms_gallery
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add likes_count and shares_count columns to cms_pages
ALTER TABLE public.cms_pages ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.cms_pages ADD COLUMN IF NOT EXISTS shares_count integer NOT NULL DEFAULT 0;

-- Create blog_post_likes table
CREATE TABLE IF NOT EXISTS public.blog_post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.cms_pages(id) ON DELETE CASCADE,
  visitor_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, visitor_id)
);

-- Enable RLS
ALTER TABLE public.blog_post_likes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read likes
CREATE POLICY "Anyone can read blog likes"
  ON public.blog_post_likes FOR SELECT
  USING (true);

-- Allow anyone to insert a like (anonymous)
CREATE POLICY "Anyone can insert blog likes"
  ON public.blog_post_likes FOR INSERT
  WITH CHECK (true);

-- Allow anyone to delete their own like (unlike)
CREATE POLICY "Anyone can delete own blog likes"
  ON public.blog_post_likes FOR DELETE
  USING (true);

-- Trigger function to increment likes_count on cms_pages
CREATE OR REPLACE FUNCTION public.increment_blog_likes_count()
RETURNS trigger AS $$
BEGIN
  UPDATE public.cms_pages
  SET likes_count = likes_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to decrement likes_count on cms_pages
CREATE OR REPLACE FUNCTION public.decrement_blog_likes_count()
RETURNS trigger AS $$
BEGIN
  UPDATE public.cms_pages
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trg_increment_blog_likes ON public.blog_post_likes;
CREATE TRIGGER trg_increment_blog_likes
  AFTER INSERT ON public.blog_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_blog_likes_count();

DROP TRIGGER IF EXISTS trg_decrement_blog_likes ON public.blog_post_likes;
CREATE TRIGGER trg_decrement_blog_likes
  AFTER DELETE ON public.blog_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_blog_likes_count();

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_blog_post_likes_post_id ON public.blog_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_likes_visitor ON public.blog_post_likes(post_id, visitor_id);

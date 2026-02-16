import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AboutPage() {
  const { data: page, isLoading } = useQuery({
    queryKey: ['cms-about'],
    queryFn: async () => {
      const { data } = await supabase.from('cms_pages').select('*').eq('slug', 'about').eq('is_published', true).single();
      return data;
    },
  });

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!page) return <div className="p-12 text-center text-muted-foreground">About page not available.</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">{page.title}</h1>
      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: page.content || '' }} />
    </div>
  );
}

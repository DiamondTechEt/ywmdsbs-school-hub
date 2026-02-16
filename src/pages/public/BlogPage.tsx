import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function BlogPage() {
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['cms-blog-public'],
    queryFn: async () => {
      const { data } = await supabase.from('cms_pages').select('*').eq('page_type', 'blog').eq('is_published', true).order('created_at', { ascending: false });
      return data || [];
    },
  });

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  if (selectedPost) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <button onClick={() => setSelectedPost(null)} className="text-sm text-muted-foreground hover:underline mb-4">← Back to Blog</button>
        <h1 className="text-3xl font-bold mb-2">{selectedPost.title}</h1>
        <p className="text-sm text-muted-foreground mb-6">{new Date(selectedPost.created_at).toLocaleDateString()}</p>
        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: selectedPost.content || '' }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Blog</h1>
      {posts && posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post: any) => (
            <Card key={post.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedPost(post)}>
              <CardHeader>
                <CardTitle>{post.title}</CardTitle>
                <CardDescription>{new Date(post.created_at).toLocaleDateString()}</CardDescription>
              </CardHeader>
              {post.excerpt && <CardContent><p className="text-muted-foreground">{post.excerpt}</p></CardContent>}
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-8">No blog posts yet.</p>
      )}
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Calendar, BookOpen } from 'lucide-react';
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

  if (selectedPost) {
    return (
      <PublicLayout>
        <article className="container mx-auto px-4 md:px-6 py-8 md:py-16 max-w-3xl">
          <Button variant="ghost" size="sm" onClick={() => setSelectedPost(null)} className="mb-6 text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>
          {selectedPost.featured_image && (
            <img src={selectedPost.featured_image} alt={selectedPost.title} className="w-full h-64 md:h-80 object-cover rounded-2xl mb-8" />
          )}
          <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{new Date(selectedPost.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-6">{selectedPost.title}</h1>
          <div className="prose prose-sm max-w-none prose-headings:text-primary prose-a:text-primary" dangerouslySetInnerHTML={{ __html: selectedPost.content || '' }} />
        </article>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-primary/5 py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-primary/20">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-3">School Blog</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            News, events, and stories from our school community.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : posts && posts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: any) => (
              <Card
                key={post.id}
                className="cursor-pointer group hover:shadow-lg transition-all duration-300 border-primary/10 overflow-hidden"
                onClick={() => setSelectedPost(post)}
              >
                {post.featured_image && (
                  <div className="h-48 overflow-hidden">
                    <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">{post.title}</CardTitle>
                </CardHeader>
                {post.excerpt && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">No blog posts yet</h3>
            <p className="text-sm text-muted-foreground/60 mt-1">Check back soon for updates from our school.</p>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}

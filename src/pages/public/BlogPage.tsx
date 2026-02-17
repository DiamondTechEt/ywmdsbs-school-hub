import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar, BookOpen, Search, Heart } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'popular'>('newest');

  const { data: posts, isLoading } = useQuery({
    queryKey: ['cms-blog-public'],
    queryFn: async () => {
      const { data } = await supabase
        .from('cms_pages')
        .select('*')
        .eq('page_type', 'blog')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    let result = [...posts];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.excerpt && p.excerpt.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortOrder === 'newest') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortOrder === 'oldest') {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortOrder === 'popular') {
      result.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    }

    return result;
  }, [posts, searchQuery, sortOrder]);

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

      {/* Search & Filter Bar */}
      <section className="container mx-auto px-4 md:px-6 pt-8 md:pt-12">
        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Posts */}
      <section className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post: any) => (
              <Link to={`/blog/${post.slug}`} key={post.id} className="block">
                <Card className="cursor-pointer group hover:shadow-lg transition-all duration-300 border-primary/10 overflow-hidden h-full">
                  {post.featured_image && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      {(post.likes_count || 0) > 0 && (
                        <div className="flex items-center gap-1 text-red-400">
                          <Heart className="h-3 w-3 fill-red-400" />
                          <span>{post.likes_count}</span>
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  {post.excerpt && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            {searchQuery ? (
              <>
                <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">No matching posts</h3>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  Try a different search term or clear your filter.
                </p>
              </>
            ) : (
              <>
                <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">No blog posts yet</h3>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  Check back soon for updates from our school.
                </p>
              </>
            )}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}

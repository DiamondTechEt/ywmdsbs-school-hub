import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Calendar, Heart, Share2, Copy, Check, Eye } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

function getVisitorId(): string {
    const key = 'ywmdsbs_visitor_id';
    let id = localStorage.getItem(key);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(key, id);
    }
    return id;
}

function getLikedPosts(): Set<string> {
    try {
        const raw = localStorage.getItem('ywmdsbs_liked_posts');
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
        return new Set();
    }
}

function saveLikedPosts(set: Set<string>) {
    localStorage.setItem('ywmdsbs_liked_posts', JSON.stringify([...set]));
}

export default function BlogPostPage() {
    const { slug } = useParams<{ slug: string }>();
    const queryClient = useQueryClient();
    const [isLiked, setIsLiked] = useState(false);
    const [localLikes, setLocalLikes] = useState(0);
    const [localShares, setLocalShares] = useState(0);
    const [copied, setCopied] = useState(false);

    const { data: post, isLoading } = useQuery({
        queryKey: ['cms-blog-post', slug],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cms_pages')
                .select('*')
                .eq('slug', slug!)
                .eq('page_type', 'blog')
                .eq('is_published', true)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!slug,
    });

    useEffect(() => {
        if (post) {
            setLocalLikes(post.likes_count || 0);
            setLocalShares(post.shares_count || 0);
            setIsLiked(getLikedPosts().has(post.id));
        }
    }, [post]);

    const likeMutation = useMutation({
        mutationFn: async (postId: string) => {
            const visitorId = getVisitorId();
            const { error } = await supabase
                .from('blog_post_likes')
                .insert({ post_id: postId, visitor_id: visitorId });
            if (error) throw error;
        },
        onSuccess: () => {
            if (post) {
                const liked = getLikedPosts();
                liked.add(post.id);
                saveLikedPosts(liked);
                setIsLiked(true);
                setLocalLikes(prev => prev + 1);
                queryClient.invalidateQueries({ queryKey: ['cms-blog-post', slug] });
            }
        },
        onError: (err: any) => {
            if (err.message?.includes('duplicate') || err.code === '23505') {
                toast.info('You already liked this post!');
            } else {
                toast.error('Could not like this post.');
            }
        },
    });

    const unlikeMutation = useMutation({
        mutationFn: async (postId: string) => {
            const visitorId = getVisitorId();
            const { error } = await supabase
                .from('blog_post_likes')
                .delete()
                .eq('post_id', postId)
                .eq('visitor_id', visitorId);
            if (error) throw error;
        },
        onSuccess: () => {
            if (post) {
                const liked = getLikedPosts();
                liked.delete(post.id);
                saveLikedPosts(liked);
                setIsLiked(false);
                setLocalLikes(prev => Math.max(prev - 1, 0));
                queryClient.invalidateQueries({ queryKey: ['cms-blog-post', slug] });
            }
        },
        onError: () => {
            toast.error('Could not unlike this post.');
        },
    });

    const handleToggleLike = useCallback(() => {
        if (!post || likeMutation.isPending || unlikeMutation.isPending) return;
        if (isLiked) {
            unlikeMutation.mutate(post.id);
        } else {
            likeMutation.mutate(post.id);
        }
    }, [post, isLiked, likeMutation, unlikeMutation]);

    const incrementShareCount = useCallback(async () => {
        if (!post) return;
        setLocalShares(prev => prev + 1);
        // Fire-and-forget: increment shares_count in the database
        await supabase
            .from('cms_pages')
            .update({ shares_count: (post.shares_count || 0) + 1 })
            .eq('id', post.id);
        queryClient.invalidateQueries({ queryKey: ['cms-blog-post', slug] });
    }, [post, slug, queryClient]);

    const handleShare = useCallback(async () => {
        const url = window.location.href;
        const shareData = {
            title: post?.title || 'Blog Post',
            text: post?.excerpt || 'Check out this blog post!',
            url,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                await incrementShareCount();
            } catch {
                // user cancelled share
            }
        } else {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success('Link copied to clipboard!');
            await incrementShareCount();
            setTimeout(() => setCopied(false), 2000);
        }
    }, [post, incrementShareCount]);

    if (isLoading) {
        return (
            <PublicLayout>
                <div className="flex justify-center items-center py-32">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            </PublicLayout>
        );
    }

    if (!post) {
        return (
            <PublicLayout>
                <div className="container mx-auto px-4 py-24 text-center">
                    <h1 className="text-3xl font-serif font-bold text-primary mb-4">Post Not Found</h1>
                    <p className="text-muted-foreground mb-6">The blog post you're looking for doesn't exist or has been removed.</p>
                    <Button asChild variant="outline">
                        <Link to="/blog">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Blog
                        </Link>
                    </Button>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            <article className="container mx-auto px-4 md:px-6 py-8 md:py-16 max-w-3xl">
                {/* Back + Meta */}
                <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                        <Link to="/blog">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Blog
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleShare}
                            className="text-muted-foreground hover:text-primary"
                        >
                            {copied ? <Check className="h-4 w-4 mr-1" /> : <Share2 className="h-4 w-4 mr-1" />}
                            {copied ? 'Copied!' : 'Share'}
                        </Button>
                    </div>
                </div>

                {/* Featured Image */}
                {post.featured_image && (
                    <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-64 md:h-80 object-cover rounded-2xl mb-8"
                    />
                )}

                {/* Date + Stats */}
                <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                            {new Date(post.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <Heart className={`h-3.5 w-3.5 ${localLikes > 0 ? 'fill-red-400 text-red-400' : ''}`} />
                            <span>{localLikes} {localLikes === 1 ? 'like' : 'likes'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Share2 className="h-3.5 w-3.5" />
                            <span>{localShares} {localShares === 1 ? 'share' : 'shares'}</span>
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-6">
                    {post.title}
                </h1>

                {/* Content */}
                <div
                    className="prose prose-sm max-w-none prose-headings:text-primary prose-a:text-primary"
                    dangerouslySetInnerHTML={{ __html: post.content || '' }}
                />

                {/* Like + Share Bar */}
                <div className="mt-12 pt-8 border-t flex items-center justify-between">
                    <button
                        onClick={handleToggleLike}
                        disabled={likeMutation.isPending || unlikeMutation.isPending}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 text-sm font-medium ${isLiked
                                ? 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100'
                                : 'bg-muted/50 text-muted-foreground hover:bg-red-50 hover:text-red-500 border border-transparent hover:border-red-200'
                            }`}
                    >
                        <Heart
                            className={`h-5 w-5 transition-all duration-300 ${isLiked ? 'fill-red-500 text-red-500 scale-110' : ''
                                }`}
                        />
                        <span>{localLikes}</span>
                        <span className="hidden sm:inline">{isLiked ? 'Unlike' : 'Like'}</span>
                    </button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShare}
                        className="rounded-full px-5"
                    >
                        {copied ? <Check className="h-4 w-4 mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
                        {copied ? 'Copied!' : 'Share'}
                        {localShares > 0 && <span className="ml-1 text-xs opacity-70">({localShares})</span>}
                    </Button>
                </div>
            </article>
        </PublicLayout>
    );
}

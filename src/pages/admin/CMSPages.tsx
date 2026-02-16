import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { RichTextEditor } from '@/components/shared/RichTextEditor';
import { Plus, Edit, Trash2, Loader2, FileText, Image as ImageIcon, Eye } from 'lucide-react';

export default function CMSPages() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('about');
  const [isEditing, setIsEditing] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [isGalleryDialogOpen, setIsGalleryDialogOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<any>(null);
  const [galleryForm, setGalleryForm] = useState({ title: '', description: '', image_url: '', category: 'general' });
  const [pageForm, setPageForm] = useState({ title: '', slug: '', content: '', excerpt: '', is_published: false, page_type: 'page' });
  const [uploading, setUploading] = useState(false);

  // Fetch pages
  const { data: pages, isLoading: pagesLoading } = useQuery({
    queryKey: ['cms-pages'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cms_pages').select('*').order('sort_order');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch gallery
  const { data: gallery, isLoading: galleryLoading } = useQuery({
    queryKey: ['cms-gallery'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cms_gallery').select('*').order('sort_order');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch blog posts
  const { data: blogPosts } = useQuery({
    queryKey: ['cms-blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cms_pages').select('*').eq('page_type', 'blog').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const savePage = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) {
        const { error } = await supabase.from('cms_pages').update({
          title: data.title, slug: data.slug, content: data.content,
          excerpt: data.excerpt, is_published: data.is_published, page_type: data.page_type,
        }).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cms_pages').insert({
          title: data.title, slug: data.slug, content: data.content,
          excerpt: data.excerpt, is_published: data.is_published, page_type: data.page_type,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Page saved');
      setIsEditing(false);
      setEditingPage(null);
      queryClient.invalidateQueries({ queryKey: ['cms-pages'] });
      queryClient.invalidateQueries({ queryKey: ['cms-blog-posts'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deletePage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cms_pages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Page deleted');
      queryClient.invalidateQueries({ queryKey: ['cms-pages'] });
      queryClient.invalidateQueries({ queryKey: ['cms-blog-posts'] });
    },
  });

  const saveGalleryItem = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) {
        const { error } = await supabase.from('cms_gallery').update({
          title: data.title, description: data.description, image_url: data.image_url, category: data.category,
        }).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cms_gallery').insert({
          title: data.title, description: data.description, image_url: data.image_url, category: data.category,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Gallery item saved');
      setIsGalleryDialogOpen(false);
      setEditingGallery(null);
      setGalleryForm({ title: '', description: '', image_url: '', category: 'general' });
      queryClient.invalidateQueries({ queryKey: ['cms-gallery'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteGalleryItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cms_gallery').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Gallery item deleted');
      queryClient.invalidateQueries({ queryKey: ['cms-gallery'] });
    },
  });

  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `gallery/${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('cms-images').upload(fileName, file, { cacheControl: '3600' });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('cms-images').getPublicUrl(data.path);
      setGalleryForm(prev => ({ ...prev, image_url: publicUrl }));
      toast.success('Image uploaded');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const openEditPage = (page: any) => {
    setEditingPage(page);
    setPageForm({
      title: page.title, slug: page.slug, content: page.content || '',
      excerpt: page.excerpt || '', is_published: page.is_published, page_type: page.page_type,
    });
    setIsEditing(true);
  };

  const openNewPage = (type: string) => {
    setEditingPage(null);
    setPageForm({ title: '', slug: '', content: '', excerpt: '', is_published: false, page_type: type });
    setIsEditing(true);
  };

  const openEditGallery = (item: any) => {
    setEditingGallery(item);
    setGalleryForm({ title: item.title, description: item.description || '', image_url: item.image_url, category: item.category || 'general' });
    setIsGalleryDialogOpen(true);
  };

  const aboutPage = pages?.find(p => p.slug === 'about' && p.page_type === 'page');

  if (isEditing) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{editingPage ? 'Edit' : 'New'} {pageForm.page_type === 'blog' ? 'Blog Post' : 'Page'}</h1>
          <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={pageForm.title} onChange={e => setPageForm(p => ({ ...p, title: e.target.value, slug: p.slug || e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={pageForm.slug} onChange={e => setPageForm(p => ({ ...p, slug: e.target.value }))} />
            </div>
          </div>
          {pageForm.page_type === 'blog' && (
            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Input value={pageForm.excerpt} onChange={e => setPageForm(p => ({ ...p, excerpt: e.target.value }))} placeholder="Short summary..." />
            </div>
          )}
          <div className="space-y-2">
            <Label>Content</Label>
            <RichTextEditor content={pageForm.content} onChange={content => setPageForm(p => ({ ...p, content }))} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={pageForm.is_published} onCheckedChange={v => setPageForm(p => ({ ...p, is_published: v }))} />
            <Label>Published</Label>
          </div>
          <Button onClick={() => savePage.mutate({ ...pageForm, id: editingPage?.id })} disabled={savePage.isPending || !pageForm.title}>
            {savePage.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save {pageForm.page_type === 'blog' ? 'Post' : 'Page'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Content Management</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="about"><FileText className="h-4 w-4 mr-2" />About Page</TabsTrigger>
          <TabsTrigger value="blog"><FileText className="h-4 w-4 mr-2" />Blog</TabsTrigger>
          <TabsTrigger value="gallery"><ImageIcon className="h-4 w-4 mr-2" />Gallery</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>About Page</CardTitle>
              {aboutPage ? (
                <Button onClick={() => openEditPage(aboutPage)}><Edit className="mr-2 h-4 w-4" />Edit</Button>
              ) : (
                <Button onClick={() => { setEditingPage(null); setPageForm({ title: 'About Us', slug: 'about', content: '', excerpt: '', is_published: false, page_type: 'page' }); setIsEditing(true); }}>
                  <Plus className="mr-2 h-4 w-4" />Create About Page
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {aboutPage ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant={aboutPage.is_published ? 'default' : 'secondary'}>{aboutPage.is_published ? 'Published' : 'Draft'}</Badge>
                    <span className="text-sm text-muted-foreground">Last updated: {new Date(aboutPage.updated_at).toLocaleDateString()}</span>
                  </div>
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: aboutPage.content || '<p>No content yet</p>' }} />
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No About page created yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blog" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Blog Posts</CardTitle>
              <Button onClick={() => openNewPage('blog')}><Plus className="mr-2 h-4 w-4" />New Post</Button>
            </CardHeader>
            <CardContent>
              {blogPosts && blogPosts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blogPosts.map((post: any) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium">{post.title}</TableCell>
                        <TableCell><Badge variant={post.is_published ? 'default' : 'secondary'}>{post.is_published ? 'Published' : 'Draft'}</Badge></TableCell>
                        <TableCell>{new Date(post.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditPage(post)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this post?')) deletePage.mutate(post.id); }}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">No blog posts yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Gallery</CardTitle>
              <Button onClick={() => { setEditingGallery(null); setGalleryForm({ title: '', description: '', image_url: '', category: 'general' }); setIsGalleryDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />Add Image
              </Button>
            </CardHeader>
            <CardContent>
              {gallery && gallery.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {gallery.map((item: any) => (
                    <div key={item.id} className="group relative rounded-lg overflow-hidden border">
                      <img src={item.image_url} alt={item.title} className="w-full h-40 object-cover" />
                      <div className="p-2">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                        <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => openEditGallery(item)}><Edit className="h-3 w-3" /></Button>
                        <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => { if (confirm('Delete?')) deleteGalleryItem.mutate(item.id); }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No gallery images yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Gallery Dialog */}
      <Dialog open={isGalleryDialogOpen} onOpenChange={setIsGalleryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGallery ? 'Edit' : 'Add'} Gallery Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={galleryForm.title} onChange={e => setGalleryForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={galleryForm.description} onChange={e => setGalleryForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={galleryForm.category} onChange={e => setGalleryForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. events, campus, sports" />
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              {galleryForm.image_url && (
                <img src={galleryForm.image_url} alt="Preview" className="w-full h-40 object-cover rounded-md mb-2" />
              )}
              <Input type="file" accept="image/*" onChange={handleGalleryImageUpload} disabled={uploading} />
              {uploading && <p className="text-sm text-muted-foreground"><Loader2 className="inline h-4 w-4 animate-spin mr-1" />Uploading...</p>}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => saveGalleryItem.mutate({ ...galleryForm, id: editingGallery?.id })} disabled={!galleryForm.title || !galleryForm.image_url || saveGalleryItem.isPending}>
              {saveGalleryItem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

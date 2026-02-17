import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { RichTextEditor } from '@/components/shared/RichTextEditor';
import {
  Plus, Edit, Trash2, Loader2, FileText, Image as ImageIcon,
  Eye, ArrowLeft, Globe, Calendar, PenLine, Upload, LayoutGrid,
  BookOpen, Info, ImagePlus
} from 'lucide-react';

const GALLERY_CATEGORIES = ['general', 'campus', 'events', 'sports', 'academics', 'celebrations'];

export default function CMSPages() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('about');
  const [isEditing, setIsEditing] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [isGalleryDialogOpen, setIsGalleryDialogOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<any>(null);
  const [galleryForm, setGalleryForm] = useState({ title: '', description: '', image_url: '', category: 'general' });
  const [pageForm, setPageForm] = useState({ title: '', slug: '', content: '', excerpt: '', featured_image: '', is_published: false, page_type: 'page' });
  const [uploading, setUploading] = useState(false);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'page' | 'gallery'>('page');

  const { data: pages, isLoading: pagesLoading } = useQuery({
    queryKey: ['cms-pages'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cms_pages').select('*').order('sort_order');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: gallery, isLoading: galleryLoading } = useQuery({
    queryKey: ['cms-gallery'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cms_gallery').select('*').order('sort_order');
      if (error) throw error;
      return data || [];
    },
  });

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
      const payload = {
        title: data.title, slug: data.slug, content: data.content,
        excerpt: data.excerpt, featured_image: data.featured_image,
        is_published: data.is_published, page_type: data.page_type,
      };
      if (data.id) {
        const { error } = await supabase.from('cms_pages').update(payload).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cms_pages').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Content saved successfully!');
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
      toast.success('Content deleted');
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ['cms-pages'] });
      queryClient.invalidateQueries({ queryKey: ['cms-blog-posts'] });
    },
  });

  const saveGalleryItem = useMutation({
    mutationFn: async (data: any) => {
      const payload = { title: data.title, description: data.description, image_url: data.image_url, category: data.category };
      if (data.id) {
        const { error } = await supabase.from('cms_gallery').update(payload).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cms_gallery').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Gallery image saved!');
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
      toast.success('Gallery image deleted');
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ['cms-gallery'] });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, onSuccess: (url: string) => void, setLoading: (v: boolean) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { data, error } = await supabase.storage.from('cms-images').upload(`uploads/${fileName}`, file, { cacheControl: '3600' });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('cms-images').getPublicUrl(data.path);
      onSuccess(publicUrl);
      toast.success('Image uploaded!');
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openEditPage = (page: any) => {
    setEditingPage(page);
    setPageForm({
      title: page.title, slug: page.slug, content: page.content || '',
      excerpt: page.excerpt || '', featured_image: page.featured_image || '',
      is_published: page.is_published, page_type: page.page_type,
    });
    setIsEditing(true);
  };

  const openNewPage = (type: string) => {
    setEditingPage(null);
    setPageForm({ title: '', slug: '', content: '', excerpt: '', featured_image: '', is_published: false, page_type: type });
    setIsEditing(true);
  };

  const openEditGallery = (item: any) => {
    setEditingGallery(item);
    setGalleryForm({ title: item.title, description: item.description || '', image_url: item.image_url, category: item.category || 'general' });
    setIsGalleryDialogOpen(true);
  };

  const aboutPage = pages?.find(p => p.slug === 'about' && p.page_type === 'page');

  const confirmDelete = (id: string, type: 'page' | 'gallery') => {
    setDeleteConfirmId(id);
    setDeleteType(type);
  };

  // --- Editor View ---
  if (isEditing) {
    const isBlog = pageForm.page_type === 'blog';
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{editingPage ? 'Edit' : 'Create'} {isBlog ? 'Blog Post' : 'Page'}</h1>
            <p className="text-sm text-muted-foreground">
              {isBlog ? 'Write and publish blog articles for your school website.' : 'Edit the content that appears on your public website.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
              <Switch checked={pageForm.is_published} onCheckedChange={v => setPageForm(p => ({ ...p, is_published: v }))} id="publish-toggle" />
              <Label htmlFor="publish-toggle" className="text-sm font-medium cursor-pointer">
                {pageForm.is_published ? 'Published' : 'Draft'}
              </Label>
            </div>
            <Button onClick={() => savePage.mutate({ ...pageForm, id: editingPage?.id })} disabled={savePage.isPending || !pageForm.title}>
              {savePage.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingPage ? 'Update' : 'Publish'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Title</Label>
                  <Input
                    value={pageForm.title}
                    onChange={e => setPageForm(p => ({
                      ...p,
                      title: e.target.value,
                      slug: p.slug || e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                    }))}
                    placeholder={isBlog ? 'e.g. Annual Science Fair 2026' : 'Page title'}
                    className="text-lg"
                  />
                </div>
                {isBlog && (
                  <div className="space-y-2">
                    <Label>Summary</Label>
                    <Textarea
                      value={pageForm.excerpt}
                      onChange={e => setPageForm(p => ({ ...p, excerpt: e.target.value }))}
                      placeholder="A brief summary that appears in blog listings..."
                      rows={2}
                    />
                  </div>
                )}
                <Separator />
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Content</Label>
                  <RichTextEditor content={pageForm.content} onChange={content => setPageForm(p => ({ ...p, content }))} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar settings */}
          <div className="space-y-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">URL Slug</Label>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Globe className="h-3 w-3" />
                    <span>/{isBlog ? 'blog' : ''}/{pageForm.slug || '...'}</span>
                  </div>
                  <Input value={pageForm.slug} onChange={e => setPageForm(p => ({ ...p, slug: e.target.value }))} placeholder="url-slug" />
                </div>
              </CardContent>
            </Card>

            {isBlog && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Featured Image</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pageForm.featured_image ? (
                    <div className="relative rounded-lg overflow-hidden border">
                      <img src={pageForm.featured_image} alt="Featured" className="w-full h-32 object-cover" />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 h-7 text-xs"
                        onClick={() => setPageForm(p => ({ ...p, featured_image: '' }))}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload</span>
                      <span className="text-xs text-muted-foreground">JPG, PNG, WebP</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleImageUpload(e, url => setPageForm(p => ({ ...p, featured_image: url })), setUploadingFeatured)}
                        disabled={uploadingFeatured}
                      />
                    </label>
                  )}
                  {uploadingFeatured && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {editingPage && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Info</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    Created: {new Date(editingPage.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <PenLine className="h-3.5 w-3.5" />
                    Updated: {new Date(editingPage.updated_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Main CMS Dashboard ---
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Content Management</h1>
        <p className="text-muted-foreground mt-1">Manage your school's public website content — About page, Blog posts, and Photo Gallery.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="about" className="gap-2"><Info className="h-4 w-4" />About</TabsTrigger>
          <TabsTrigger value="blog" className="gap-2"><BookOpen className="h-4 w-4" />Blog</TabsTrigger>
          <TabsTrigger value="gallery" className="gap-2"><LayoutGrid className="h-4 w-4" />Gallery</TabsTrigger>
        </TabsList>

        {/* ===== ABOUT TAB ===== */}
        <TabsContent value="about">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>About Page</CardTitle>
                <CardDescription>This content appears on your school's public "About Us" page.</CardDescription>
              </div>
              {aboutPage ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href="/about" target="_blank" rel="noopener noreferrer"><Eye className="mr-2 h-4 w-4" />Preview</a>
                  </Button>
                  <Button size="sm" onClick={() => openEditPage(aboutPage)}><Edit className="mr-2 h-4 w-4" />Edit Content</Button>
                </div>
              ) : (
                <Button onClick={() => { setEditingPage(null); setPageForm({ title: 'About Us', slug: 'about', content: '', excerpt: '', featured_image: '', is_published: false, page_type: 'page' }); setIsEditing(true); }}>
                  <Plus className="mr-2 h-4 w-4" />Create About Page
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {aboutPage ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant={aboutPage.is_published ? 'default' : 'secondary'}>
                      {aboutPage.is_published ? '● Published' : 'Draft'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Last updated {new Date(aboutPage.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none border rounded-lg p-4 bg-muted/30" dangerouslySetInnerHTML={{ __html: aboutPage.content || '<p class="text-muted-foreground">No content added yet. Click "Edit Content" to get started.</p>' }} />
                </div>
              ) : (
                <div className="text-center py-16">
                  <Info className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-1">No About Page Yet</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">Create your school's About page to tell visitors about your mission, history, and values.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== BLOG TAB ===== */}
        <TabsContent value="blog">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Blog Posts</CardTitle>
                <CardDescription>Share news, events, and announcements with your school community.</CardDescription>
              </div>
              <Button onClick={() => openNewPage('blog')}><Plus className="mr-2 h-4 w-4" />New Post</Button>
            </CardHeader>
            <CardContent>
              {blogPosts && blogPosts.length > 0 ? (
                <div className="space-y-3">
                  {blogPosts.map((post: any) => (
                    <div key={post.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors group">
                      {post.featured_image ? (
                        <img src={post.featured_image} alt="" className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{post.title}</h3>
                          <Badge variant={post.is_published ? 'default' : 'secondary'} className="flex-shrink-0">
                            {post.is_published ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{post.excerpt || 'No summary'}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => openEditPage(post)} title="Edit"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete(post.id, 'page')} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-1">No Blog Posts Yet</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mb-4">Start writing to share school news, event recaps, and announcements.</p>
                  <Button onClick={() => openNewPage('blog')}><Plus className="mr-2 h-4 w-4" />Write Your First Post</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== GALLERY TAB ===== */}
        <TabsContent value="gallery">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Photo Gallery</CardTitle>
                <CardDescription>Upload photos to showcase school life, events, and campus facilities.</CardDescription>
              </div>
              <Button onClick={() => { setEditingGallery(null); setGalleryForm({ title: '', description: '', image_url: '', category: 'general' }); setIsGalleryDialogOpen(true); }}>
                <ImagePlus className="mr-2 h-4 w-4" />Add Photo
              </Button>
            </CardHeader>
            <CardContent>
              {gallery && gallery.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {gallery.map((item: any) => (
                    <div key={item.id} className="group relative rounded-xl overflow-hidden border bg-muted/20 hover:shadow-md transition-shadow">
                      <div className="aspect-square">
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <div className="flex items-center justify-between mt-1">
                          <Badge variant="outline" className="text-xs capitalize">{item.category || 'general'}</Badge>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                        <Button size="sm" variant="secondary" onClick={() => openEditGallery(item)}><Edit className="mr-1 h-3 w-3" />Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => confirmDelete(item.id, 'gallery')}><Trash2 className="mr-1 h-3 w-3" />Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-1">No Photos Yet</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mb-4">Add photos of your campus, events, and activities to build an engaging gallery.</p>
                  <Button onClick={() => { setEditingGallery(null); setGalleryForm({ title: '', description: '', image_url: '', category: 'general' }); setIsGalleryDialogOpen(true); }}>
                    <ImagePlus className="mr-2 h-4 w-4" />Upload First Photo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ===== Gallery Dialog ===== */}
      <Dialog open={isGalleryDialogOpen} onOpenChange={setIsGalleryDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingGallery ? 'Edit Photo' : 'Add New Photo'}</DialogTitle>
            <DialogDescription>Upload a photo and add details for the public gallery.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Photo</Label>
              {galleryForm.image_url ? (
                <div className="relative rounded-lg overflow-hidden border">
                  <img src={galleryForm.image_url} alt="Preview" className="w-full h-48 object-cover" />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-7 text-xs"
                    onClick={() => setGalleryForm(p => ({ ...p, image_url: '' }))}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium">Click to upload an image</span>
                  <span className="text-xs text-muted-foreground">JPG, PNG, WebP up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleImageUpload(e, url => setGalleryForm(p => ({ ...p, image_url: url })), setUploading)}
                    disabled={uploading}
                  />
                </label>
              )}
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading image...
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={galleryForm.title} onChange={e => setGalleryForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Sports Day 2026" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={galleryForm.category} onValueChange={v => setGalleryForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GALLERY_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                value={galleryForm.description}
                onChange={e => setGalleryForm(p => ({ ...p, description: e.target.value }))}
                placeholder="A short description of this photo..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGalleryDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveGalleryItem.mutate({ ...galleryForm, id: editingGallery?.id })} disabled={!galleryForm.title || !galleryForm.image_url || saveGalleryItem.isPending}>
              {saveGalleryItem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingGallery ? 'Update' : 'Add Photo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Delete Confirmation ===== */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>This action cannot be undone. Are you sure you want to delete this {deleteType === 'gallery' ? 'photo' : 'content'}?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmId) {
                  if (deleteType === 'gallery') deleteGalleryItem.mutate(deleteConfirmId);
                  else deletePage.mutate(deleteConfirmId);
                }
              }}
              disabled={deletePage.isPending || deleteGalleryItem.isPending}
            >
              {(deletePage.isPending || deleteGalleryItem.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Loader2, Image as ImageIcon, X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function GalleryPage() {
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const { data: items, isLoading } = useQuery({
    queryKey: ['cms-gallery-public'],
    queryFn: async () => {
      const { data } = await supabase.from('cms_gallery').select('*').eq('is_published', true).order('sort_order');
      return data || [];
    },
  });

  const categories = ['all', ...new Set((items || []).map((i: any) => i.category || 'general'))];
  const filteredItems = activeCategory === 'all' ? items : items?.filter((i: any) => (i.category || 'general') === activeCategory);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-primary/5 py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-primary/20">
            <ImageIcon className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-3">Photo Gallery</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Explore moments from campus life, events, and academic activities.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="container mx-auto px-4 md:px-6 pt-8">
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map(cat => (
            <Badge
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              className={cn(
                "cursor-pointer capitalize px-4 py-1.5 text-sm transition-colors",
                activeCategory === cat ? "" : "hover:bg-primary/5"
              )}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filteredItems && filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item: any) => (
              <div
                key={item.id}
                className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-primary/10 hover:shadow-lg transition-all duration-300"
                onClick={() => setSelectedImage(item)}
              >
                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                  {item.description && <p className="text-xs text-white/70 truncate">{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <ImageIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">No images yet</h3>
            <p className="text-sm text-muted-foreground/60 mt-1">Check back soon for photos from our school.</p>
          </div>
        )}
      </section>

      {/* Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button className="absolute -top-10 right-0 text-white/80 hover:text-white" onClick={() => setSelectedImage(null)}>
              <X className="h-6 w-6" />
            </button>
            <img src={selectedImage.image_url} alt={selectedImage.title} className="w-full max-h-[80vh] object-contain rounded-lg" />
            <div className="mt-3 text-center">
              <h3 className="text-lg font-semibold text-white">{selectedImage.title}</h3>
              {selectedImage.description && <p className="text-sm text-white/60">{selectedImage.description}</p>}
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  );
}

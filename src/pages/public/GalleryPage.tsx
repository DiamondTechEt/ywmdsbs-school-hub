import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function GalleryPage() {
  const [selectedImage, setSelectedImage] = useState<any>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ['cms-gallery-public'],
    queryFn: async () => {
      const { data } = await supabase.from('cms_gallery').select('*').eq('is_published', true).order('sort_order');
      return data || [];
    },
  });

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  const categories = [...new Set((items || []).map((i: any) => i.category))];

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Gallery</h1>
      {categories.map(cat => (
        <div key={cat} className="mb-8">
          <h2 className="text-xl font-semibold mb-4 capitalize">{cat}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items?.filter((i: any) => i.category === cat).map((item: any) => (
              <div key={item.id} className="cursor-pointer rounded-lg overflow-hidden border hover:shadow-md transition-shadow" onClick={() => setSelectedImage(item)}>
                <img src={item.image_url} alt={item.title} className="w-full h-40 object-cover" />
                <div className="p-2">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {(!items || items.length === 0) && <p className="text-muted-foreground text-center py-8">No gallery images yet.</p>}

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl">
          {selectedImage && (
            <div>
              <img src={selectedImage.image_url} alt={selectedImage.title} className="w-full rounded-md" />
              <h3 className="text-lg font-semibold mt-4">{selectedImage.title}</h3>
              {selectedImage.description && <p className="text-muted-foreground">{selectedImage.description}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

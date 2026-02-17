import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Loader2, GraduationCap, Users, Award, BookOpen, Building2, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AboutPage() {
  const { data: page, isLoading } = useQuery({
    queryKey: ['cms-about'],
    queryFn: async () => {
      const { data } = await supabase.from('cms_pages').select('*').eq('slug', 'about').eq('is_published', true).single();
      return data;
    },
  });

  return (
    <PublicLayout>
      {/* Hero Banner */}
      <section className="relative bg-primary/5 py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-4">About Our School</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Yihune Woldu Memorial Dessie Special Boarding School — nurturing Ethiopia's brightest minds since 2018.
          </p>
        </div>
      </section>

      {/* Core Info Section */}
      <section className="container mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Our Story */}
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary">Our Story</h2>
            <p className="text-muted-foreground leading-relaxed">
              Founded in memory of Yihune Woldu, our institution stands as a testament to the power of education in transforming lives. 
              Located in the historic city of Dessie, we select the top 5% of applicants from across the Amhara region, providing them 
              with a fully subsidized, world-class education in a supportive boarding environment.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our rigorous STEM-focused curriculum, combined with leadership training and character education, prepares students 
              to become globally competitive professionals and ethical leaders who will drive the sustainable transformation of Ethiopia.
            </p>
          </div>

          {/* Right: Key Facts */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Users, value: 'Top 5%', label: 'Student Selection' },
              { icon: Award, value: '100%', label: 'University Placement' },
              { icon: BookOpen, value: '4 Streams', label: 'Academic Programs' },
              { icon: Building2, value: 'Est. 2018', label: 'Founded' },
            ].map((stat, i) => (
              <Card key={i} className="text-center border-primary/10">
                <CardContent className="pt-6 pb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-xl font-bold text-primary">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-primary/[0.03] py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-background rounded-2xl p-8 border border-primary/10">
              <h3 className="text-xl font-serif font-bold text-primary mb-4">Our Vision</h3>
              <p className="text-muted-foreground leading-relaxed italic">
                "To be a premier center of academic excellence that produces globally competitive, ethically grounded, 
                and socially responsible leaders who drive the sustainable transformation of Ethiopia and the world."
              </p>
            </div>
            <div className="bg-background rounded-2xl p-8 border border-primary/10">
              <h3 className="text-xl font-serif font-bold text-primary mb-4">Our Mission</h3>
              <ul className="space-y-3 text-muted-foreground text-sm">
                {[
                  "Cultivating critical thinking through rigorous STEM education.",
                  "Fostering integrity, discipline, and service in every student.",
                  "Providing a nurturing boarding environment celebrating diversity.",
                  "Equipping the next generation to solve national challenges."
                ].map((m, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Heart className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Admin CMS Content */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {page?.content && (
        <section className="container mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="prose prose-sm max-w-none prose-headings:text-primary prose-a:text-primary" dangerouslySetInnerHTML={{ __html: page.content }} />
        </section>
      )}
    </PublicLayout>
  );
}

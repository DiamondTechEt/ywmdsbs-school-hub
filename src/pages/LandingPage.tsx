import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  Users,
  Award,
  Shield,
  CheckCircle,
  ArrowRight,
  Zap,
  Library,
  Trophy,
  History,
  MapPin,
  Heart,
  Lightbulb,
  Building2,
  Sparkles,
  Menu,
  X,
  Star
} from 'lucide-react';

export function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="min-h-screen mesh-gradient text-foreground selection:bg-primary/20 overflow-x-hidden relative">
      {/* Global Background Accents */}
      <div className="accent-blob w-[500px] h-[500px] bg-primary/20 -top-48 -left-24" />
      <div className="accent-blob w-[600px] h-[600px] bg-secondary/15 top-1/4 -right-48" />
      <div className="accent-blob w-[400px] h-[400px] bg-primary/10 bottom-1/4 -left-32" />
      <div className="accent-blob w-[500px] h-[500px] bg-secondary/10 -bottom-48 right-0" />

      {/* Navigation */}
      <header className="fixed top-0 w-full z-[100] border-b border-white/10 bg-white/30 backdrop-blur-xl">
        <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group relative z-[101]">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-all duration-300">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight leading-none text-primary">YWMDSBS</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mt-1">Dessie Special Boarding</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <a href="#about" className="text-muted-foreground hover:text-primary transition-colors">About</a>
            <a href="#academics" className="text-muted-foreground hover:text-primary transition-colors">Academics</a>
            <a href="#vision" className="text-muted-foreground hover:text-primary transition-colors">Our Vision</a>
            <div className="h-4 w-px bg-border mx-2" />
            <Button asChild className="rounded-full px-8 shadow-lg hover:shadow-primary/20">
              <Link to="/auth">Portal Login</Link>
            </Button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-primary relative z-[101]"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Nav Overlay (Backdrop) */}
        <div
          className={`fixed inset-0 bg-primary/20 backdrop-blur-sm z-[99] md:hidden transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={toggleMenu}
        />

        {/* Mobile Sidebar */}
        <div className={`fixed top-0 right-0 h-[100vh] w-[280px] bg-gray-900 z-[100] md:hidden transition-transform duration-500 ease-in-out shadow-2xl border-l border-primary/5 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col p-8 pt-24 space-y-6 text-xl font-serif font-bold text-white">
            <a
              href="#about"
              onClick={toggleMenu}
              className="flex items-center space-x-4 hover:translate-x-2 transition-transform"
            >
              <History className="w-5 h-5 text-white" />
              <span>About</span>
            </a>
            <a
              href="#academics"
              onClick={toggleMenu}
              className="flex items-center space-x-4 hover:translate-x-2 transition-transform"
            >
              <Library className="w-5 h-5 text-white" />
              <span>Academics</span>
            </a>
            <a
              href="#vision"
              onClick={toggleMenu}
              className="flex items-center space-x-4 hover:translate-x-2 transition-transform"
            >
              <Lightbulb className="w-5 h-5 text-white" />
              <span>Our Vision</span>
            </a>
            <div className="h-px bg-primary/10 my-4" />
            <Link
              to="/auth"
              onClick={toggleMenu}
              className="flex items-center space-x-4 text-white hover:translate-x-2 transition-transform"
            >

              <Button className="flex items-center w-full gap-2 rounded-xl  px-4 py-2 shadow-md hover:shadow-lg transition-all duration-300">
                <Users className="w-5 h-5 text-white" />
                <span className="text-white font-medium tracking-wide">Portal Login</span>
              </Button>

            </Link>

          </div>

          {/* Decorative element at bottom of sidebar */}
          <div className="absolute bottom-10 left-8 right-8 text-center">
            <div className="w-10 h-1bg-primary/10 mx-auto mb-4" />
            <p className="text-[10px] text-white uppercase tracking-widest text-muted-foreground font-semibold">
              Work Conquers All
            </p>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-40 pb-16 md:pb-24 px-4 md:px-6 overflow-hidden">
        <div className="container mx-auto relative z-10 text-center">
          <Badge variant="outline" className="mb-6 px-4 py-1.5 border-primary/20 bg-primary/5 text-primary rounded-full animate-bounce">
            <Sparkles className="w-3.5 h-3.5 mr-2" />
            Nurturing Tomorrow's Leaders
          </Badge>

          <h1 className="text-4xl md:text-7xl font-serif font-bold tracking-tight text-primary mb-6 md:mb-8 leading-[1.1]">
            Yihune Woldu Memorial <br className="hidden md:block" />
            <span className="text-gradient">Dessie Special Boarding School</span>
          </h1>

          <p className="text-lg md:text-2xl text-muted-foreground mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            Where academic excellence meets character building in the heart of Dessie.
            Subsidized education for the brightest minds of our nation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
            <Button size="lg" asChild className="w-full sm:w-auto h-14 px-10 rounded-full text-lg shadow-2xl hover:scale-105 transition-transform">
              <Link to="/auth">
                Access School Hub
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="ghost" className="w-full sm:w-auto h-14 px-10 rounded-full text-lg hover:bg-white/50 border border-primary/10 sm:border-transparent">
              <a href="#vision">Explore Our Vision</a>
            </Button>
          </div>

          {/* Key Stats / Facts */}
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-16 md:mt-24">
            {[
              { label: 'Excellence', value: '100%', sub: 'Pass Rate', icon: Award },
              { label: 'STEM focus', value: '4.0', sub: 'Average GPA', icon: Zap },
              { label: 'Selective', value: 'Top 5%', sub: 'Student Intake', icon: Users },
              { label: 'Memorial', value: 'Est. 2012', sub: 'Legacy', icon: History },
            ].map((stat, i) => (
              <div key={i} className="glass-card p-6 md:p-8 rounded-3xl text-center hover:translate-y-[-8px] transition-all duration-300">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/10">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                <div className="text-xs text-muted-foreground/60">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legacy & Vision Section */}
      <section id="about" className="py-16 md:py-24 px-4 md:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/[0.03] -skew-y-3 origin-right" />
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="space-y-6 md:space-y-8">
              <div className="inline-flex items-center space-x-2 text-primary">
                <History className="w-5 h-5" />
                <span className="font-bold tracking-widest uppercase text-sm">The Memorial Legacy</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary leading-tight">
                Honoring a Name, <br className="hidden md:block" />Building a Future
              </h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                Founded in memory of Yihune Woldu, our institution stands as a testament to the power of education in transforming lives.
                Located in the historic city of Dessie, we are more than just a school; we are a community dedicated to identifying and
                cultivating the highest potential in Ethiopian youth.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {[
                  { title: "Special Status", desc: "Recognized as a center of excellence by the regional education bureau.", icon: Shield },
                  { title: "Residential Life", desc: "A supportive boarding environment that fosters lifelong friendships and independence.", icon: Building2 }
                ].map((item, i) => (
                  <div key={i} className="glass-card p-6 rounded-3xl border-primary/5 hover:border-primary/20 transition-all duration-300">
                    <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center mb-4">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-bold text-primary mb-2 text-lg">{item.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mt-8 lg:mt-0">
              <div className="aspect-square glass-card rounded-[40px] p-8 md:p-12 flex items-center justify-center relative overflow-hidden group max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
                <div className="relative z-10 text-center">
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                    <GraduationCap className="w-12 h-12 md:w-16 md:h-16 text-white" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-serif font-bold text-primary mb-4 italic">"Labor Omnia Vincit"</h3>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em]">Work Conquers All</p>
                </div>
                <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 border-r-4 border-t-4 border-primary/10 rounded-tr-[40px]" />
                <div className="absolute bottom-0 left-0 w-24 md:w-32 h-24 md:h-32 border-l-4 border-b-4 border-primary/10 rounded-bl-[40px]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Academic Pillars */}
      <section id="academics" className="py-16 md:py-24 px-4 md:px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-secondary/[0.02] transform skew-y-3 origin-left" />
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-12 md:mb-20">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-4 md:mb-6">Our Academic Pillars</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-4" />
            <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
              A curriculum designed to challenge, inspire, and prepare students for global excellence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                title: "Rigorous Science & Math",
                desc: "An intensive STEM curriculum with state-of-the-art laboratory access and research opportunities.",
                icon: Library,
                color: "bg-blue-100/30"
              },
              {
                title: "Leadership & Civic",
                desc: "Weekly seminars on governance, ethical leadership, and community service projects.",
                icon: Users,
                color: "bg-emerald-100/30"
              },
              {
                title: "Holistic Development",
                desc: "Mandatory participation in arts, sports, and technical skills to ensure balanced growth.",
                icon: Star,
                color: "bg-amber-100/30"
              }
            ].map((pillar, i) => (
              <Card key={i} className={`group hover:shadow-2xl transition-all duration-500 border-white/20 ${pillar.color} backdrop-blur-sm sm:last:col-span-2 md:last:col-span-1 border-primary/5`}>
                <CardHeader className="pb-4">
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-4 md:mb-6 shadow-sm group-hover:bg-primary transition-colors duration-300">
                    <pillar.icon className="w-7 h-7 text-primary group-hover:text-white transition-colors capitalize" />
                  </div>
                  <CardTitle className="text-xl md:text-2xl font-serif text-primary group-hover:translate-x-1 transition-transform">{pillar.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{pillar.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section id="vision" className="py-16 md:py-24 px-4 md:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/[0.04] backdrop-blur-[2px]" />
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-stretch">
            <div className="glass-card rounded-[30px] md:rounded-[40px] p-8 md:p-12 flex flex-col justify-center border-primary/10">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 md:mb-8">
                <Lightbulb className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-4 md:mb-6">Our Vision</h2>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed italic font-light">
                "To be a premier center of academic excellence that produces globally competitive,
                ethically grounded, and socially responsible leaders who drive the sustainable
                transformation of Ethiopia and the world."
              </p>
            </div>

            <div className="glass-card rounded-[30px] md:rounded-[40px] p-8 md:p-12 flex flex-col justify-center border-secondary/10">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 md:mb-8">
                <Trophy className="w-8 h-8 text-secondary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-4 md:mb-6">Our Mission</h2>
              <ul className="space-y-4 md:space-y-6">
                {[
                  "Cultivating critical thinking and innovation through rigorous STEM education.",
                  "Fostering integrity, discipline, and a spirit of service in every student.",
                  "Providing a nurturing boarding environment that celebrates diversity and meritocracy.",
                  "Equipping the next generation with the tools to solve complex national challenges."
                ].map((mission, i) => (
                  <li key={i} className="flex items-start space-x-4">
                    <div className="w-6 h-6 mt-1 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3.5 h-3.5 text-secondary" />
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground leading-snug">{mission}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="bg-primary 
  text-white 
  absolute z-10 
  mt-20  
  px-4 md:px-6 
  py-12 
">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 mb-12 md:mb-16">
            <div className="col-span-1 sm:col-span-2 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <span className="text-2xl font-bold tracking-tight">YWMDSBS</span>
              </div>
              <p className="text-primary-foreground/60 max-w-md leading-relaxed text-sm md:text-base">
                Yihune Woldu Memorial Dessie Special Boarding School.
                Dedicated to academic rigors, character formation, and community service.
                Dessie, Ethiopia.
              </p>
              <div className="flex items-center space-x-4">
                <MapPin className="w-5 h-5 text-secondary" />
                <span className="text-primary-foreground/80 text-sm md:text-base">Dessie, Amhara Region, Ethiopia</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4 md:mb-6 text-white/90">Quick Links</h4>
              <ul className="space-y-3 md:space-y-4 text-primary-foreground/60 text-sm md:text-base">
                <li><Link to="/auth" className="hover:text-white transition-colors">School Portal</Link></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">Teacher Access</Link></li>
                <li><a href="#academics" className="hover:text-white transition-colors">Academic Hub</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4 md:mb-6 text-white/90">Contact Us</h4>
              <ul className="space-y-3 md:space-y-4 text-primary-foreground/60 text-sm md:text-base">
                <li className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-secondary" />
                  <span>Administrative Office</span>
                </li>
                <li>Email: info@ywmdsbs.edu.et</li>
                <li>Phone: +251 33 111 ....</li>
                <li>PO Box: 1234, Dessie</li>
              </ul>
            </div>
          </div>


        </div>
      </footer>
    </div>
  );
}

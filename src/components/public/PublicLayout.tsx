import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/blog', label: 'Blog' },
  { to: '/gallery', label: 'Gallery' },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight leading-none text-primary">YWMDSBS</span>
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mt-0.5">Dessie Special Boarding</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "transition-colors hover:text-primary",
                  location.pathname === link.to ? "text-primary font-semibold" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="h-4 w-px bg-border mx-1" />
            <Button asChild size="sm" className="rounded-full px-6">
              <Link to="/auth">Portal Login</Link>
            </Button>
          </nav>

          <button className="md:hidden p-2 text-primary" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-border/40 bg-background px-4 pb-4 space-y-2">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === link.to ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Button asChild size="sm" className="w-full rounded-full mt-2">
              <Link to="/auth" onClick={() => setMobileOpen(false)}>Portal Login</Link>
            </Button>
          </div>
        )}
      </header>

      {/* Main */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground mt-16">
        <div className="container mx-auto px-4 md:px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5" />
                <span className="font-bold">YWMDSBS</span>
              </div>
              <p className="text-primary-foreground/60 text-sm leading-relaxed">
                Yihune Woldu Memorial Dessie Special Boarding School. Dedicated to academic excellence and character formation.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/60">
                <li><Link to="/about" className="hover:text-primary-foreground transition-colors">About Us</Link></li>
                <li><Link to="/blog" className="hover:text-primary-foreground transition-colors">Blog</Link></li>
                <li><Link to="/gallery" className="hover:text-primary-foreground transition-colors">Gallery</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/60">
                <li>Email: info@ywmdsbs.edu.et</li>
                <li>Phone: +251 33 111 ....</li>
                <li>Dessie, Amhara Region, Ethiopia</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-foreground/10 mt-8 pt-6 text-center text-xs text-primary-foreground/40">
            © {new Date().getFullYear()} YWMDSBS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

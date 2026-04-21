import { Instagram, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-background py-12 border-t border-border">
      <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-2xl font-serif font-bold text-foreground">ملاذ</span>
            <span className="text-sm text-muted-foreground mt-1 font-light">مساحة للإبداع والتنفس في غزة.</span>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="https://www.instagram.com/ih_haven" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-secondary/10 text-secondary-foreground flex items-center justify-center hover:bg-secondary/20 transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a 
              href="https://nastonas.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              من الناس إلى الناس
            </a>
          </div>
        </div>
        <div className="mt-12 text-center text-sm text-muted-foreground/60 font-light">
          <p>بُني بحب، ليبقى الأمل حياً.</p>
        </div>
      </div>
    </footer>
  );
}

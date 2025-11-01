import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { 
      name: "For Founders", 
      path: "/founders",
      submenu: [
        { name: "Apply for Funding", path: "/founders#apply" },
        { name: "How It Works", path: "/founders#how-it-works" },
        { name: "Forum Calendar", path: "/founders#calendar" },
      ]
    },
    { 
      name: "For Investors", 
      path: "/investors",
      submenu: [
        { name: "Join as Member", path: "/investors#join" },
        { name: "Membership Plans", path: "/investors#plans" },
        { name: "Deal Rooms", path: "/investors#deals" },
      ]
    },
    { name: "Portfolio", path: "/portfolio" },
    { name: "Events", path: "/events" },
    { name: "About", path: "/about" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold">
              <span className="text-primary">India</span>
              <span className="text-accent"> Angel Forum</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-accent relative group",
                  isActive(link.path) 
                    ? "text-accent" 
                    : "text-muted-foreground"
                )}
              >
                {link.name}
                {isActive(link.path) && (
                  <span className="absolute -bottom-6 left-0 w-full h-0.5 bg-accent"></span>
                )}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button variant="hero" asChild>
              <Link to="/investors#join">Join Now</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-4 border-t">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "block px-4 py-2 text-sm font-medium transition-colors hover:text-accent",
                  isActive(link.path) 
                    ? "text-accent bg-accent/10" 
                    : "text-muted-foreground"
                )}
              >
                {link.name}
              </Link>
            ))}
            <div className="px-4 pt-4 space-y-2 border-t">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button variant="hero" className="w-full" asChild>
                <Link to="/investors#join">Join Now</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;

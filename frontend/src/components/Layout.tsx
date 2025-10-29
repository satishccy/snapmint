import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Camera, Image as ImageIcon, Printer } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { WalletConnectButton } from "./WalletConnectButton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: "/capture", icon: Camera, label: "Capture Photo" },
    { to: "/gallery", icon: ImageIcon, label: "Gallery" },
    { to: "/photo-booth", icon: Printer, label: "Photo Booth" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-first sticky header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-gradient-primary rounded-lg p-1.5">
              <Camera className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg hidden sm:inline">
              Snap Mint
            </span>
          </Link>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Wallet + Theme + Mobile Menu */}
          <div className="flex items-center gap-2">
            <WalletConnectButton />
            <ThemeToggle />
            
            {/* Mobile Hamburger Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full md:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 text-lg font-medium hover:text-primary transition-colors py-2"
                      >
                        <Icon className="h-5 w-5" />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="min-h-[calc(100vh-3.6rem)]">{children}</main>
    </div>
  );
}

import { Home, Heart, ShoppingCart, User } from "lucide-react";
import { Link, useLocation } from "wouter";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Discover" },
    { href: "/cookbook", icon: Heart, label: "Cookbook" },
    { href: "/list", icon: ShoppingCart, label: "Groceries" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-border flex items-center justify-around px-6 z-50">
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = location === href;
        return (
          <Link key={href} href={href}>
            <div className="flex flex-col items-center justify-center w-16 h-full cursor-pointer group">
              <div
                className={`flex items-center justify-center w-12 h-10 rounded-full transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground group-hover:text-foreground group-hover:bg-muted"
                }`}
              >
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? "text-primary" : ""}
                />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

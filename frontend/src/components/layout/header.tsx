"use client";

import { usePathname } from "next/navigation";
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/properties": "Properties",
  "/extract": "AI Extract",
  "/documents": "Documents",
};

export function Header() {
  const pathname = usePathname();

  const title =
    pageTitles[pathname] ??
    (pathname.startsWith("/properties/new")
      ? "New Property"
      : pathname.startsWith("/properties/")
        ? "Property Details"
        : "Buena");

  return (
    <header className="hidden md:flex h-16 shrink-0 items-center justify-between border-b bg-card/80 backdrop-blur-sm px-8">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search properties..."
            className="w-64 pl-9 bg-background/50 border-border"
          />
        </div>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/30 hover:text-foreground transition-colors">
          <Bell className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  FileSearch,
  FileText,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Properties", href: "/properties", icon: Building2 },
  { label: "AI Extract", href: "/extract", icon: FileSearch },
  { label: "Documents", href: "/documents", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card">
      <div className="p-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-extrabold tracking-tight">Buena</h1>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
            Property Manager
          </p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/60 hover:bg-accent/30 hover:text-foreground"
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <Link
          href="#"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/60 hover:bg-accent/30 hover:text-foreground transition-all"
        >
          <Settings className="h-[18px] w-[18px]" />
          Settings
        </Link>
      </div>
    </aside>
  );
}

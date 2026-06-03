"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Bell, Database, Home, Layers, Shield, Users } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Overview", icon: Home },
  { href: "/admin/data-sources", label: "Data Sources", icon: Database },
  { href: "/admin/shelters", label: "Shelters", icon: Activity },
  { href: "/admin/alerts", label: "Alerts", icon: Bell },
  { href: "/admin/simulation", label: "Simulation", icon: Layers },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto pb-2 md:grid md:overflow-visible md:pb-0">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-foreground text-background"
                : "border border-border bg-panel text-foreground/70 hover:bg-background hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
      <div className="hidden items-center gap-2 rounded-md border border-border bg-panel px-3 py-2 text-xs text-foreground/50 md:flex">
        <Shield className="h-4 w-4" />
        Admin only
      </div>
    </nav>
  );
}

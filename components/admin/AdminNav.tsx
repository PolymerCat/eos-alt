"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { Activity, Bell, ChevronDown, Database, Home, Layers, Shield, Users } from "lucide-react";

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
  const router = useRouter();
  const activeItem =
    navItems.find((item) => pathname === item.href) ??
    navItems.find((item) => item.href !== "/admin" && pathname.startsWith(item.href)) ??
    navItems[0];
  const ActiveIcon = activeItem.icon;

  return (
    <>
      <div className="relative lg:hidden">
        <ActiveIcon
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/60"
        />
        <select
          aria-label="Admin section"
          value={activeItem.href}
          onChange={(event) => router.push(event.target.value)}
          className="min-h-11 w-full appearance-none rounded-md border border-border bg-panel py-2 pl-10 pr-10 text-sm font-semibold text-foreground shadow-sm outline-none focus:ring-2 focus:ring-accent/30"
        >
          {navItems.map((item) => (
            <option key={item.href} value={item.href}>
              {item.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50"
        />
      </div>

      <nav className="hidden gap-2 lg:grid" aria-label="Admin navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-foreground text-background"
                  : "border border-border bg-panel text-foreground/70 hover:bg-background hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
        <div className="flex items-center gap-2 rounded-md border border-border bg-panel px-3 py-2 text-xs text-foreground/50">
          <Shield className="h-4 w-4 shrink-0" />
          Admin only
        </div>
      </nav>
    </>
  );
}

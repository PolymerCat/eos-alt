"use client";

import { useState } from "react";
import Link from "next/link";
import { logout } from "@/app/login/actions";
import { Menu, X, User, LogOut, LayoutDashboard, Map } from "lucide-react";

interface NavMenuProps {
  userEmail: string;
}

export default function NavMenu({ userEmail }: NavMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      {/* Desktop view: hidden on mobile */}
      <div className="hidden md:flex items-center gap-4">
        <div className="flex flex-col text-right">
          <Link href="/profile" className="text-sm font-medium text-foreground/70 hover:text-accent transition-colors">Profile</Link>
          <span className="text-sm text-foreground/90 truncate max-w-[150px]">{userEmail}</span>
        </div>
        <form action={logout}>
          <button className="px-3 py-1.5 text-sm font-medium bg-background border border-border rounded-md text-foreground/80 hover:bg-foreground/5 transition-colors">
            Sign Out
          </button>
        </form>
      </div>

      {/* Mobile view: hidden on desktop */}
      <div className="md:hidden relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md border border-border bg-panel hover:bg-muted text-foreground transition-colors flex items-center justify-center"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {isOpen && (
          <>
            {/* Click-outside backdrop overlay */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-panel p-2 shadow-lg z-50 flex flex-col gap-1">
              {/* User email shown first */}
              <div className="px-3 py-2 border-b border-border mb-1">
                <p className="text-xs text-foreground/50">Signed in as</p>
                <p className="text-sm font-semibold text-foreground truncate">{userEmail}</p>
              </div>



              <Link
                href="/test-ui"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground/80 hover:text-accent hover:bg-foreground/5 rounded-md transition-colors"
              >
                <LayoutDashboard className="h-4 w-4 text-foreground/60" />
                Overview
              </Link>

              <Link
                href="/test-map"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground/80 hover:text-accent hover:bg-foreground/5 rounded-md transition-colors"
              >
                <Map className="h-4 w-4 text-foreground/60" />
                Map
              </Link>

              <Link
                href="/simulation"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground/80 hover:text-accent hover:bg-foreground/5 rounded-md transition-colors"
              >
                <LayoutDashboard className="h-4 w-4 text-foreground/60" />
                Simulation
              </Link>

              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground/80 hover:text-accent hover:bg-foreground/5 rounded-md transition-colors"
              >
                <User className="h-4 w-4 text-foreground/60" />
                Profile
              </Link>

              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground/80 hover:text-accent hover:bg-foreground/5 rounded-md transition-colors"
              >
                <User className="h-4 w-4 text-foreground/60" />
                Admin
              </Link>

              <form action={logout} className="w-full mt-1 border-t border-border pt-1">
                <button
                  type="submit"
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-500/10 rounded-md transition-colors text-left"
                >
                  <LogOut className="h-4 w-4 text-red-500/70" />
                  Sign Out
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

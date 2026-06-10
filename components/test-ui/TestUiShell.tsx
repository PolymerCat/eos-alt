import Link from "next/link";
import ModeSwitcher from "./ModeSwitcher";
import type { DataMode } from "@/types/emergency";
import LiveClock from "./LiveClock";

const navItems = [
  { href: "/", label: "Hub" },
  { href: "/test-map", label: "Map" },
  { href: "/weather", label: "Weather" },
  { href: "/alerts", label: "Alerts" },
  { href: "/timeline", label: "Timeline" },
  { href: "/sos", label: "SOS" },
  { href: "/reports", label: "Reports" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/test-ui/pwa", label: "PWA" },
];

interface TestUiShellProps {
  title: string;
  description: string;
  mode: DataMode;
  pathname: string;
  children: React.ReactNode;
}

export default function TestUiShell({
  title,
  description,
  mode,
  pathname,
  children,
}: TestUiShellProps) {
  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                Emergency OS prototype
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground/65">
                {description}
              </p>
            </div>
            <div className="flex-shrink-0">
              <LiveClock />
            </div>
          </div>
          <ModeSwitcher mode={mode} pathname={pathname} />
        </div>

        {/* <nav className="flex flex-wrap gap-2 border-b border-border pb-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={`${item.href}?mode=${mode}`}
              className="rounded-md border border-border bg-panel px-3 py-2 text-sm font-medium text-foreground/75 transition-colors hover:border-accent hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav> */}

        {children}
      </div>
    </div>
  );
}

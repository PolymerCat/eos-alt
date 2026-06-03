"use client";

import React, { useState, useEffect } from "react";
import { Clock, Calendar } from "lucide-react";

export default function LiveClock() {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!mounted || !time) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-foreground/30 text-center animate-pulse min-w-[200px] md:min-w-[240px] px-6 py-3.5 border border-transparent">
        <div className="h-4 w-28 bg-border/50 rounded"></div>
        <div className="h-6 w-36 bg-border/50 rounded"></div>
      </div>
    );
  }

  const formattedDate = time.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const formattedTime = time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <div className="flex flex-col items-center justify-center gap-1.5 text-center bg-panel border border-border px-6 py-3 rounded-lg shadow-sm font-mono min-w-[200px] md:min-w-[240px]">
      <div className="flex items-center gap-2 text-xs text-foreground/50">
        <Calendar className="h-3.5 w-3.5 text-accent/85" />
        <span>{formattedDate}</span>
      </div>
      <div className="flex items-center gap-2 text-base font-bold text-foreground tracking-wide mt-0.5">
        <Clock className="h-4 w-4 text-accent" />
        <span>{formattedTime}</span>
      </div>
    </div>
  );
}

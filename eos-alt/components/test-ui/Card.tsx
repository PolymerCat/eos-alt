import React from "react";

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  mode?: "live" | "simulation";
}

export default function Card({
  title,
  description,
  children,
  className = "",
  mode,
  ...props
}: CardProps) {
  // Mode-aware glows and top-border accent highlights
  const modeShadow = 
    mode === "live" 
      ? "shadow-[0_0_15px_-3px_rgba(59,130,246,0.12)] hover:shadow-[0_0_22px_-2px_rgba(59,130,246,0.16)] dark:shadow-[0_0_20px_-5px_rgba(59,130,246,0.2)]"
      : mode === "simulation"
      ? "shadow-[0_0_15px_-3px_rgba(16,185,129,0.12)] hover:shadow-[0_0_22px_-2px_rgba(16,185,129,0.16)] dark:shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]"
      : "shadow-sm";

  const modeBorder =
    mode === "live"
      ? "border-t-[3px] border-t-blue-500/80 border-x-border border-b-border"
      : mode === "simulation"
      ? "border-t-[3px] border-t-emerald-500/80 border-x-border border-b-border"
      : "border-border";

  return (
    <div
      className={`rounded-lg border bg-panel p-5 transition-all text-sm text-foreground/80 ${modeShadow} ${modeBorder} ${className}`}
      {...props}
    >
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-base font-bold text-foreground leading-snug">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-foreground/60 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

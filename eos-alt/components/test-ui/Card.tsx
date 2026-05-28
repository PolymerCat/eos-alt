import React from "react";

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}

export default function Card({
  title,
  description,
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-lg border border-border bg-panel p-5 shadow-sm transition-colors text-sm text-foreground/80 ${className}`}
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

interface PageSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function PageSection({ title, description, children }: PageSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-foreground/60">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

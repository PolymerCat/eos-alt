interface AdminEmptyStateProps {
  title: string;
  description: string;
}

export default function AdminEmptyState({ title, description }: AdminEmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-panel p-6 text-sm">
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="mt-2 leading-6 text-foreground/60">{description}</p>
    </div>
  );
}

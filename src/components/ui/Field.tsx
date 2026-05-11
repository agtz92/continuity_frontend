export function Field({
  label,
  children,
  grow,
}: {
  label: string;
  children: React.ReactNode;
  grow?: boolean;
}) {
  return (
    <div className={grow ? "flex flex-col flex-1 min-h-0" : ""}>
      <label className="block text-xs uppercase tracking-wider text-text-muted mb-1.5 shrink-0">
        {label}
      </label>
      {children}
    </div>
  );
}

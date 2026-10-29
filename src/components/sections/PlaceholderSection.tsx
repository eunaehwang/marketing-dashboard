interface Props {
  title: string;
  subtitle: string;
  description: string;
}

export default function PlaceholderSection({ title, subtitle, description }: Props) {
  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>{title}</h1>
        <p className="text-xs mt-1" style={{ color: "var(--fg-3)" }}>{subtitle}</p>
      </div>
      <div className="rounded-xl border p-10 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="text-4xl mb-3">🚧</div>
        <div className="text-sm font-semibold mb-1" style={{ color: "var(--fg)" }}>준비 중</div>
        <div className="text-xs" style={{ color: "var(--fg-3)" }}>{description}</div>
      </div>
    </div>
  );
}

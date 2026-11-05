interface Props {
  basis: "근거" | "가설";
  size?: "xs" | "sm";
}

export default function BasisBadge({ basis, size = "xs" }: Props) {
  const isEvidence = basis === "근거";
  return (
    <span
      className={`inline-flex items-center font-semibold rounded ${size === "xs" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm"}`}
      style={{
        background: isEvidence ? "#dbeafe" : "#ffedd5",
        color: isEvidence ? "#1d4ed8" : "#c2410c",
      }}
    >
      {basis}
    </span>
  );
}

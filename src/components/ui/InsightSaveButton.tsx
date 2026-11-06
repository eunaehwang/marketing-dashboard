"use client";

import { useState } from "react";
import type { InsightBasis, InsightSource, InsightSourceType } from "@/lib/store";
import { serverPrepend } from "@/lib/storeClient";

interface Props {
  productId: string;
  defaultText: string;
  defaultBasis: InsightBasis;
  sourceType?: InsightSourceType;
  sourceRef?: string;
  triggerLabel?: string;
  onSaved?: (id: string) => void;
}

export default function InsightSaveButton({
  productId,
  defaultText,
  defaultBasis,
  sourceType = "review",
  sourceRef = "",
  triggerLabel = "인사이트로 저장",
  onSaved,
}: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(defaultText);
  const [basis, setBasis] = useState<InsightBasis>(defaultBasis);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "fail">("idle");

  const save = async () => {
    if (!text.trim()) return;
    setStatus("saving");
    const id = `ins-${Date.now()}`;
    const sources: InsightSource[] = sourceRef
      ? [{ type: sourceType, ref: sourceRef }]
      : [];
    const insight = {
      id,
      productId,
      text: text.trim(),
      basis,
      sources,
      createdAt: new Date().toISOString(),
      status: "active" as const,
    };
    const ok = await serverPrepend(`product:${productId}:insights`, insight);
    setStatus(ok ? "ok" : "fail");
    if (ok) {
      onSaved?.(id);
      setTimeout(() => { setOpen(false); setStatus("idle"); }, 1500);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => { setText(defaultText); setBasis(defaultBasis); setStatus("idle"); setOpen(true); }}
        className="text-xs px-2 py-1 rounded-lg transition-colors"
        style={{ background: "var(--surface-2)", color: "var(--fg-3)" }}
      >
        {triggerLabel}
      </button>
    );
  }

  return (
    <div className="mt-2 p-3 rounded-xl border space-y-2" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="w-full rounded-lg border px-3 py-2 text-xs resize-none"
        style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--fg)" }}
      />
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: "var(--fg-3)" }}>분류:</span>
        {(["근거", "가설"] as InsightBasis[]).map((b) => (
          <button
            key={b}
            onClick={() => setBasis(b)}
            className="px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              background: basis === b ? "var(--accent)" : "var(--surface-2)",
              color: basis === b ? "#fff" : "var(--fg-3)",
            }}
          >
            {b}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setOpen(false)}
          className="text-xs px-2 py-1 rounded-lg"
          style={{ color: "var(--fg-3)" }}
        >취소</button>
        <button
          onClick={save}
          disabled={status === "saving" || !text.trim()}
          className="text-xs px-3 py-1.5 rounded-lg font-semibold"
          style={{ background: "var(--accent)", color: "#fff", opacity: status === "saving" ? 0.6 : 1 }}
        >
          {status === "saving" ? "저장 중…" : status === "ok" ? "저장됨 ✓" : "저장"}
        </button>
      </div>
      {status === "fail" && (
        <p className="text-xs" style={{ color: "#b91c1c" }}>⚠️ 저장 실패 — 서버 연결을 확인해주세요.</p>
      )}
    </div>
  );
}

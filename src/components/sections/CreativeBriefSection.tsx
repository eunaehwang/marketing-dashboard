"use client";

import { useState, useEffect } from "react";
import { getProduct } from "@/config/products";
import { BrandProfile } from "@/types";

interface MatrixRow {
  id: string;
  appeal: string;
  target: string;
  hook: string;
  rationale: string;
  type: "근거" | "가설";
  verdict: "O" | "X" | null;
  reason?: string;
}

interface Props {
  productId: string;
}

const BRIEF_KEY = "creative_brief";

function loadApprovedRows(productId: string): MatrixRow[] {
  try {
    const raw = localStorage.getItem(`strategy_matrix_${productId}`);
    if (!raw) return [];
    const all: MatrixRow[] = JSON.parse(raw);
    return all.filter((r) => r.verdict === "O");
  } catch {
    return [];
  }
}

function loadBrandProfile(): BrandProfile | null {
  try {
    const raw = localStorage.getItem("brand_profile");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadSavedBrief(productId: string): string {
  try {
    return localStorage.getItem(`${BRIEF_KEY}_${productId}`) ?? "";
  } catch {
    return "";
  }
}

export default function CreativeBriefSection({ productId }: Props) {
  const product = getProduct(productId);
  const [approvedRows, setApprovedRows] = useState<MatrixRow[]>([]);
  const [brief, setBrief] = useState(() => loadSavedBrief(productId));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setApprovedRows(loadApprovedRows(productId));
    setBrief(loadSavedBrief(productId));
  }, [productId]);

  const generate = async () => {
    if (approvedRows.length === 0) {
      setError("4단계에서 O 판정된 항목이 없습니다. 먼저 전략 매트릭스를 작성해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const brand = loadBrandProfile();
      const res = await fetch("/api/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          productName: product?.name,
          approvedRows,
          brandProfile: brand ? { toneKeywords: brand.toneKeywords, doNotList: brand.doNotList } : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");
      setBrief(data.brief);
      try {
        localStorage.setItem(`${BRIEF_KEY}_${productId}`, data.brief);
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!brief) return;
    await navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--accent)", fontSize: "11px" }}>
          5단계
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>제작 요청서</h1>
        <p className="text-sm mt-1" style={{ color: "var(--fg-3)" }}>
          {product?.name ?? productId} · O 판정 조합으로 광고작업실 브리프를 생성합니다.
        </p>
      </div>

      {/* O 판정 행 미리보기 */}
      {approvedRows.length > 0 ? (
        <div className="mb-5 p-4 rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-xs font-semibold mb-2 uppercase" style={{ color: "var(--fg-3)", fontSize: "10px" }}>
            O 판정 조합 ({approvedRows.length}개)
          </div>
          <ul className="space-y-1">
            {approvedRows.map((r) => (
              <li key={r.id} className="flex items-start gap-2 text-sm" style={{ color: "var(--fg-2)" }}>
                <span style={{ color: "var(--accent)", fontWeight: 700 }}>O</span>
                <span>{r.appeal} → {r.target}</span>
                {r.reason && <span className="text-xs" style={{ color: "var(--fg-3)" }}>({r.reason})</span>}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mb-5 p-4 rounded-xl" style={{ background: "var(--surface-2)", color: "var(--fg-3)" }}>
          <p className="text-sm">아직 O 판정된 항목이 없습니다.</p>
          <p className="text-xs mt-1">4단계(전략 매트릭스)에서 O 판정 후 돌아오세요.</p>
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: "#fee", color: "#c00" }}>{error}</div>
      )}

      <div className="flex gap-2 mb-6">
        <button
          onClick={generate}
          disabled={loading || approvedRows.length === 0}
          className="flex-1 py-3 rounded-xl font-semibold text-sm transition-opacity"
          style={{ background: "var(--accent)", color: "#fff", opacity: (loading || approvedRows.length === 0) ? 0.5 : 1 }}
        >
          {loading ? "생성 중…" : brief ? "요청서 다시 생성" : "제작 요청서 생성"}
        </button>
        {brief && (
          <button
            onClick={copy}
            className="px-5 py-3 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: "var(--surface-2)", color: copied ? "var(--accent)" : "var(--fg-2)" }}
          >
            {copied ? "복사됨 ✓" : "복사"}
          </button>
        )}
      </div>

      {/* 요청서 본문 */}
      {brief && (
        <div
          className="p-5 rounded-xl border prose prose-sm max-w-none"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }}
        >
          <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed" style={{ color: "var(--fg)" }}>
            {brief}
          </pre>
        </div>
      )}
    </div>
  );
}

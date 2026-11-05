"use client";

import { useState, useCallback } from "react";
import { getProduct } from "@/config/products";

interface ReviewResult {
  buyReasons: string[];
  hesitations: string[];
  expressions: string[];
  topInsight: string;
  note: string;
}

interface Props {
  productId: string;
}

const STORAGE_KEY = "review_analysis";

function loadSaved(productId: string): ReviewResult | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${productId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToBrowser(productId: string, result: ReviewResult) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${productId}`, JSON.stringify(result));
  } catch {}
}

export default function ReviewAnalysisSection({ productId }: Props) {
  const product = getProduct(productId);
  const [reviewText, setReviewText] = useState("");
  const [result, setResult] = useState<ReviewResult | null>(() => loadSaved(productId));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setReviewText(text ?? "");
    };
    reader.readAsText(file, "utf-8");
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const analyze = async () => {
    if (!reviewText.trim()) {
      setError("리뷰 텍스트를 먼저 붙여넣거나 파일을 올려주세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analyze-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviews: reviewText,
          productId,
          productName: product?.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "분석 실패");
      const r = data.result as ReviewResult;
      setResult(r);
      saveToBrowser(productId, r);
      // 서버 저장 (fire-and-forget)
      fetch("/api/save-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: `reviews_${productId}`, content: JSON.stringify(r), citations: [] }),
      }).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--accent)", fontSize: "11px" }}>
          2단계
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>고객 분석</h1>
        <p className="text-sm mt-1" style={{ color: "var(--fg-3)" }}>
          {product?.name ?? productId} · 리뷰 CSV/텍스트를 업로드하면 구매 이유·망설임·표현을 추출합니다.
        </p>
      </div>

      {/* 업로드 영역 */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="rounded-xl border-2 border-dashed p-6 text-center mb-4 transition-colors"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="text-sm mb-2" style={{ color: "var(--fg-2)" }}>
          CSV / 텍스트 파일을 드래그하거나
        </div>
        <label className="inline-block cursor-pointer px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
          파일 선택
          <input type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={onFileInput} />
        </label>
        {fileName && (
          <div className="mt-2 text-xs" style={{ color: "var(--fg-3)" }}>📄 {fileName}</div>
        )}
      </div>

      {/* 직접 붙여넣기 */}
      <div className="mb-4">
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--fg-2)" }}>
          또는 리뷰 텍스트 직접 붙여넣기
        </label>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="리뷰 내용을 여기에 붙여넣으세요. (CSV 한 열, 줄바꿈 구분 등 모두 가능)"
          rows={6}
          className="w-full rounded-xl border px-4 py-3 text-sm resize-none"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }}
        />
        <div className="text-right text-xs mt-1" style={{ color: "var(--fg-3)" }}>
          {reviewText.length.toLocaleString()}자
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: "#fee", color: "#c00" }}>
          {error}
        </div>
      )}

      <button
        onClick={analyze}
        disabled={loading}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity"
        style={{ background: "var(--accent)", color: "#fff", opacity: loading ? 0.6 : 1 }}
      >
        {loading ? "분석 중…" : "리뷰 분석하기"}
      </button>

      {/* 결과 */}
      {result && (
        <div className="mt-8 space-y-5">
          {/* 핵심 인사이트 */}
          <div className="p-4 rounded-xl" style={{ background: "var(--accent-light)" }}>
            <div className="text-xs font-semibold uppercase mb-1" style={{ color: "var(--accent)", fontSize: "10px" }}>핵심 인사이트</div>
            <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>{result.topInsight}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 구매 이유 */}
            <Card title="구매 이유" items={result.buyReasons} color="var(--accent)" />
            {/* 망설임 */}
            <Card title="망설임 · 불안" items={result.hesitations} color="#e97316" />
          </div>

          {/* 고객 표현 */}
          <div className="p-4 rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--fg-2)", fontSize: "10px" }}>고객이 쓰는 표현</div>
            <div className="flex flex-wrap gap-2">
              {result.expressions.map((expr, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full text-xs" style={{ background: "var(--surface-2)", color: "var(--fg-2)" }}>
                  {expr}
                </span>
              ))}
            </div>
          </div>

          {result.note && (
            <div className="text-xs px-4 py-2 rounded-lg" style={{ background: "var(--surface-2)", color: "var(--fg-3)" }}>
              ⚠️ {result.note}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Card({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div className="p-4 rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="text-xs font-semibold uppercase mb-2" style={{ color, fontSize: "10px" }}>{title}</div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--fg-2)" }}>
            <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color, marginTop: "6px" }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

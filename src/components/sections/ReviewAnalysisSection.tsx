"use client";

import { useState, useCallback, useEffect } from "react";
import { getProduct } from "@/config/products";
import BasisBadge from "@/components/ui/BasisBadge";
import InsightSaveButton from "@/components/ui/InsightSaveButton";
import { serverPrepend, serverList } from "@/lib/storeClient";

interface ReviewResult {
  buyReasons: string[];
  hesitations: string[];
  expressions: string[];
  topInsight: string;
  note: string;
}

interface StoredReview extends ReviewResult {
  savedAt: string;
}

interface Props {
  productId: string;
}

const LS_KEY = (id: string) => `review_analysis_${id}`;
const serverKey = (id: string) => `product:${id}:customer`;

function lsLoad(productId: string): ReviewResult | null {
  try {
    const raw = localStorage.getItem(LS_KEY(productId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function lsSave(productId: string, result: ReviewResult) {
  try { localStorage.setItem(LS_KEY(productId), JSON.stringify(result)); } catch {}
}

export default function ReviewAnalysisSection({ productId }: Props) {
  const product = getProduct(productId);
  const [reviewText, setReviewText] = useState("");
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [source, setSource] = useState<"server" | "local" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "ok" | "fail">("idle");
  const [migrating, setMigrating] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // 로드: 서버 우선, 없으면 localStorage
  useEffect(() => {
    (async () => {
      const result = await serverList<StoredReview>(serverKey(productId), 1);
      if (!result.ok) {
        setLoadError(true);
        return;
      }
      if (result.data[0]) {
        const { savedAt: _, ...r } = result.data[0];
        setResult(r);
        setSource("server");
      } else {
        const local = lsLoad(productId);
        if (local) { setResult(local); setSource("local"); }
      }
    })();
  }, [productId]);

  const saveToServer = async (r: ReviewResult): Promise<boolean> => {
    const entry: StoredReview = { ...r, savedAt: new Date().toISOString() };
    return serverPrepend(serverKey(productId), entry);
  };

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setReviewText((e.target?.result as string) ?? "");
    reader.readAsText(file, "utf-8");
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const analyze = async () => {
    if (loadError) { setError("서버 연결 실패 — 새로 고침 후 다시 시도해주세요."); return; }
    if (!reviewText.trim()) { setError("리뷰 텍스트를 먼저 붙여넣거나 파일을 올려주세요."); return; }
    setLoading(true);
    setError("");
    setSaveStatus("idle");
    try {
      const res = await fetch("/api/analyze-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviews: reviewText, productId, productName: product?.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "분석 실패");
      const r = data.result as ReviewResult;
      setResult(r);
      lsSave(productId, r);
      const ok = await saveToServer(r);
      setSaveStatus(ok ? "ok" : "fail");
      if (ok) setSource("server");
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  };

  const migrate = async () => {
    if (!result) return;
    setMigrating(true);
    const ok = await saveToServer(result);
    setSaveStatus(ok ? "ok" : "fail");
    if (ok) setSource("server");
    setMigrating(false);
  };

  return (
    <div>
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--accent)", fontSize: "11px" }}>2단계</div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>고객 분석</h1>
        <p className="text-sm mt-1" style={{ color: "var(--fg-3)" }}>
          {product?.name ?? productId} · 리뷰 CSV/텍스트를 업로드하면 구매 이유·망설임·표현을 추출합니다.
        </p>
      </div>

      {/* 업로드 영역 */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="rounded-xl border-2 border-dashed p-6 text-center mb-4"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="text-sm mb-2" style={{ color: "var(--fg-2)" }}>CSV / 텍스트 파일을 드래그하거나</div>
        <label className="inline-block cursor-pointer px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
          파일 선택
          <input type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </label>
        {fileName && <div className="mt-2 text-xs" style={{ color: "var(--fg-3)" }}>📄 {fileName}</div>}
      </div>

      {/* 직접 붙여넣기 */}
      <div className="mb-4">
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--fg-2)" }}>또는 리뷰 텍스트 직접 붙여넣기</label>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="리뷰 내용을 여기에 붙여넣으세요."
          rows={6}
          className="w-full rounded-xl border px-4 py-3 text-sm resize-none"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }}
        />
        <div className="text-right text-xs mt-1" style={{ color: "var(--fg-3)" }}>{reviewText.length.toLocaleString()}자</div>
      </div>

      {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: "#fee", color: "#c00" }}>{error}</div>}

      <button
        onClick={analyze}
        disabled={loading}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity"
        style={{ background: "var(--accent)", color: "#fff", opacity: loading ? 0.6 : 1 }}
      >
        {loading ? "분석 중…" : "리뷰 분석하기"}
      </button>

      {/* 저장 상태 */}
      {saveStatus !== "idle" && (
        <p className="mt-2 text-xs text-center" style={{ color: saveStatus === "fail" ? "#b91c1c" : "var(--fg-3)" }}>
          {saveStatus === "ok" ? "✓ 서버 저장 완료" : "⚠️ 이 브라우저에만 저장됐어요 (서버 저장 실패)"}
        </p>
      )}

      {/* 서버 읽기 실패 경고 */}
      {loadError && (
        <div className="mt-3 px-4 py-3 rounded-lg text-sm flex items-start gap-2" style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fca5a5" }}>
          <span className="flex-shrink-0">⚠️</span>
          <div><strong>서버 연결 실패</strong> — 저장 기능이 비활성화됩니다. 새로 고침해주세요.</div>
        </div>
      )}

      {/* 마이그레이션 버튼 */}
      {source === "local" && result && saveStatus === "idle" && !loadError && (
        <div className="mt-3 px-4 py-3 rounded-lg flex items-center justify-between gap-3" style={{ background: "var(--surface-2)" }}>
          <p className="text-xs" style={{ color: "var(--fg-3)" }}>이 분석은 이 브라우저에만 저장돼 있어요.</p>
          <button
            onClick={migrate}
            disabled={migrating}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: "var(--accent)", color: "#fff", opacity: migrating ? 0.6 : 1 }}
          >
            {migrating ? "저장 중…" : "서버로 옮기기"}
          </button>
        </div>
      )}

      {/* 결과 */}
      {result && (
        <div className="mt-8 space-y-5">
          <div className="p-4 rounded-xl" style={{ background: "var(--accent-light)" }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="text-xs font-semibold uppercase" style={{ color: "var(--accent)", fontSize: "10px" }}>핵심 인사이트</div>
              <BasisBadge basis="근거" />
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>{result.topInsight}</p>
            <div className="mt-2">
              <InsightSaveButton
                productId={productId}
                defaultText={result.topInsight}
                defaultBasis="근거"
                sourceType="review"
                sourceRef={new Date().toISOString().split("T")[0]}
                triggerLabel="인사이트로 저장"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="구매 이유" items={result.buyReasons} color="var(--accent)" />
            <Card title="망설임 · 불안" items={result.hesitations} color="#e97316" />
          </div>

          <div className="p-4 rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--fg-2)", fontSize: "10px" }}>고객이 쓰는 표현</div>
            <div className="flex flex-wrap gap-2">
              {result.expressions.map((expr, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full text-xs" style={{ background: "var(--surface-2)", color: "var(--fg-2)" }}>{expr}</span>
              ))}
            </div>
          </div>

          {result.note && (
            <div className="text-xs px-4 py-2 rounded-lg" style={{ background: "var(--surface-2)", color: "var(--fg-3)" }}>⚠️ {result.note}</div>
          )}
        </div>
      )}
    </div>
  );
}

function Card({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div className="p-4 rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="text-xs font-semibold uppercase" style={{ color, fontSize: "10px" }}>{title}</div>
        <BasisBadge basis="근거" />
      </div>
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

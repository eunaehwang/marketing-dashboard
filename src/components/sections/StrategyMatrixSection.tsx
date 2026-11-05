"use client";

import { useState, useEffect } from "react";
import { getProduct } from "@/config/products";

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

const STORAGE_KEY = "strategy_matrix";

function loadSaved(productId: string): MatrixRow[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${productId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToBrowser(productId: string, rows: MatrixRow[]) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${productId}`, JSON.stringify(rows));
  } catch {}
}

function loadReviewInsight(productId: string): string {
  try {
    const raw = localStorage.getItem(`review_analysis_${productId}`);
    if (!raw) return "";
    const data = JSON.parse(raw);
    return data.topInsight ?? "";
  } catch {
    return "";
  }
}

export default function StrategyMatrixSection({ productId }: Props) {
  const product = getProduct(productId);
  const [rows, setRows] = useState<MatrixRow[]>(() => loadSaved(productId));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingReason, setEditingReason] = useState<string | null>(null);
  const [reasonInput, setReasonInput] = useState("");

  useEffect(() => {
    setRows(loadSaved(productId));
  }, [productId]);

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const insight = loadReviewInsight(productId);
      const res = await fetch("/api/generate-matrix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          productName: product?.name,
          reviewInsight: insight,
          keywords: product?.keywords,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");
      const newRows: MatrixRow[] = (data.matrix?.rows ?? []).map((r: MatrixRow) => ({ ...r, verdict: null }));
      setRows(newRows);
      saveToBrowser(productId, newRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  };

  const setVerdict = (id: string, verdict: "O" | "X") => {
    if (verdict === "O") {
      setEditingReason(id);
      setReasonInput("");
    } else {
      updateVerdict(id, verdict, "");
    }
  };

  const updateVerdict = (id: string, verdict: "O" | "X", reason: string) => {
    setRows((prev) => {
      const next = prev.map((r) => r.id === id ? { ...r, verdict, reason } : r);
      saveToBrowser(productId, next);
      return next;
    });
    setEditingReason(null);
  };

  const oCount = rows.filter((r) => r.verdict === "O").length;
  const xCount = rows.filter((r) => r.verdict === "X").length;

  return (
    <div>
      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--accent)", fontSize: "11px" }}>
          4단계
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>전략 매트릭스</h1>
        <p className="text-sm mt-1" style={{ color: "var(--fg-3)" }}>
          {product?.name ?? productId} · 소구 × 타겟 조합에 O/X를 판정하세요.
        </p>
      </div>

      {/* 판정 현황 */}
      {rows.length > 0 && (
        <div className="flex gap-3 mb-5">
          <div className="px-3 py-2 rounded-lg text-sm" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
            O 판정 <strong>{oCount}</strong>
          </div>
          <div className="px-3 py-2 rounded-lg text-sm" style={{ background: "var(--surface-2)", color: "var(--fg-3)" }}>
            X 판정 <strong>{xCount}</strong>
          </div>
          <div className="px-3 py-2 rounded-lg text-sm" style={{ background: "var(--surface-2)", color: "var(--fg-3)" }}>
            미판정 <strong>{rows.length - oCount - xCount}</strong>
          </div>
        </div>
      )}

      <button
        onClick={generate}
        disabled={loading}
        className="mb-6 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity"
        style={{ background: "var(--accent)", color: "#fff", opacity: loading ? 0.6 : 1 }}
      >
        {loading ? "생성 중…" : rows.length > 0 ? "매트릭스 다시 생성" : "매트릭스 생성"}
      </button>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: "#fee", color: "#c00" }}>{error}</div>
      )}

      {/* 매트릭스 */}
      {rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="p-4 rounded-xl border transition-colors"
              style={{
                background: "var(--surface)",
                borderColor: row.verdict === "O" ? "var(--accent)" : row.verdict === "X" ? "var(--border)" : "var(--border)",
                opacity: row.verdict === "X" ? 0.55 : 1,
              }}
            >
              <div className="flex items-start gap-3">
                {/* O/X 버튼 */}
                <div className="flex gap-1.5 flex-shrink-0 mt-0.5">
                  <button
                    onClick={() => setVerdict(row.id, "O")}
                    className="w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center transition-colors"
                    style={{
                      background: row.verdict === "O" ? "var(--accent)" : "var(--surface-2)",
                      color: row.verdict === "O" ? "#fff" : "var(--fg-3)",
                    }}
                  >O</button>
                  <button
                    onClick={() => setVerdict(row.id, "X")}
                    className="w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center transition-colors"
                    style={{
                      background: row.verdict === "X" ? "#6b7280" : "var(--surface-2)",
                      color: row.verdict === "X" ? "#fff" : "var(--fg-3)",
                    }}
                  >X</button>
                </div>

                {/* 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                      {row.appeal}
                    </span>
                    <span className="text-xs" style={{ color: "var(--fg-3)" }}>→</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--fg-2)" }}>
                      {row.target}
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: row.type === "근거" ? "#dcfce7" : "#fef9c3", color: row.type === "근거" ? "#166534" : "#854d0e" }}
                    >
                      {row.type}
                    </span>
                  </div>
                  <div className="text-sm font-medium mb-1" style={{ color: "var(--fg)" }}>"{row.hook}"</div>
                  <div className="text-xs" style={{ color: "var(--fg-3)" }}>{row.rationale}</div>

                  {row.reason && (
                    <div className="mt-2 text-xs px-2 py-1 rounded" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                      판정 이유: {row.reason}
                    </div>
                  )}
                </div>
              </div>

              {/* O 판정 이유 입력 */}
              {editingReason === row.id && (
                <div className="mt-3 pl-11">
                  <input
                    autoFocus
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && reasonInput.trim()) updateVerdict(row.id, "O", reasonInput.trim()); }}
                    placeholder="O 판정 이유를 입력하세요 (필수, Enter 확인)"
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ background: "var(--surface-2)", borderColor: "var(--accent)", color: "var(--fg)" }}
                  />
                  <div className="flex gap-2 mt-1.5">
                    <button
                      onClick={() => reasonInput.trim() && updateVerdict(row.id, "O", reasonInput.trim())}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: "var(--accent)", color: "#fff" }}
                    >확인</button>
                    <button
                      onClick={() => setEditingReason(null)}
                      className="px-3 py-1.5 rounded-lg text-xs"
                      style={{ background: "var(--surface-2)", color: "var(--fg-3)" }}
                    >취소</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

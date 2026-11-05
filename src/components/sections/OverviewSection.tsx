"use client";

import { useEffect, useState } from "react";

interface MatrixRow {
  id: string;
  appeal: string;
  target: string;
  verdict: "O" | "X" | null;
  reason?: string;
  type: "근거" | "가설";
}

interface StepStatus {
  step: number;
  label: string;
  storageKey: (pid: string) => string;
  done: boolean;
}

function loadJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

interface Props {
  productId: string;
}

export default function OverviewSection({ productId }: Props) {
  const [brand, setBrand] = useState<{ brandName?: string } | null>(null);
  const [matrixRows, setMatrixRows] = useState<MatrixRow[]>([]);
  const [stepsDone, setStepsDone] = useState<boolean[]>([false, false, false, false, false]);

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });

  useEffect(() => {
    try {
      const bp = localStorage.getItem("brand_profile");
      if (bp) setBrand(JSON.parse(bp));
    } catch {}

    const rows = loadJson<MatrixRow[]>(`strategy_matrix_${productId}`) ?? [];
    setMatrixRows(rows);

    const hasReview  = !!loadJson(`review_analysis_${productId}`);
    const hasMarket  = !!localStorage.getItem(`market_research_${productId}`) || !!localStorage.getItem(`research_keyword`);
    const hasMatrix  = rows.length > 0;
    const hasBrief   = !!localStorage.getItem(`creative_brief_${productId}`);
    const hasResult  = false; // 6단계 미구현
    setStepsDone([hasReview, hasMarket, hasMatrix, hasBrief, hasResult]);
  }, [productId]);

  const pendingRows  = matrixRows.filter((r) => r.verdict === null);
  const recentVerdicts = matrixRows
    .filter((r) => r.verdict !== null)
    .slice(-5)
    .reverse();

  const doneCount = stepsDone.filter(Boolean).length;

  const steps = [
    { n: 2, label: "고객 분석" },
    { n: 3, label: "시장·경쟁" },
    { n: 4, label: "전략 매트릭스" },
    { n: 5, label: "제작 요청서" },
    { n: 6, label: "테스트 결과" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>홈</h1>
        <p className="text-xs mt-1" style={{ color: "var(--fg-3)" }}>{today}</p>
      </div>

      {/* 브랜드 없을 때 */}
      {!brand?.brandName && (
        <div className="rounded-xl border p-4 mb-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-sm font-bold mb-1" style={{ color: "var(--fg)" }}>브랜드 프로필이 없어요</div>
          <p className="text-xs mb-3" style={{ color: "var(--fg-3)" }}>저장하면 모든 프롬프트가 자동으로 맞춤화됩니다.</p>
          <button
            className="inline-block text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: "var(--accent)", color: "#fff" }}
            onClick={() => document.dispatchEvent(new CustomEvent("navigate", { detail: "brand" }))}
          >
            브랜드 프로필 작성하기 →
          </button>
        </div>
      )}

      {/* 기획 단계 진행 상태 */}
      <div className="rounded-xl border p-4 mb-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold" style={{ color: "var(--fg)" }}>기획 흐름</div>
          <div className="text-xs" style={{ color: "var(--fg-3)" }}>{doneCount}/{steps.length} 완료</div>
        </div>
        <div className="flex gap-1.5">
          {steps.map((s, i) => (
            <div key={s.n} className="flex-1 min-w-0">
              <div
                className="h-1.5 rounded-full mb-1.5"
                style={{ background: stepsDone[i] ? "var(--accent)" : "var(--surface-2)" }}
              />
              <div className="text-center truncate" style={{ fontSize: "9px", color: stepsDone[i] ? "var(--accent)" : "var(--fg-3)" }}>
                {s.n}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 mt-0.5">
          {steps.map((s) => (
            <div key={s.n} className="flex-1 min-w-0 text-center truncate" style={{ fontSize: "9px", color: "var(--fg-3)" }}>
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* 카드 3개 */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {/* 판정 대기 */}
        <div className="rounded-xl border p-3" style={{ background: "var(--surface)", borderColor: pendingRows.length > 0 ? "var(--accent)" : "var(--border)" }}>
          <div className="text-xs font-semibold mb-1" style={{ color: "var(--fg-3)" }}>판정 대기</div>
          <div className="text-2xl font-bold" style={{ color: pendingRows.length > 0 ? "var(--accent)" : "var(--fg-3)" }}>
            {pendingRows.length}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--fg-3)" }}>
            {pendingRows.length > 0 ? "O/X 필요" : matrixRows.length === 0 ? "매트릭스 없음" : "모두 판정됨"}
          </div>
        </div>

        {/* 새 신호 */}
        <div className="rounded-xl border p-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-xs font-semibold mb-1" style={{ color: "var(--fg-3)" }}>분석 완료</div>
          <div className="text-2xl font-bold" style={{ color: "var(--fg)" }}>
            {stepsDone.slice(0, 2).filter(Boolean).length}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--fg-3)" }}>리뷰·시장 (2단계)</div>
        </div>

        {/* 진행 중 테스트 */}
        <div className="rounded-xl border p-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-xs font-semibold mb-1" style={{ color: "var(--fg-3)" }}>진행 중 테스트</div>
          <div className="text-2xl font-bold" style={{ color: "var(--fg-3)" }}>—</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--fg-3)" }}>6단계 준비 중</div>
        </div>
      </div>

      {/* 최근 판정 기록 */}
      {recentVerdicts.length > 0 ? (
        <div className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-sm font-bold mb-3" style={{ color: "var(--fg)" }}>최근 판정 기록</div>
          <div className="space-y-2">
            {recentVerdicts.map((r) => (
              <div key={r.id} className="flex items-start gap-2.5">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: r.verdict === "O" ? "var(--accent)" : "var(--surface-2)",
                    color: r.verdict === "O" ? "#fff" : "var(--fg-3)",
                  }}
                >
                  {r.verdict}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: "var(--fg)" }}>
                    {r.appeal} → {r.target}
                  </div>
                  {r.reason && (
                    <div className="text-xs mt-0.5 truncate" style={{ color: "var(--fg-3)" }}>{r.reason}</div>
                  )}
                </div>
                <span
                  className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded font-semibold"
                  style={{
                    background: r.type === "근거" ? "#dbeafe" : "#ffedd5",
                    color: r.type === "근거" ? "#1d4ed8" : "#c2410c",
                  }}
                >
                  {r.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-sm font-bold mb-1" style={{ color: "var(--fg)" }}>최근 판정 기록</div>
          <p className="text-xs" style={{ color: "var(--fg-3)" }}>4단계에서 O/X 판정이 쌓이면 여기에 표시됩니다.</p>
        </div>
      )}
    </div>
  );
}

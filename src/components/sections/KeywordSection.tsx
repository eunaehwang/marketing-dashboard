"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "keyword_trends";

// 프레이포잇 기본 키워드 그룹
const DEFAULT_GROUPS = [
  { name: "올샌딩", keywords: ["올샌딩"] },
  { name: "스텐 세정", keywords: ["스텐세정제", "스텐냄비세정", "주방세정제"] },
  { name: "세탁폼", keywords: ["세탁폼", "세탁세제폼", "드럼세탁폼"] },
  { name: "탈취제", keywords: ["탈취제", "섬유탈취제", "냄새제거"] },
  { name: "홈케어", keywords: ["홈케어", "집청소", "살림용품"] },
];

interface PeriodData {
  period: string;
  ratio: number;
}

interface ResultItem {
  title: string;
  keywords: string[];
  data: PeriodData[];
}

interface CachedData {
  savedAt: string;
  results: ResultItem[];
  startDate: string;
  endDate: string;
}

function sparkPath(data: PeriodData[], w: number, h: number): string {
  if (data.length < 2) return "";
  const max = Math.max(...data.map((d) => d.ratio), 1);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (d.ratio / max) * h;
    return `${x},${y}`;
  });
  return `M ${points.join(" L ")}`;
}

function getDateRange() {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 3);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { startDate: fmt(start), endDate: fmt(end) };
}

export default function KeywordSection() {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const cached: CachedData = JSON.parse(stored);
        setResults(cached.results);
        setCachedAt(cached.savedAt);
      }
    } catch {}

    fetch("/api/naver-trend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: "2024-01-01", endDate: "2024-01-01", timeUnit: "date", keywordGroups: [{ groupName: "test", keywords: ["test"] }] }),
    }).then((r) => setHasApiKey(r.status !== 503)).catch(() => setHasApiKey(false));
  }, []);

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = getDateRange();
      const res = await fetch("/api/naver-trend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          timeUnit: "week",
          keywordGroups: DEFAULT_GROUPS.map((g) => ({
            groupName: g.name,
            keywords: g.keywords,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);

      const items: ResultItem[] = data.results.map((r: { title: string; keywords: string[]; data: PeriodData[] }) => ({
        title: r.title,
        keywords: r.keywords,
        data: r.data,
      }));

      setResults(items);
      const now = new Date().toISOString();
      setCachedAt(now);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: now, results: items, startDate, endDate }));
      } catch {}
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const selected = results[selectedIdx];
  const latestRatio = selected?.data.at(-1)?.ratio ?? 0;
  const prevRatio = selected?.data.at(-5)?.ratio ?? latestRatio;
  const trend = latestRatio - prevRatio;

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>키워드 트렌드</h1>
          <p className="text-xs mt-1" style={{ color: "var(--fg-3)" }}>
            네이버 데이터랩 · 최근 3개월 주간 트렌드
            {cachedAt && (
              <span className="ml-2" style={{ color: "var(--fg-3)" }}>
                · 업데이트 {new Date(cachedAt).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchTrends}
          disabled={loading || hasApiKey === false}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40 transition-opacity"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <span style={{ display: "inline-block", animation: loading ? "spin 0.8s linear infinite" : "none" }}>↻</span>
          {loading ? "불러오는 중..." : "데이터 가져오기"}
        </button>
      </div>

      {/* No API key */}
      {hasApiKey === false && (
        <div className="rounded-xl border p-6 mb-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-sm font-bold mb-2" style={{ color: "var(--fg)" }}>🔑 네이버 API 키 설정 필요</div>
          <div className="text-xs mb-3" style={{ color: "var(--fg-3)" }}>
            Vercel 환경 변수에 아래 두 값을 추가해주세요
          </div>
          <div className="flex flex-col gap-1.5">
            {["NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET"].map((k) => (
              <code key={k} className="text-xs px-2 py-1 rounded" style={{ background: "var(--surface-2)", color: "var(--accent)", fontFamily: "monospace" }}>
                {k}
              </code>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg px-4 py-3 text-xs mb-4 font-mono break-all"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }}>
          <span className="font-bold">오류: </span>{error}
        </div>
      )}

      {results.length === 0 && !loading && !error && (
        <div className="rounded-xl border p-10 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-3xl mb-3">📊</div>
          <div className="text-sm font-bold mb-1.5" style={{ color: "var(--fg)" }}>아직 데이터가 없어요</div>
          <div className="text-xs mb-5" style={{ color: "var(--fg-3)" }}>
            API 키를 설정하고 "데이터 가져오기"를 눌러주세요
          </div>
        </div>
      )}

      {results.length > 0 && (
        <>
          {/* Keyword tabs */}
          <div className="flex gap-1.5 flex-wrap mb-4">
            {results.map((r, i) => (
              <button
                key={r.title}
                onClick={() => setSelectedIdx(i)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: i === selectedIdx ? "var(--accent)" : "var(--surface-2)",
                  color: i === selectedIdx ? "#fff" : "var(--fg-3)",
                  border: `1px solid ${i === selectedIdx ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                {r.title}
              </button>
            ))}
          </div>

          {/* Main chart card */}
          {selected && (
            <div className="rounded-xl border p-5 mb-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-base font-bold" style={{ color: "var(--fg)" }}>{selected.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--fg-3)" }}>
                    {selected.keywords.join(", ")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold tabular-nums" style={{ color: "var(--fg)" }}>
                    {latestRatio.toFixed(0)}
                    <span className="text-sm font-normal ml-0.5" style={{ color: "var(--fg-3)" }}>/100</span>
                  </div>
                  <div className="text-xs font-semibold mt-0.5" style={{ color: trend >= 0 ? "var(--positive, #22C55E)" : "var(--negative, #EF4444)" }}>
                    {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)} (4주 전 대비)
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="w-full" style={{ height: 120 }}>
                <svg width="100%" height="120" viewBox={`0 0 400 100`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Area fill */}
                  <path
                    d={`${sparkPath(selected.data, 400, 90)} L 400,100 L 0,100 Z`}
                    fill="url(#trendGrad)"
                  />
                  {/* Line */}
                  <path
                    d={sparkPath(selected.data, 400, 90)}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* X labels */}
              <div className="flex justify-between mt-1">
                {[0, Math.floor(selected.data.length / 2), selected.data.length - 1].map((i) => (
                  <div key={i} className="text-xs" style={{ color: "var(--fg-3)" }}>
                    {selected.data[i]?.period?.slice(5) ?? ""}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All keywords grid */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {results.map((r, i) => {
              const last = r.data.at(-1)?.ratio ?? 0;
              const prev = r.data.at(-5)?.ratio ?? last;
              const delta = last - prev;
              const maxR = Math.max(...r.data.map((d) => d.ratio), 1);
              return (
                <button
                  key={r.title}
                  onClick={() => setSelectedIdx(i)}
                  className="rounded-xl border p-3 text-left transition-all"
                  style={{
                    background: i === selectedIdx ? "var(--accent-light, rgba(107,103,255,0.06))" : "var(--surface)",
                    borderColor: i === selectedIdx ? "var(--accent)" : "var(--border)",
                  }}
                >
                  <div className="text-xs font-bold mb-1" style={{ color: "var(--fg)" }}>{r.title}</div>
                  <div className="text-lg font-bold tabular-nums mb-1" style={{ color: "var(--fg)" }}>
                    {last.toFixed(0)}
                    <span className="text-xs font-normal" style={{ color: "var(--fg-3)" }}>/100</span>
                  </div>
                  <div className="text-xs font-semibold mb-2" style={{ color: delta >= 0 ? "var(--positive, #22C55E)" : "var(--negative, #EF4444)" }}>
                    {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}
                  </div>
                  {/* Mini sparkline */}
                  <svg width="100%" height="24" viewBox="0 0 100 24" preserveAspectRatio="none">
                    <path
                      d={r.data.map((d, j) => {
                        const x = (j / (r.data.length - 1)) * 100;
                        const y = 22 - (d.ratio / maxR) * 20;
                        return `${j === 0 ? "M" : "L"} ${x},${y}`;
                      }).join(" ")}
                      fill="none"
                      stroke={delta >= 0 ? "var(--positive, #22C55E)" : "var(--negative, #EF4444)"}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              );
            })}
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

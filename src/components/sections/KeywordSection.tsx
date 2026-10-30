"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "naver_keywords";

const DEFAULT_KEYWORDS = [
  "올샌딩", "스텐세정제", "세탁폼", "주방세정제", "탈취제",
  "냄비세정", "드럼세탁세제", "섬유탈취", "홈케어용품", "살림용품",
];

interface KeywordItem {
  relKeyword: string;
  monthlyPcQcCnt: number | string;
  monthlyMobileQcCnt: number | string;
  compIdx: string;
  plAvgDepth: number | string;
}

interface DisplayItem {
  keyword: string;
  pc: number;
  mobile: number;
  total: number;
  compIdx: string;
  plAvgDepth: number;
}

const COMP_LABEL: Record<string, string> = { "높음": "높음", "중간": "중간", "낮음": "낮음" };
const COMP_COLOR: Record<string, string> = { "높음": "#EF4444", "중간": "#F59E0B", "낮음": "#22C55E" };

function toNum(v: number | string): number {
  if (typeof v === "number") return v;
  if (v === "< 10") return 5;
  return parseInt(String(v).replace(/,/g, "")) || 0;
}

export default function KeywordSection() {
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"total" | "pc" | "mobile" | "plAvgDepth">("total");
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setItems(parsed.items ?? []);
        setCachedAt(parsed.savedAt ?? null);
      }
    } catch {}

    fetch("/api/naver-keyword?keyword=올샌딩")
      .then((r) => setHasApiKey(r.status !== 503))
      .catch(() => setHasApiKey(false));
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    const allItems: DisplayItem[] = [];

    try {
      for (const kw of DEFAULT_KEYWORDS) {
        const res = await fetch(`/api/naver-keyword?keyword=${encodeURIComponent(kw)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);

        const keywords: KeywordItem[] = data.keywordList ?? [];
        keywords.forEach((k) => {
          const pc = toNum(k.monthlyPcQcCnt);
          const mobile = toNum(k.monthlyMobileQcCnt);
          allItems.push({
            keyword: k.relKeyword,
            pc,
            mobile,
            total: pc + mobile,
            compIdx: k.compIdx ?? "-",
            plAvgDepth: toNum(k.plAvgDepth),
          });
        });

        await new Promise((r) => setTimeout(r, 200));
      }

      const deduped = Array.from(
        new Map(allItems.map((i) => [i.keyword, i])).values()
      ).sort((a, b) => b.total - a.total).slice(0, 50);

      setItems(deduped);
      const now = new Date().toISOString();
      setCachedAt(now);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: now, items: deduped }));
      } catch {}
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const sorted = [...items]
    .filter((i) => !filterText || i.keyword.includes(filterText))
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const maxTotal = sorted[0]?.total ?? 1;

  return (
    <div>
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>키워드 분석</h1>
          <p className="text-xs mt-1" style={{ color: "var(--fg-3)" }}>
            네이버 검색광고 API · 월간 PC+모바일 검색량
            {cachedAt && (
              <span className="ml-2">
                · {new Date(cachedAt).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading || hasApiKey === false}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <span style={{ display: "inline-block", animation: loading ? "spin 0.8s linear infinite" : "none" }}>↻</span>
          {loading ? "불러오는 중..." : "데이터 가져오기"}
        </button>
      </div>

      {hasApiKey === false && (
        <div className="rounded-xl border p-5 mb-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-sm font-bold mb-2" style={{ color: "var(--fg)" }}>🔑 네이버 검색광고 API 설정 필요</div>
          <div className="text-xs mb-3" style={{ color: "var(--fg-3)" }}>Vercel 환경 변수에 아래 3가지를 추가해주세요</div>
          <div className="flex flex-col gap-1.5">
            {["NAVER_AD_CUSTOMER_ID", "NAVER_AD_API_KEY", "NAVER_AD_SECRET_KEY"].map((k) => (
              <code key={k} className="text-xs px-2 py-1 rounded font-mono"
                style={{ background: "var(--surface-2)", color: "var(--accent)" }}>
                {k}
              </code>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg px-4 py-3 text-xs mb-4 font-mono break-all"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }}>
          <span className="font-bold">오류: </span>{error}
        </div>
      )}

      {items.length === 0 && !loading ? (
        <div className="rounded-xl border p-10 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-3xl mb-3">🔍</div>
          <div className="text-sm font-bold mb-1.5" style={{ color: "var(--fg)" }}>키워드 데이터가 없어요</div>
          <div className="text-xs" style={{ color: "var(--fg-3)" }}>API 키 설정 후 "데이터 가져오기"를 눌러주세요</div>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <input
              type="text"
              placeholder="키워드 검색..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs outline-none"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--fg)", minWidth: 140 }}
            />
            <div className="flex gap-1">
              {(["total", "pc", "mobile", "plAvgDepth"] as const).map((s) => (
                <button key={s} onClick={() => setSortBy(s)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                  style={{
                    background: sortBy === s ? "var(--accent)" : "var(--surface-2)",
                    color: sortBy === s ? "#fff" : "var(--fg-3)",
                  }}>
                  {s === "total" ? "전체량" : s === "pc" ? "PC" : s === "mobile" ? "모바일" : "경쟁도"}
                </button>
              ))}
            </div>
            <span className="text-xs ml-auto" style={{ color: "var(--fg-3)" }}>{sorted.length}개 키워드</span>
          </div>

          {/* Table */}
          <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
                    {["키워드", "PC", "모바일", "합계", "경쟁도", "평균노출순위"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide"
                        style={{ color: "var(--fg-3)", fontSize: 10, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((item, i) => (
                    <tr key={item.keyword} className="border-b last:border-0"
                      style={{ borderColor: "var(--border)" }}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold w-5 tabular-nums" style={{ color: "var(--fg-3)" }}>{i + 1}</span>
                          <div>
                            <div className="text-sm font-semibold" style={{ color: "var(--fg)" }}>{item.keyword}</div>
                            <div className="w-24 h-1 mt-1 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                              <div className="h-full rounded-full" style={{ width: `${(item.total / maxTotal) * 100}%`, background: "var(--accent)" }} />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs tabular-nums text-right" style={{ color: "var(--fg-2)" }}>
                        {item.pc.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-xs tabular-nums text-right" style={{ color: "var(--fg-2)" }}>
                        {item.mobile.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-xs tabular-nums text-right font-bold" style={{ color: "var(--fg)" }}>
                        {item.total.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: `${COMP_COLOR[item.compIdx] ?? "var(--fg-3)"}18`,
                            color: COMP_COLOR[item.compIdx] ?? "var(--fg-3)",
                          }}>
                          {COMP_LABEL[item.compIdx] ?? item.compIdx}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs tabular-nums text-right" style={{ color: "var(--fg-3)" }}>
                        {item.plAvgDepth > 0 ? item.plAvgDepth.toFixed(1) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

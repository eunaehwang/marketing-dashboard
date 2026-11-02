"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "competitor_data";
const BRANDS_KEY = "competitor_brands";

const DEFAULT_BRANDS = ["퍼실", "옥시", "유한락스", "테크", "다우니"];

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
}

interface CompetitorData {
  name: string;
  keywords: DisplayItem[];
  totalVolume: number;
  fetchedAt: string;
}

const COMP_COLOR: Record<string, string> = { "높음": "#EF4444", "중간": "#F59E0B", "낮음": "#22C55E" };

function toNum(v: number | string): number {
  if (typeof v === "number") return v;
  if (v === "< 10") return 5;
  return parseInt(String(v).replace(/,/g, "")) || 0;
}

export default function CompetitorSection() {
  const [brands, setBrands] = useState<string[]>(DEFAULT_BRANDS);
  const [results, setResults] = useState<Record<string, CompetitorData>>({});
  const [loading, setLoading] = useState(false);
  const [loadingBrand, setLoadingBrand] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [newBrand, setNewBrand] = useState("");
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const savedBrands = localStorage.getItem(BRANDS_KEY);
      if (savedBrands) setBrands(JSON.parse(savedBrands));
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setResults(parsed);
        const firstKey = Object.keys(parsed)[0];
        if (firstKey) setActiveTab(firstKey);
      }
    } catch {}

    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setHasApiKey(!!d.naverAd))
      .catch(() => setHasApiKey(false));
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    const newResults: Record<string, CompetitorData> = { ...results };

    try {
      for (const brand of brands) {
        setLoadingBrand(brand);
        const res = await fetch(`/api/naver-keyword?keyword=${encodeURIComponent(brand)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);

        const keywords: KeywordItem[] = data.keywordList ?? [];
        const items: DisplayItem[] = keywords
          .map((k) => ({
            keyword: k.relKeyword,
            pc: toNum(k.monthlyPcQcCnt),
            mobile: toNum(k.monthlyMobileQcCnt),
            total: toNum(k.monthlyPcQcCnt) + toNum(k.monthlyMobileQcCnt),
            compIdx: k.compIdx ?? "-",
          }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 20);

        newResults[brand] = {
          name: brand,
          keywords: items,
          totalVolume: items.reduce((s, i) => s + i.total, 0),
          fetchedAt: new Date().toISOString(),
        };

        await new Promise((r) => setTimeout(r, 300));
      }

      setResults(newResults);
      if (!activeTab || !brands.includes(activeTab)) setActiveTab(brands[0]);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newResults)); } catch {}
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      setLoadingBrand(null);
    }
  };

  const addBrand = () => {
    const trimmed = newBrand.trim();
    if (!trimmed || brands.includes(trimmed)) { setNewBrand(""); return; }
    const updated = [...brands, trimmed];
    setBrands(updated);
    setNewBrand("");
    try { localStorage.setItem(BRANDS_KEY, JSON.stringify(updated)); } catch {}
  };

  const removeBrand = (name: string) => {
    const updated = brands.filter((b) => b !== name);
    setBrands(updated);
    if (activeTab === name) setActiveTab(updated[0] ?? null);
    try { localStorage.setItem(BRANDS_KEY, JSON.stringify(updated)); } catch {}
  };

  const activeBrands = brands.filter((b) => results[b]);
  const maxVol = Math.max(...activeBrands.map((b) => results[b]?.totalVolume ?? 0), 1);

  const activeData = activeTab ? results[activeTab] : null;
  const activeMax = activeData?.keywords[0]?.total ?? 1;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>경쟁사 분석</h1>
          <p className="text-xs mt-1" style={{ color: "var(--fg-3)" }}>네이버 검색광고 API · 경쟁사 키워드 볼륨 비교</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditMode((v) => !v)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold"
            style={{ background: editMode ? "var(--accent)" : "var(--surface-2)", color: editMode ? "#fff" : "var(--fg-3)", border: "1px solid var(--border)" }}
          >
            ✏️ 브랜드 편집
          </button>
          <button
            onClick={fetchAll}
            disabled={loading || brands.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            <span style={{ display: "inline-block", animation: loading ? "spin 0.8s linear infinite" : "none" }}>↻</span>
            {loading ? `분석 중 (${loadingBrand})...` : "전체 분석"}
          </button>
        </div>
      </div>

      {/* API key warning */}
      {hasApiKey === false && (
        <div className="rounded-xl border p-4 mb-4 text-sm" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg-3)" }}>
          🔑 네이버 검색광고 API 키가 필요합니다 (키워드 분석 탭에서 설정)
        </div>
      )}

      {/* Edit mode */}
      {editMode && (
        <div className="rounded-xl border p-4 mb-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-xs font-bold mb-3" style={{ color: "var(--fg-3)" }}>경쟁사 브랜드 목록</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {brands.map((b) => (
              <div key={b} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: "var(--surface-2)", color: "var(--fg)", border: "1px solid var(--border)" }}>
                {b}
                <button onClick={() => removeBrand(b)} className="ml-1 opacity-50 hover:opacity-100" style={{ lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="브랜드명 추가..."
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addBrand()}
              className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--fg)" }}
            />
            <button onClick={addBrand}
              className="px-3 py-1.5 rounded-lg text-xs font-bold"
              style={{ background: "var(--accent)", color: "#fff" }}>
              추가
            </button>
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

      {/* Summary comparison */}
      {activeBrands.length > 0 && (
        <div className="rounded-xl border p-4 mb-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: "var(--fg-3)", fontSize: 10, letterSpacing: "0.07em" }}>
            브랜드별 관련 키워드 총 검색량 비교
          </div>
          <div className="flex flex-col gap-3">
            {activeBrands
              .sort((a, b) => (results[b]?.totalVolume ?? 0) - (results[a]?.totalVolume ?? 0))
              .map((brand) => {
                const d = results[brand];
                const pct = (d.totalVolume / maxVol) * 100;
                return (
                  <div key={brand}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold" style={{ color: "var(--fg)" }}>{brand}</span>
                      <span className="text-xs tabular-nums font-bold" style={{ color: "var(--fg)" }}>
                        {d.totalVolume.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--accent)", transition: "width 0.7s" }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Per-brand detail tabs */}
      {activeBrands.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          {/* Tabs */}
          <div className="flex overflow-x-auto" style={{ borderBottom: "1px solid var(--border)" }}>
            {activeBrands.map((brand) => (
              <button
                key={brand}
                onClick={() => setActiveTab(brand)}
                className="px-4 py-2.5 text-xs font-semibold shrink-0"
                style={{
                  color: activeTab === brand ? "var(--accent)" : "var(--fg-3)",
                  borderBottom: activeTab === brand ? "2px solid var(--accent)" : "2px solid transparent",
                  background: "none",
                }}
              >
                {brand}
              </button>
            ))}
          </div>

          {/* Table */}
          {activeData && (
            <div>
              <div className="px-4 py-2 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
                <span className="text-xs font-bold" style={{ color: "var(--fg)" }}>{activeData.name} 관련 키워드 TOP {activeData.keywords.length}</span>
                <span className="text-xs" style={{ color: "var(--fg-3)" }}>
                  {new Date(activeData.fetchedAt).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["키워드", "PC", "모바일", "합계", "경쟁도"].map((h) => (
                        <th key={h} className="px-4 py-2 text-left font-bold"
                          style={{ color: "var(--fg-3)", fontSize: 10, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeData.keywords.map((item, i) => (
                      <tr key={item.keyword} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold w-5 tabular-nums" style={{ color: "var(--fg-3)" }}>{i + 1}</span>
                            <div>
                              <div className="text-sm font-semibold" style={{ color: "var(--fg)" }}>{item.keyword}</div>
                              <div className="w-20 h-1 mt-1 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                                <div className="h-full rounded-full" style={{ width: `${(item.total / activeMax) * 100}%`, background: "var(--accent)" }} />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-xs tabular-nums text-right" style={{ color: "var(--fg-2)" }}>{item.pc.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-xs tabular-nums text-right" style={{ color: "var(--fg-2)" }}>{item.mobile.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-xs tabular-nums text-right font-bold" style={{ color: "var(--fg)" }}>{item.total.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: `${COMP_COLOR[item.compIdx] ?? "var(--fg-3)"}18`, color: COMP_COLOR[item.compIdx] ?? "var(--fg-3)" }}>
                            {item.compIdx || "-"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {activeBrands.length === 0 && !loading && (
        <div className="rounded-xl border p-10 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-3xl mb-3">🏢</div>
          <div className="text-sm font-bold mb-1.5" style={{ color: "var(--fg)" }}>경쟁사 데이터가 없어요</div>
          <div className="text-xs" style={{ color: "var(--fg-3)" }}>브랜드 목록 확인 후 "전체 분석"을 눌러주세요</div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

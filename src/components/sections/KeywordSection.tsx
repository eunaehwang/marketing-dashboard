"use client";

const keywords = [
  { name: "브랜드명 키워드", vol: 48200, pct: 100, delta: "+18%", up: true },
  { name: "선물 추천",       vol: 38400, pct: 80,  delta: "+12%", up: true },
  { name: "뷰티 기프트",     vol: 29100, pct: 60,  delta: "+8%",  up: true },
  { name: "핸드크림 선물",   vol: 21800, pct: 45,  delta: "-3%",  up: false },
  { name: "향기 선물세트",   vol: 18900, pct: 39,  delta: "+22%", up: true },
  { name: "20대 선물",       vol: 15200, pct: 32,  delta: "+5%",  up: true },
  { name: "크리스마스 선물", vol: 12800, pct: 27,  delta: "+41%", up: true },
  { name: "여자친구 선물",   vol: 9400,  pct: 19,  delta: "-1%",  up: false },
];

export default function KeywordSection() {
  return (
    <div>
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>키워드 분석</h1>
          <p className="text-xs mt-1" style={{ color: "var(--fg-3)" }}>네이버 검색광고 API 기반</p>
        </div>
        <button className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: "var(--accent)" }}>
          키워드 추가
        </button>
      </div>

      <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: "var(--surface-2)" }}>
        {["전체", "브랜드", "카테고리", "경쟁사"].map((t, i) => (
          <button key={t} className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{
              background: i === 0 ? "var(--surface)" : "transparent",
              color: i === 0 ? "var(--fg)" : "var(--fg-3)",
              boxShadow: i === 0 ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}>
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-sm font-bold" style={{ color: "var(--fg)" }}>키워드 검색량 순위</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--fg-3)" }}>월간 기준 · PC + 모바일 합산</div>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
            {keywords.length}개
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["키워드", "월 검색량", "점유율", "증감"].map((h) => (
                  <th key={h} className="text-left pb-2.5 border-b text-xs font-semibold uppercase tracking-wide first:text-left last:text-right [&:not(:first-child)]:text-right"
                    style={{ color: "var(--fg-3)", borderColor: "var(--border)", fontSize: "10px", letterSpacing: "0.06em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keywords.map((k, i) => (
                <tr key={k.name} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <td className="py-2.5">
                    <span className="text-xs font-bold mr-2 tabular-nums" style={{ color: "var(--fg-3)" }}>{i + 1}</span>
                    <span className="text-sm font-medium" style={{ color: "var(--fg)" }}>{k.name}</span>
                  </td>
                  <td className="py-2.5 text-right text-xs font-medium tabular-nums" style={{ color: "var(--fg-2)" }}>
                    {k.vol.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <div className="w-20 h-1 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                        <div className="h-full rounded-full" style={{ width: `${k.pct}%`, background: "var(--accent)" }}/>
                      </div>
                      <span className="text-xs tabular-nums w-8 text-right" style={{ color: "var(--fg-3)" }}>{k.pct}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right">
                    <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full ${k.up ? "bg-[var(--positive-light)] text-[var(--positive)]" : "bg-[var(--negative-light)] text-[var(--negative)]"}`}>
                      {k.delta}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

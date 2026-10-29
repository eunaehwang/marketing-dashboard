"use client";

const stats = [
  { label: "주요 키워드 검색량", value: "48,200", delta: "↑ 12.4%", type: "up" },
  { label: "브랜드 트렌드 지수", value: "73",     delta: "↑ 5pt",   type: "up" },
  { label: "최근 후기 평점",     value: "4.6",    delta: "→ 유지",   type: "flat" },
  { label: "경쟁사 대비 순위",   value: "#2",     delta: "↑ 1단계",  type: "up" },
];

const events = [
  { name: "11월 뷰티 키워드 리서치 마감", date: "10/30", color: "#5B57F5" },
  { name: "인플루언서 캠페인 론칭",        date: "11/1",  color: "#10B981" },
  { name: "경쟁사 분기 분석 업데이트",     date: "11/3",  color: "#F59E0B" },
  { name: "월간 성과 리포트 제출",         date: "11/5",  color: "#EF4444" },
];

const deltaStyle: Record<string, string> = {
  up:   "bg-[var(--positive-light)] text-[var(--positive)]",
  down: "bg-[var(--negative-light)] text-[var(--negative)]",
  flat: "bg-[var(--surface-2)] text-[var(--fg-3)]",
};

export default function OverviewSection() {
  const today = new Date(2026, 9, 29).toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-7">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>대시보드 요약</h1>
          <p className="text-xs mt-1" style={{ color: "var(--fg-3)" }}>{today}</p>
        </div>
        <div className="flex gap-2">
          <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border" style={{ background: "var(--surface)", color: "var(--fg-2)", borderColor: "var(--border)" }}>
            데이터 새로고침
          </button>
          <button className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: "var(--accent)" }}>
            리포트 생성
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl p-4 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--fg-3)", fontSize: "11px" }}>{s.label}</div>
            <div className="text-3xl font-bold leading-none tracking-tight tabular-nums" style={{ color: "var(--fg)" }}>{s.value}</div>
            <div className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full mt-2 ${deltaStyle[s.type]}`}>{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-sm font-bold" style={{ color: "var(--fg)" }}>키워드 검색량 추이</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--fg-3)" }}>최근 4주 · 주요 키워드 3개</div>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>실시간</span>
          </div>
          <svg viewBox="0 0 340 110" className="w-full h-auto">
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5B57F5" stopOpacity="0.18"/>
                <stop offset="100%" stopColor="#5B57F5" stopOpacity="0"/>
              </linearGradient>
            </defs>
            {[20, 55, 90].map(y => <line key={y} x1="0" y1={y} x2="340" y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="3,3"/>)}
            {[["0", "18", "50k"], ["8", "53", "30k"], ["8", "88", "10k"]].map(([x, y, l]) => (
              <text key={l} x={x} y={y} fontSize="9" fill="var(--fg-3)">{l}</text>
            ))}
            <path d="M28,72 L90,58 L152,45 L214,38 L276,28 L330,22" fill="none" stroke="#5B57F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M28,72 L90,58 L152,45 L214,38 L276,28 L330,22 L330,90 L28,90 Z" fill="url(#g1)"/>
            <path d="M28,60 L90,62 L152,55 L214,50 L276,45 L330,40" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5,3"/>
            <circle cx="330" cy="22" r="3" fill="#5B57F5"/>
            <circle cx="330" cy="40" r="3" fill="#10B981"/>
            {[["28","10/1"],["90","10/8"],["152","10/15"],["214","10/22"],["276","10/29"]].map(([x,l]) => (
              <text key={l} x={x} y="105" textAnchor="middle" fontSize="9" fill="var(--fg-3)">{l}</text>
            ))}
          </svg>
          <div className="flex gap-4 mt-1">
            {[["#5B57F5","브랜드 키워드"],["#10B981","카테고리 키워드"]].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--fg-2)" }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c }}/>
                {l}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-sm font-bold" style={{ color: "var(--fg)" }}>후기 감성 분포</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--fg-3)" }}>최근 30일 · 총 284건</div>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "var(--positive-light)", color: "var(--positive)" }}>긍정 우세</span>
          </div>
          <div className="flex items-center gap-5 flex-wrap mt-2">
            <svg viewBox="0 0 100 100" width="90" height="90" className="flex-shrink-0">
              <circle cx="50" cy="50" r="38" fill="none" stroke="var(--border)" strokeWidth="14"/>
              <circle cx="50" cy="50" r="38" fill="none" stroke="#10B981" strokeWidth="14" strokeDasharray="148.6 238.76" strokeDashoffset="59.7" transform="rotate(-90 50 50)"/>
              <circle cx="50" cy="50" r="38" fill="none" stroke="#F59E0B" strokeWidth="14" strokeDasharray="50.1 238.76" strokeDashoffset="-88.9" transform="rotate(-90 50 50)"/>
              <circle cx="50" cy="50" r="38" fill="none" stroke="#EF4444" strokeWidth="14" strokeDasharray="40.6 238.76" strokeDashoffset="-138.9" transform="rotate(-90 50 50)"/>
              <text x="50" y="46" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--fg)">62%</text>
              <text x="50" y="58" textAnchor="middle" fontSize="8" fill="var(--fg-3)">긍정</text>
            </svg>
            <div>
              {[["#10B981","긍정","176건 (62%)"],["#F59E0B","중립","60건 (21%)"],["#EF4444","부정","48건 (17%)"]].map(([c,l,v]) => (
                <div key={l} className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: "var(--fg-2)" }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c }}/>
                  {l} <span className="font-semibold ml-1" style={{ color: "var(--fg)" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-bold" style={{ color: "var(--fg)" }}>이번 주 주요 일정</div>
          <button className="text-xs font-semibold px-2.5 py-1 rounded-lg border" style={{ background: "var(--surface)", color: "var(--fg-2)", borderColor: "var(--border)" }}>전체 보기</button>
        </div>
        <div className="flex flex-col gap-2">
          {events.map((e) => (
            <div key={e.name} className="flex items-center gap-2.5 px-3 py-2 rounded-lg" style={{ background: "var(--surface-2)" }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }}/>
              <span className="text-xs font-medium flex-1" style={{ color: "var(--fg)" }}>{e.name}</span>
              <span className="text-xs tabular-nums" style={{ color: "var(--fg-3)" }}>{e.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

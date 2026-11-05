"use client";

import { Section } from "@/types";
import products from "@/config/products";

const flowSteps: { id: Section; step: number; label: string; sublabel: string; icon: string }[] = [
  { id: "step1", step: 1, label: "현황 진단",   sublabel: "문제 정의",          icon: "diag" },
  { id: "step2", step: 2, label: "고객 분석",   sublabel: "리뷰 CSV → 인사이트", icon: "chat" },
  { id: "step3", step: 3, label: "시장·경쟁",  sublabel: "키워드·트렌드·경쟁",  icon: "trend" },
  { id: "step4", step: 4, label: "전략 매트릭스", sublabel: "소구×타겟 O/X",    icon: "matrix" },
  { id: "step5", step: 5, label: "제작 요청서", sublabel: "O 판정 → 브리프",    icon: "brief" },
  { id: "step6", step: 6, label: "테스트 결과", sublabel: "위너/OFF 기록",       icon: "result" },
];

const toolItems: { id: Section; label: string; icon: string }[] = [
  { id: "overview",   label: "홈",            icon: "chart" },
  { id: "brand",      label: "브랜드 프로필", icon: "brand" },
  { id: "aibot",      label: "AI 기획봇",     icon: "bot" },
  { id: "adresearch", label: "광고 리서치",   icon: "adresearch" },
  { id: "settings",   label: "설정",          icon: "settings" },
];

const Icon = ({ name }: { name: string }) => {
  const icons: Record<string, React.ReactNode> = {
    diag:       <><rect x="2" y="2" width="12" height="12" rx="2" fill="none" strokeWidth="1.5"/><path d="M5 8h2l1.5-3L10 11l1.5-3H14" fill="none" strokeWidth="1.5"/></>,
    chat:       <><path d="M14 9.5a5 5 0 01-5 5H6l-4 1.5 1.5-4A5 5 0 012 7.5 5 5 0 017 2.5h2a5 5 0 015 5z" fill="none" strokeWidth="1.5"/></>,
    trend:      <><polyline points="2,12 6,7 9,10 14,4" fill="none" strokeWidth="1.5"/><circle cx="14" cy="4" r="1.2"/></>,
    matrix:     <><rect x="2" y="2" width="5" height="5" rx="1" fill="none" strokeWidth="1.5"/><rect x="9" y="2" width="5" height="5" rx="1" fill="none" strokeWidth="1.5"/><rect x="2" y="9" width="5" height="5" rx="1" fill="none" strokeWidth="1.5"/><rect x="9" y="9" width="5" height="5" rx="1" fill="none" strokeWidth="1.5"/></>,
    brief:      <><path d="M4 2h8l2 2v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" fill="none" strokeWidth="1.5"/><path d="M5 6h6M5 9h6M5 12h4" fill="none" strokeWidth="1.5"/></>,
    result:     <><circle cx="8" cy="8" r="6" fill="none" strokeWidth="1.5"/><path d="M5.5 8l2 2 3-3" fill="none" strokeWidth="1.5"/></>,
    brand:      <><path d="M8 2l1.8 3.6L14 6.3l-3 2.9.7 4.1L8 11.3l-3.7 1.9.7-4.1-3-2.9 4.2-.7z" fill="none" strokeWidth="1.5"/></>,
    bot:        <><rect x="3" y="4" width="10" height="8" rx="2" fill="none" strokeWidth="1.5"/><path d="M6 1.5v2.5M10 1.5v2.5M5.5 9h5M5.5 11h3" fill="none" strokeWidth="1.5"/></>,
    adresearch: <><circle cx="8" cy="8" r="5.5" fill="none" strokeWidth="1.5"/><path d="M8 5v3l2 2" fill="none" strokeWidth="1.5"/><path d="M12.5 12.5l2 2" fill="none" strokeWidth="1.5"/></>,
    chart:      <><rect x="1" y="8" width="4" height="7" rx="1"/><rect x="6" y="5" width="4" height="10" rx="1"/><rect x="11" y="2" width="4" height="13" rx="1"/></>,
    settings:   <><circle cx="8" cy="8" r="2.5" fill="none" strokeWidth="1.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.53 11.53l1.42 1.42M3.05 12.95l1.42-1.42M11.53 4.47l1.42-1.42" strokeWidth="1.5"/></>,
  };
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor" stroke="currentColor">
      {icons[name] ?? null}
    </svg>
  );
};

interface SidebarProps {
  active: Section;
  onNavigate: (section: Section) => void;
  productId: string;
  onProductChange: (id: string) => void;
}

export default function Sidebar({ active, onNavigate, productId, onProductChange }: SidebarProps) {
  return (
    <aside
      className="hidden md:flex flex-col sticky top-0 h-screen border-r overflow-y-auto flex-shrink-0"
      style={{ width: "var(--sidebar-w)", background: "var(--surface)", borderColor: "var(--border)" }}
    >
      {/* 헤더 */}
      <div className="px-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="text-sm font-bold" style={{ color: "var(--accent)" }}>마케터 대시보드</div>

        {/* 0단계: 제품 선택 */}
        <div className="mt-3">
          <div className="text-xs font-semibold mb-1 uppercase tracking-widest" style={{ color: "var(--fg-3)", fontSize: "10px" }}>
            0 · 제품 선택
          </div>
          <select
            value={productId}
            onChange={(e) => onProductChange(e.target.value)}
            className="w-full text-xs px-2 py-1.5 rounded-md border"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--fg)" }}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.shortName}</option>
            ))}
          </select>
        </div>
      </div>

      <nav className="p-2.5 flex-1">
        {/* 단계 흐름 */}
        <div className="mb-5">
          <div className="text-xs font-semibold px-2 mb-2 uppercase tracking-widest" style={{ color: "var(--fg-3)", fontSize: "10px" }}>
            기획 흐름
          </div>
          {flowSteps.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors"
              style={{
                background: active === item.id ? "var(--accent-light)" : "transparent",
                color: active === item.id ? "var(--accent)" : "var(--fg-2)",
              }}
            >
              <div
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{
                  background: active === item.id ? "var(--accent)" : "var(--surface-2)",
                  color: active === item.id ? "#fff" : "var(--fg-3)",
                }}
              >
                {item.step}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium leading-tight">{item.label}</div>
                <div className="text-xs leading-tight truncate" style={{ color: active === item.id ? "var(--accent)" : "var(--fg-3)", opacity: 0.8 }}>
                  {item.sublabel}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* 도구 */}
        <div>
          <div className="text-xs font-semibold px-2 mb-1 uppercase tracking-widest" style={{ color: "var(--fg-3)", fontSize: "10px" }}>
            도구
          </div>
          {toolItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors text-left"
              style={{
                background: active === item.id ? "var(--accent-light)" : "transparent",
                color: active === item.id ? "var(--accent)" : "var(--fg-2)",
              }}
            >
              <Icon name={item.icon} />
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg" style={{ color: "var(--fg-3)" }}>
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: "var(--accent)" }}
          >
            E
          </div>
          <div className="text-xs">eunaehwang</div>
        </div>
      </div>
    </aside>
  );
}

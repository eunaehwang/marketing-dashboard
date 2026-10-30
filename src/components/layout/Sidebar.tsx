"use client";

import { Section } from "@/types";

const navItems: { id: Section; label: string; icon: string; group: "분석" | "도구" }[] = [
  { id: "overview",    label: "요약",       icon: "chart",    group: "분석" },
  { id: "keyword",     label: "키워드 분석", icon: "search",   group: "분석" },
  { id: "trend",       label: "트렌드 분석", icon: "trend",    group: "분석" },
  { id: "reviews",     label: "후기 분석",  icon: "chat",     group: "분석" },
  { id: "competitor",  label: "경쟁사 분석", icon: "people",   group: "분석" },
  { id: "calendar",    label: "날짜 체크",  icon: "calendar", group: "도구" },
  { id: "aibot",       label: "AI 기획봇",  icon: "bot",      group: "도구" },
  { id: "brand",       label: "브랜드 프로필", icon: "brand",  group: "도구" },
];

const Icon = ({ name }: { name: string }) => {
  const icons: Record<string, React.ReactNode> = {
    chart: <><rect x="1" y="8" width="4" height="7" rx="1"/><rect x="6" y="5" width="4" height="10" rx="1"/><rect x="11" y="2" width="4" height="13" rx="1"/></>,
    search: <><circle cx="6.5" cy="6.5" r="4" fill="none" strokeWidth="1.5"/><path d="M11 11l3 3" fill="none" strokeWidth="1.5"/></>,
    trend: <><polyline points="2,12 6,7 9,10 14,4" fill="none" strokeWidth="1.5"/></>,
    chat: <><path d="M14 9.5a5 5 0 01-5 5H6l-4 1.5 1.5-4A5 5 0 012 7.5 5 5 0 017 2.5h2a5 5 0 015 5z" fill="none" strokeWidth="1.5"/></>,
    people: <><circle cx="8" cy="5" r="2.5" fill="none" strokeWidth="1.5"/><path d="M3 13c0-2.8 2.2-5 5-5s5 2.2 5 5" fill="none" strokeWidth="1.5"/></>,
    calendar: <><rect x="1.5" y="3" width="13" height="12" rx="1.5" fill="none" strokeWidth="1.5"/><path d="M5 1.5v3M11 1.5v3M1.5 7h13" fill="none" strokeWidth="1.5"/></>,
    bot: <><rect x="3" y="4" width="10" height="8" rx="2" fill="none" strokeWidth="1.5"/><path d="M6 1.5v2.5M10 1.5v2.5M5.5 9h5M5.5 11h3" fill="none" strokeWidth="1.5"/></>,
    brand: <><path d="M8 2l1.8 3.6L14 6.3l-3 2.9.7 4.1L8 11.3l-3.7 1.9.7-4.1-3-2.9 4.2-.7z" fill="none" strokeWidth="1.5"/></>,
  };
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" stroke="currentColor">
      {icons[name]}
    </svg>
  );
};

interface SidebarProps {
  active: Section;
  onNavigate: (section: Section) => void;
}

export default function Sidebar({ active, onNavigate }: SidebarProps) {
  const groups = ["분석", "도구"] as const;

  return (
    <aside
      className="hidden md:flex flex-col sticky top-0 h-screen border-r overflow-y-auto flex-shrink-0"
      style={{ width: "var(--sidebar-w)", background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="px-4 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="text-base font-bold" style={{ color: "var(--accent)" }}>마케터 대시보드</div>
        <div className="text-xs mt-0.5" style={{ color: "var(--fg-3)" }}>Marketer Dashboard</div>
      </div>

      <nav className="p-2.5 flex-1">
        {groups.map((group) => (
          <div key={group} className="mb-5">
            <div
              className="text-xs font-semibold px-2 mb-1 uppercase tracking-widest"
              style={{ color: "var(--fg-3)", letterSpacing: "0.08em", fontSize: "10px" }}
            >
              {group}
            </div>
            {navItems.filter((n) => n.group === group).map((item) => (
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
        ))}
      </nav>

      <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-[var(--surface-2)]">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: "var(--accent)" }}
          >
            E
          </div>
          <div>
            <div className="text-xs font-semibold" style={{ color: "var(--fg)" }}>eunaehwang</div>
            <div className="text-xs" style={{ color: "var(--fg-3)" }}>마케터</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

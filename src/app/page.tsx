"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import OverviewSection from "@/components/sections/OverviewSection";
import KeywordSection from "@/components/sections/KeywordSection";
import PlaceholderSection from "@/components/sections/PlaceholderSection";
import { Section } from "@/types";

const placeholders: Partial<Record<Section, { title: string; subtitle: string; description: string }>> = {
  trend:      { title: "트렌드 분석",  subtitle: "네이버 데이터랩 API 기반",  description: "네이버 데이터랩 API 연결 후 활성화됩니다." },
  reviews:    { title: "후기 분석",   subtitle: "자사 리뷰 데이터 기반",      description: "리뷰 데이터 소스 연결 후 활성화됩니다." },
  competitor: { title: "경쟁사 분석", subtitle: "검색 점유율 기준",           description: "경쟁사 키워드 설정 후 활성화됩니다." },
  calendar:   { title: "날짜 체크",   subtitle: "캠페인 · 콘텐츠 일정 관리",  description: "일정 관리 기능이 곧 추가됩니다." },
  aibot:      { title: "AI 기획봇",   subtitle: "분석 데이터 기반 콘텐츠 기획 제안", description: "API 연결 후 Claude AI 기반 기획봇이 활성화됩니다." },
};

const mobileNavItems: { id: Section; label: string }[] = [
  { id: "overview",   label: "요약" },
  { id: "keyword",    label: "키워드" },
  { id: "trend",      label: "트렌드" },
  { id: "calendar",   label: "일정" },
  { id: "aibot",      label: "AI봇" },
];

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<Section>("overview");

  const renderSection = () => {
    if (activeSection === "overview") return <OverviewSection />;
    if (activeSection === "keyword") return <KeywordSection />;
    const p = placeholders[activeSection];
    if (p) return <PlaceholderSection {...p} />;
    return null;
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar active={activeSection} onNavigate={setActiveSection} />

      <main className="flex-1 min-w-0 px-5 pt-7 pb-24 md:pb-10 max-w-5xl">
        {renderSection()}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t flex" style={{ background: "var(--surface)", borderColor: "var(--border)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {mobileNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className="flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium"
            style={{ color: activeSection === item.id ? "var(--accent)" : "var(--fg-3)" }}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

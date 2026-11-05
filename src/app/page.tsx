"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import OverviewSection from "@/components/sections/OverviewSection";
import AiBotSection from "@/components/sections/AiBotSection";
import BrandSection from "@/components/sections/BrandSection";
import AdResearchTab from "@/components/sections/AdResearchTab";
import PlaceholderSection from "@/components/sections/PlaceholderSection";
import ReviewAnalysisSection from "@/components/sections/ReviewAnalysisSection";
import MarketSection from "@/components/sections/MarketSection";
import StrategyMatrixSection from "@/components/sections/StrategyMatrixSection";
import CreativeBriefSection from "@/components/sections/CreativeBriefSection";
import { Section } from "@/types";
import products from "@/config/products";

const mobileFlowItems: { id: Section; label: string }[] = [
  { id: "step2", label: "고객" },
  { id: "step3", label: "시장" },
  { id: "step4", label: "전략" },
  { id: "step5", label: "요청서" },
  { id: "brand", label: "브랜드" },
];

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<Section>("step2");
  const [productId, setProductId] = useState<string>(products[0]?.id ?? "");

  const renderSection = () => {
    switch (activeSection) {
      case "step1":
        return <PlaceholderSection title="1. 현황 진단" subtitle="Meta 인사이트 · Cafe24 UTM" description="Meta/Cafe24 연동 후 활성화됩니다. (3단계 이후 작업)" />;
      case "step2":
        return <ReviewAnalysisSection productId={productId} />;
      case "step3":
        return <MarketSection productId={productId} />;
      case "step4":
        return <StrategyMatrixSection productId={productId} />;
      case "step5":
        return <CreativeBriefSection productId={productId} />;
      case "step6":
        return <PlaceholderSection title="6. 테스트 결과" subtitle="Meta 1-1-1 결과 기록" description="Meta API 연동 후 활성화됩니다. (3단계 이후 작업)" />;
      case "overview":
        return <OverviewSection />;
      case "aibot":
        return <AiBotSection />;
      case "brand":
        return <BrandSection />;
      case "adresearch":
        return <AdResearchTab />;
      default:
        return <PlaceholderSection title="준비 중" subtitle="" description="곧 추가됩니다." />;
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar
        active={activeSection}
        onNavigate={setActiveSection}
        productId={productId}
        onProductChange={setProductId}
      />

      <main className="flex-1 min-w-0 px-5 pt-7 pb-24 md:pb-10 max-w-5xl">
        {renderSection()}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t flex" style={{ background: "var(--surface)", borderColor: "var(--border)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {mobileFlowItems.map((item) => (
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

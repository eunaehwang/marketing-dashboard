"use client";

import { useState } from "react";
import KeywordSection from "./KeywordSection";
import TrendSection from "./TrendSection";
import AdResearchTab from "./AdResearchTab";
import { getProduct } from "@/config/products";

type Tab = "keyword" | "trend" | "adresearch";

const TABS: { id: Tab; label: string; desc: string }[] = [
  { id: "keyword",    label: "키워드 분석",  desc: "네이버 검색량 · 경쟁도" },
  { id: "trend",      label: "트렌드 · 날씨", desc: "계절성 수요 변화" },
  { id: "adresearch", label: "광고 리서치",  desc: "시장·경쟁·고객 Perplexity" },
];

interface Props {
  productId: string;
}

export default function MarketSection({ productId }: Props) {
  const [tab, setTab] = useState<Tab>("keyword");
  const product = getProduct(productId);

  return (
    <div>
      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--accent)", fontSize: "11px" }}>
          3단계
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>시장·경쟁</h1>
        <p className="text-sm mt-1" style={{ color: "var(--fg-3)" }}>
          {product?.name ?? productId} · 키워드 수요, 트렌드, 경쟁사 소재를 확인합니다.
        </p>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: "var(--surface-2)" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: tab === t.id ? "var(--surface)" : "transparent",
              color: tab === t.id ? "var(--accent)" : "var(--fg-3)",
            }}
          >
            <div>{t.label}</div>
            <div className="text-xs font-normal" style={{ color: tab === t.id ? "var(--fg-3)" : "var(--fg-3)", opacity: 0.7 }}>{t.desc}</div>
          </button>
        ))}
      </div>

      {/* 탭 내용 */}
      {tab === "keyword"    && <KeywordSection />}
      {tab === "trend"      && <TrendSection />}
      {tab === "adresearch" && <AdResearchTab />}
    </div>
  );
}

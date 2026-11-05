"use client";

import { useEffect, useState } from "react";

interface BrandProfile {
  brandName?: string;
}

export default function OverviewSection() {
  const [brand, setBrand] = useState<BrandProfile | null>(null);

  useEffect(() => {
    try {
      const bp = localStorage.getItem("brand_profile");
      if (bp) setBrand(JSON.parse(bp));
    } catch {}
  }, []);

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>홈</h1>
        <p className="text-xs mt-1" style={{ color: "var(--fg-3)" }}>{today}</p>
      </div>

      {/* 브랜드 프로필 상태 */}
      {!brand?.brandName ? (
        <div className="rounded-xl border p-5 mb-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-sm font-bold mb-1" style={{ color: "var(--fg)" }}>브랜드 프로필이 없어요</div>
          <p className="text-xs mb-3" style={{ color: "var(--fg-3)" }}>
            브랜드 정보를 저장하면 광고 리서치·기획 프롬프트가 자동으로 맞춤화됩니다.
          </p>
          <a
            href="#brand"
            className="inline-block text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: "var(--accent)", color: "#fff" }}
            onClick={(e) => { e.preventDefault(); document.dispatchEvent(new CustomEvent("navigate", { detail: "brand" })); }}
          >
            브랜드 프로필 작성하기 →
          </a>
        </div>
      ) : (
        <div className="rounded-xl border px-4 py-3 mb-4 flex items-center gap-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0" style={{ background: "var(--accent)" }}>
            {brand.brandName.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--fg)" }}>{brand.brandName}</div>
            <div className="text-xs" style={{ color: "var(--fg-3)" }}>브랜드 프로필 저장됨</div>
          </div>
        </div>
      )}

      {/* 기획 흐름 안내 */}
      <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="text-sm font-bold mb-3" style={{ color: "var(--fg)" }}>기획 흐름 시작하기</div>
        <div className="space-y-2">
          {[
            { step: 2, label: "고객 분석", desc: "리뷰 CSV 업로드 → 구매 이유·망설임 추출", key: "step2" },
            { step: 3, label: "시장·경쟁",  desc: "키워드 검색량·트렌드·경쟁사 확인",        key: "step3" },
            { step: 4, label: "전략 매트릭스", desc: "소구×타겟 조합 O/X 판정",              key: "step4" },
            { step: 5, label: "제작 요청서", desc: "O 판정 조합 → 광고작업실 브리프",         key: "step5" },
          ].map((item) => (
            <div key={item.key} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: "var(--surface-2)" }}>
              <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                {item.step}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold" style={{ color: "var(--fg)" }}>{item.label}</div>
                <div className="text-xs" style={{ color: "var(--fg-3)" }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

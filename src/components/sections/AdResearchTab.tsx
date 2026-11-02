"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import type { BrandProfile } from "@/types";

const STORAGE_KEY = "adresearch_results";

interface ResearchResult {
  content: string;
  citations: string[];
  fetchedAt: string;
}

interface ResearchData {
  market?: ResearchResult;
  competitor?: ResearchResult;
  customer?: ResearchResult;
}

type ResearchType = "market" | "competitor" | "customer";

const CONFIGS: Record<ResearchType, { label: string; icon: string; desc: string }> = {
  market:     { label: "시장 트렌드",      icon: "📈", desc: "업계 동향 · 광고 영상 트렌드 · 이미지/소재 크리에이티브 트렌드" },
  competitor: { label: "경쟁사 광고 분석", icon: "🏢", desc: "경쟁 브랜드 크리에이티브 방향 · 캠페인 전략 · 메시지 포지셔닝" },
  customer:   { label: "고객 반응",        icon: "💬", desc: "구매 동기 · 불만사항 · SNS 감성 · 광고 반응 패턴" },
};

function buildPrompt(type: ResearchType, brand: Partial<BrandProfile>): string {
  const name        = brand.brandName    || "브랜드";
  const category    = brand.industry     || "소비재";    // products 제외, industry만
  const competitors = brand.competitors  || `${name} 주요 경쟁 브랜드`;
  const ageRange    = brand.targetAge?.join(", ") || "";
  const gender      = brand.targetGender || "";
  const targetLine  = [ageRange, gender, brand.targetDescription].filter(Boolean).join(" · ");
  const tone        = brand.toneKeywords?.join(", ") || "";
  const channels    = brand.channels?.join(", ")    || "";
  const products    = brand.products || "";
  const success     = brand.successCases || "";

  const ctx = [
    `- 브랜드: ${name}`,
    `- 카테고리: ${category}`,
    products   && `- 주요 제품: ${products}`,
    targetLine && `- 타겟: ${targetLine}`,
    tone       && `- 톤앤매너: ${tone}`,
    channels   && `- 채널: ${channels}`,
    success    && `- 성공 사례: ${success}`,
  ].filter(Boolean).join("\n");

  if (type === "market") {
    return `한국 ${category} 시장과 광고 크리에이티브 트렌드를 분석해줘.

[브랜드 컨텍스트]
${ctx}

아래 항목을 포함해서 분석해줘:

1. **시장 동향**: 2024-2025년 ${category} 시장 주요 변화와 소비자 트렌드
2. **광고 영상 트렌드**: 이 카테고리에서 효과적인 영상 포맷 (숏폼, 스토리텔링, UGC, 바이럴 등) — 실제 사례 포함
3. **이미지/소재 크리에이티브 트렌드**: 비주얼 스타일, 컬러 톤, 촬영 방식, 모델/제품 노출 방식
4. **광고 카피 트렌드**: 어떤 메시지와 톤앤매너가 소비자 반응을 얻는지
5. **채널별 광고 트렌드**: Instagram, YouTube, TikTok, 카카오 등 채널별 효과적인 소재 방향

한국 소비자 기준, 최신 사례와 함께 구체적으로 알려줘.`;
  }

  if (type === "competitor") {
    return `한국 ${category} 시장에서 경쟁 브랜드들의 광고 크리에이티브 전략을 분석해줘.

[브랜드 컨텍스트]
${ctx}
- 분석할 경쟁사: ${competitors}

아래 항목을 포함해서 분석해줘:

1. **크리에이티브 방향성**: 각 경쟁 브랜드의 광고 비주얼 스타일과 톤앤매너
2. **핵심 메시지**: 각 브랜드가 강조하는 USP와 소비자에게 전달하는 핵심 메시지
3. **최근 주목받은 캠페인**: SNS/디지털에서 반응이 좋았던 캠페인 사례
4. **타겟팅 전략**: 어떤 타겟층에 어떻게 접근하는지
5. **광고 소재 특징**: 영상 vs 이미지, UGC 활용 여부, 인플루언서 활용 방식
6. **${name}의 기회**: 경쟁사 대비 광고 전략에서 차별화할 수 있는 포인트

한국 시장 기준으로 최신 정보를 기반으로 분석해줘.`;
  }

  return `한국 소비자들의 ${category} 제품에 대한 반응을 분석해줘.

[브랜드 컨텍스트]
${ctx}

아래 항목을 분석해줘:

1. **구매 동기**: 소비자들이 ${category} 제품을 구매하는 주요 이유와 기대 가치
2. **긍정 반응**: SNS/커뮤니티에서 칭찬받는 요소, 재구매 이유
3. **불만사항**: 주요 불만과 개선 요구 (제품, 가격, 광고 등)
4. **광고 반응 패턴**: 어떤 유형의 광고/콘텐츠에 긍정적으로 반응하는지
5. **주요 언급 키워드**: SNS, 커뮤니티에서 자주 쓰이는 단어와 감성
6. **구매 결정 요인**: 구매를 최종 결정하게 만드는 핵심 요소

커뮤니티, 리뷰, SNS를 기반으로 실제 소비자 목소리를 반영해서 분석해줘.`;
}

function CitationLink({ url, index }: { url: string; index: number }) {
  let domain = url;
  try { domain = new URL(url).hostname.replace("www.", ""); } catch {}
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
      style={{ background: "var(--surface-2)", color: "var(--accent)", border: "1px solid var(--border)", textDecoration: "none" }}
    >
      <span style={{ opacity: 0.6 }}>[{index + 1}]</span>
      <span className="max-w-[140px] truncate">{domain}</span>
    </a>
  );
}

function ResultView({ result }: { result: ResearchResult }) {
  return (
    <div>
      <div className="md-body mb-4">
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 style={{ fontSize: 17, fontWeight: 700, color: "var(--fg)", margin: "18px 0 6px", lineHeight: 1.4 }}>{children}</h1>,
            h2: ({ children }) => <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--fg)", margin: "16px 0 5px", lineHeight: 1.4 }}>{children}</h2>,
            h3: ({ children }) => <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--fg)", margin: "12px 0 4px", lineHeight: 1.4 }}>{children}</h3>,
            p:  ({ children }) => <p  style={{ fontSize: 13, color: "var(--fg-2)", margin: "0 0 8px", lineHeight: 1.75 }}>{children}</p>,
            ul: ({ children }) => <ul style={{ margin: "4px 0 10px 0", paddingLeft: 18 }}>{children}</ul>,
            ol: ({ children }) => <ol style={{ margin: "4px 0 10px 0", paddingLeft: 18 }}>{children}</ol>,
            li: ({ children }) => <li style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.7, marginBottom: 3 }}>{children}</li>,
            strong: ({ children }) => <strong style={{ fontWeight: 700, color: "var(--fg)" }}>{children}</strong>,
            em: ({ children }) => <em style={{ fontStyle: "italic", color: "var(--fg-2)" }}>{children}</em>,
            code: ({ children }) => <code style={{ fontSize: 11, padding: "1px 5px", borderRadius: 4, background: "var(--surface-2)", color: "var(--accent)", fontFamily: "monospace" }}>{children}</code>,
            blockquote: ({ children }) => <blockquote style={{ borderLeft: "3px solid var(--accent)", paddingLeft: 12, margin: "8px 0", color: "var(--fg-3)", fontStyle: "italic" }}>{children}</blockquote>,
            hr: () => <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "12px 0" }} />,
          }}
        >
          {result.content}
        </ReactMarkdown>
      </div>
      {result.citations.length > 0 && (
        <div className="pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="text-xs font-bold mb-2" style={{ color: "var(--fg-3)", letterSpacing: "0.05em" }}>
            출처 {result.citations.length}건
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.citations.map((url, i) => (
              <CitationLink key={i} url={url} index={i} />
            ))}
          </div>
        </div>
      )}
      <div className="text-xs mt-3" style={{ color: "var(--fg-3)" }}>
        분석: {new Date(result.fetchedAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}

export default function AdResearchTab() {
  const [brand, setBrand] = useState<Partial<BrandProfile>>({});
  const [data, setData] = useState<ResearchData>({});
  const [loading, setLoading] = useState<Record<ResearchType, boolean>>({ market: false, competitor: false, customer: false });
  const [errors, setErrors] = useState<Record<ResearchType, string | null>>({ market: null, competitor: null, customer: null });
  const [hasOR, setHasOR] = useState<boolean | null>(null);
  const [expanded, setExpanded] = useState<Record<ResearchType, boolean>>({ market: true, competitor: true, customer: true });

  useEffect(() => {
    try {
      const bp = localStorage.getItem("brand_profile");
      if (bp) setBrand(JSON.parse(bp));
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setData(JSON.parse(saved));
    } catch {}
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setHasOR(!!d.openRouter))
      .catch(() => setHasOR(false));
  }, []);

  const saveData = (next: ResearchData) => {
    setData(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const runResearch = async (type: ResearchType) => {
    setLoading((p) => ({ ...p, [type]: true }));
    setErrors((p) => ({ ...p, [type]: null }));
    try {
      const res = await fetch("/api/openrouter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "perplexity/sonar-pro",
          messages: [{ role: "user", content: buildPrompt(type, brand) }],
          stream: false,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? `HTTP ${res.status}`);
      }
      const result = await res.json();
      const next = { ...data, [type]: { content: result.content, citations: result.citations ?? [], fetchedAt: new Date().toISOString() } };
      saveData(next);
    } catch (err) {
      setErrors((p) => ({ ...p, [type]: err instanceof Error ? err.message : String(err) }));
    } finally {
      setLoading((p) => ({ ...p, [type]: false }));
    }
  };

  const runAll = () => {
    (["market", "competitor", "customer"] as ResearchType[]).forEach(runResearch);
  };

  const anyLoading = Object.values(loading).some(Boolean);

  const types = ["market", "competitor", "customer"] as ResearchType[];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>광고 리서치</h1>
          <p className="text-xs mt-1" style={{ color: "var(--fg-3)" }}>Perplexity AI · 시장 트렌드 · 경쟁사 · 고객 반응</p>
        </div>
        <button
          onClick={runAll}
          disabled={anyLoading || !hasOR}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <span style={{ display: "inline-block", animation: anyLoading ? "spin 0.8s linear infinite" : "none" }}>↻</span>
          {anyLoading ? "분석 중..." : "전체 분석"}
        </button>
      </div>

      {/* Brand context strip */}
      {brand.brandName ? (
        <div className="rounded-xl border px-4 py-2.5 mb-4 flex flex-wrap gap-x-4 gap-y-1 items-center"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <span className="text-xs font-bold" style={{ color: "var(--fg)" }}>{brand.brandName}</span>
          {brand.industry && <span className="text-xs" style={{ color: "var(--fg-3)" }}>{brand.industry}</span>}
          {brand.targetAge && brand.targetAge.length > 0 && (
            <span className="text-xs" style={{ color: "var(--fg-3)" }}>타겟: {brand.targetAge.join(", ")}</span>
          )}
          {brand.competitors && (
            <span className="text-xs" style={{ color: "var(--fg-3)" }}>
              경쟁사: {brand.competitors}
            </span>
          )}
        </div>
      ) : (
        <div className="rounded-xl border px-4 py-3 mb-4 text-xs" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg-3)" }}>
          💡 브랜드 프로필을 먼저 작성하면 더 정확한 분석을 받을 수 있어요
        </div>
      )}

      {/* OpenRouter warning */}
      {hasOR === false && (
        <div className="rounded-xl border p-4 mb-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-sm font-bold mb-1" style={{ color: "var(--fg)" }}>🔑 OpenRouter API 키 필요</div>
          <code className="text-xs" style={{ color: "var(--accent)" }}>OPENROUTER_API_KEY</code>
          <span className="text-xs ml-2" style={{ color: "var(--fg-3)" }}>Vercel 환경 변수에 추가해주세요</span>
        </div>
      )}

      {/* Research cards */}
      <div className="flex flex-col gap-3">
        {types.map((type) => {
          const cfg = CONFIGS[type];
          const result = data[type];
          const isLoading = loading[type];
          const err = errors[type];
          const isExpanded = expanded[type];

          return (
            <div key={type} className="rounded-xl border overflow-hidden"
              style={{ background: "var(--surface)", borderColor: isLoading ? "var(--accent)" : "var(--border)", transition: "border-color 0.2s" }}>

              {/* Card header */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer"
                style={{ background: "var(--surface-2)", borderBottom: isExpanded ? "1px solid var(--border)" : "none" }}
                onClick={() => setExpanded((p) => ({ ...p, [type]: !p[type] }))}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{cfg.icon}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold" style={{ color: "var(--fg)" }}>{cfg.label}</div>
                    <div className="text-xs truncate" style={{ color: "var(--fg-3)" }}>{cfg.desc}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  {result && !isLoading && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E" }}>완료</span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); runResearch(type); }}
                    disabled={isLoading || !hasOR}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold disabled:opacity-40"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    <span style={{ display: "inline-block", animation: isLoading ? "spin 0.8s linear infinite" : "none", fontSize: 11 }}>↻</span>
                    {isLoading ? "분석 중..." : result ? "재분석" : "분석 시작"}
                  </button>
                  <span style={{ color: "var(--fg-3)", fontSize: 11 }}>{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Card body */}
              {isExpanded && (
                <div className="p-4">
                  {isLoading && (
                    <div className="flex items-center gap-2 py-4 justify-center text-xs" style={{ color: "var(--fg-3)" }}>
                      <span style={{ animation: "spin 0.8s linear infinite", display: "inline-block", fontSize: 16 }}>↻</span>
                      Perplexity sonar-pro로 리서치 중...
                    </div>
                  )}
                  {err && !isLoading && (
                    <div className="text-xs font-mono p-3 rounded-lg break-all"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}>
                      오류: {err}
                    </div>
                  )}
                  {result && !isLoading && <ResultView result={result} />}
                  {!result && !isLoading && !err && (
                    <div className="py-6 text-center text-xs" style={{ color: "var(--fg-3)" }}>
                      "분석 시작" 버튼을 눌러 리서치를 시작하세요
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

interface HealthStatus {
  anthropic: boolean;
  naverAd: boolean;
  openRouter: boolean;
  upstash: boolean | null;
}

const checks: { label: string; key: keyof HealthStatus; env: string; action: string; desc: string }[] = [
  { label: "Claude API",    key: "anthropic",   env: "ANTHROPIC_API_KEY",       action: "Vercel 환경변수에 추가", desc: "2·3·4·5단계 LLM 기능 전체" },
  { label: "OpenRouter",    key: "openRouter",  env: "OPENROUTER_API_KEY",      action: "Vercel 환경변수에 추가", desc: "AI봇 (Perplexity sonar-pro 검색)" },
  { label: "Upstash Redis", key: "upstash",     env: "UPSTASH_REDIS_REST_URL",  action: "upstash.com 무료 플랜 → Vercel 연결", desc: "서버 저장 (없으면 브라우저만)" },
  { label: "네이버 검색광고 API", key: "naverAd", env: "NAVER_AD_API_KEY 외 2개", action: "네이버 검색광고 개발자 센터에서 발급", desc: "3단계 키워드 검색량" },
];

export default function SettingsSection() {
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => {});
  }, []);

  const connected = health ? checks.filter((c) => health[c.key]).length : 0;

  return (
    <div>
      <div className="mb-7">
        <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--accent)", fontSize: "11px" }}>
          설정
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>서비스 연결</h1>
        <p className="text-sm mt-1" style={{ color: "var(--fg-3)" }}>
          {health ? `${connected}/${checks.length} 연결됨` : "확인 중…"}
        </p>
      </div>

      <div className="space-y-3">
        {checks.map((c) => {
          const status = health ? health[c.key] : null;
          return (
            <div
              key={c.key}
              className="rounded-xl border p-4"
              style={{
                background: "var(--surface)",
                borderColor: status === true ? "rgba(34,197,94,0.3)" : status === false ? "rgba(239,68,68,0.15)" : "var(--border)",
              }}
            >
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{
                    background: status === true ? "rgba(34,197,94,0.15)" : status === false ? "rgba(239,68,68,0.1)" : "var(--surface-2)",
                    color: status === true ? "#16a34a" : status === false ? "#dc2626" : "var(--fg-3)",
                  }}
                >
                  {status === true ? "✓" : status === false ? "✕" : "·"}
                </div>
                <div className="font-semibold text-sm" style={{ color: "var(--fg)" }}>{c.label}</div>
                <div className="text-xs ml-auto" style={{ color: status === true ? "#16a34a" : status === false ? "#dc2626" : "var(--fg-3)" }}>
                  {status === true ? "연결됨" : status === false ? "미연결" : "확인 중"}
                </div>
              </div>
              <p className="text-xs pl-9 mb-2" style={{ color: "var(--fg-3)" }}>{c.desc}</p>
              {status === false && (
                <div className="pl-9 text-xs space-y-0.5">
                  <div><span style={{ color: "var(--fg-3)" }}>환경변수: </span><code style={{ color: "var(--accent)" }}>{c.env}</code></div>
                  <div style={{ color: "var(--fg-3)" }}>→ {c.action}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

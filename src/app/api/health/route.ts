import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Upstash 연결 여부: 환경변수 존재 여부를 먼저 확인하고, 실제 ping으로 검증
  let upstash: boolean | null = null;
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!upstashUrl || !upstashToken) {
    upstash = false;
  } else {
    try {
      const res = await fetch(`${upstashUrl}/ping`, {
        headers: { Authorization: `Bearer ${upstashToken}` },
        signal: AbortSignal.timeout(3000),
      });
      upstash = res.ok;
    } catch {
      upstash = false;
    }
  }

  return NextResponse.json({
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    naverAd: !!(
      process.env.NAVER_AD_CUSTOMER_ID &&
      process.env.NAVER_AD_API_KEY &&
      process.env.NAVER_AD_SECRET_KEY
    ),
    openRouter: !!process.env.OPENROUTER_API_KEY,
    upstash,
  });
}

import { Redis } from "@upstash/redis";
const kv = Redis.fromEnv();
import { NextResponse } from "next/server";

export const maxDuration = 30;

interface BrandProfile {
  brandName?: string;
  industry?: string;
  slogan?: string;
  description?: string;
  products?: string;
  priceRange?: string;
  targetAge?: string[];
  targetGender?: string;
  targetDescription?: string;
  toneKeywords?: string[];
  toneDescription?: string;
  channels?: string[];
  competitors?: string;
  successCases?: string;
  doNotList?: string;
}

interface ResearchResult {
  content: string;
  citations: string[];
  fetchedAt: string;
}

function formatBrand(b: BrandProfile): string {
  return [
    `브랜드명: ${b.brandName ?? "-"}`,
    `카테고리: ${b.industry ?? "-"}`,
    b.slogan        && `슬로건: ${b.slogan}`,
    b.description   && `소개: ${b.description}`,
    b.products      && `주요 제품: ${b.products}`,
    b.priceRange    && `가격대: ${b.priceRange}`,
    b.targetAge?.length && `타겟 연령: ${b.targetAge.join(", ")}`,
    b.targetGender  && `타겟 성별: ${b.targetGender}`,
    b.targetDescription && `타겟 설명: ${b.targetDescription}`,
    b.toneKeywords?.length && `톤앤매너: ${b.toneKeywords.join(", ")}`,
    b.toneDescription && `톤 설명: ${b.toneDescription}`,
    b.channels?.length && `광고 채널: ${b.channels.join(", ")}`,
    b.competitors   && `경쟁사: ${b.competitors}`,
    b.successCases  && `성공 사례: ${b.successCases}`,
    b.doNotList     && `하지 말아야 할 것: ${b.doNotList}`,
  ].filter(Boolean).join("\n");
}

const RESEARCH_LABELS: Record<string, string> = {
  market:     "시장 트렌드",
  competitor: "경쟁사 광고 분析",
  customer:   "고객 반응",
};

export async function GET(req: Request) {
  const token = process.env.HERMES_TOKEN;
  if (token) {
    const auth = req.headers.get("x-hermes-token") ?? req.headers.get("authorization")?.replace("Bearer ", "");
    if (auth !== token) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  try {
    const [brand, market, competitor, customer] = await Promise.all([
      kv.get<BrandProfile>("brand_profile"),
      kv.get<ResearchResult>("research_market"),
      kv.get<ResearchResult>("research_competitor"),
      kv.get<ResearchResult>("research_customer"),
    ]);

    const sections: string[] = [];

    sections.push("# Prayforit 마케팅 리서치 컨텍스트");
    sections.push(`업데이트: ${new Date().toLocaleString("ko-KR")}\n`);

    if (brand) {
      sections.push("## 브랜드 프로필");
      sections.push(formatBrand(brand));
    }

    for (const [key, result] of Object.entries({ market, competitor, customer })) {
      if (!result) continue;
      const label = RESEARCH_LABELS[key] ?? key;
      const date = new Date(result.fetchedAt).toLocaleDateString("ko-KR");
      sections.push(`\n## ${label} (${date})`);
      sections.push(result.content);
      if (result.citations.length > 0) {
        sections.push(`\n출처: ${result.citations.slice(0, 5).join(", ")}`);
      }
    }

    const text = sections.join("\n");

    return new NextResponse(text, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

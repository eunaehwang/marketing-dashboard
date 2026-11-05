// 단계 흐름 (0~6)
export type FlowStep =
  | "step1"   // 1. 현황 진단 (후순위)
  | "step2"   // 2. 고객 분석 (CSV 업로드)
  | "step3"   // 3. 시장·경쟁
  | "step4"   // 4. 전략 매트릭스
  | "step5"   // 5. 제작 요청서
  | "step6";  // 6. 테스트 결과 (후순위)

// 기존 섹션 (보관 / 도구)
export type LegacySection =
  | "overview"
  | "keyword"
  | "trend"
  | "reviews"
  | "competitor"
  | "adresearch"
  | "calendar"
  | "aibot"
  | "brand";

export type Section = FlowStep | LegacySection;

export interface BrandProfile {
  brandName: string;
  industry: string;
  slogan: string;
  description: string;
  products: string;
  priceRange: string;
  targetAge: string[];
  targetGender: string;
  targetDescription: string;
  toneKeywords: string[];
  toneDescription: string;
  channels: string[];
  competitors: string;
  successCases: string;
  doNotList: string;
}

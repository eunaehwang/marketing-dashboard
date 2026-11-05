/**
 * 서버 저장소 레이어.
 * Redis 키 형식: product:{productId}:{stage}
 * 판정·결과는 리스트로 누적(이력 보존), 나머지는 단일 값 덮어쓰기.
 */

import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  _redis = Redis.fromEnv();
  return _redis;
}

export async function storeSet(key: string, value: unknown): Promise<void> {
  const r = getRedis();
  if (!r) return;
  await r.set(key, value);
}

export async function storeGet<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  return r.get<T>(key);
}

export async function storePrepend(key: string, value: unknown): Promise<void> {
  const r = getRedis();
  if (!r) return;
  await r.lpush(key, value);
}

export async function storeList<T>(key: string, limit = 50): Promise<T[]> {
  const r = getRedis();
  if (!r) return [];
  return r.lrange<T>(key, 0, limit - 1);
}

// ─── 키 헬퍼 ────────────────────────────────────────────────────────────────

export const keys = {
  brand:        ()                          => "brand_profile",
  research:     (type: string)              => `research_${type}`,
  productStage: (productId: string, stage: string) => `product:${productId}:${stage}`,
  verdicts:     (productId: string)         => `product:${productId}:verdicts`,
  creatives:    (productId: string)         => `product:${productId}:creatives`,
  insights:     (productId: string)         => `product:${productId}:insights`,
  campaigns:    ()                          => "campaigns",
  campaign:     (campaignId: string)        => `campaign:${campaignId}`,
};

// ─── 2.5단계 타입 정의 ────────────────────────────────────────────────────────

/** 실행물 형식 */
export type CreativeFormat = "DA" | "REELS" | "PA" | "PROMO" | "CRM";

/**
 * 실행물 (제작 요청서 1건).
 * matrixRowId: 연결된 4단계 매트릭스 행 ID
 * insightIds:  이 요청서 생성에 사용된 인사이트 ID 목록
 * campaignId:  연결된 캠페인 (옵션, 나중에 채움)
 * outputId:    6단계 결과와 연결할 ID (= id 와 동일하게 사용 가능)
 */
export interface Creative {
  id: string;
  productId: string;
  format: CreativeFormat;
  appeal: string;
  target: string;
  brief: string;
  matrixRowId?: string;
  insightIds: string[];
  campaignId?: string;
  version: number;
  createdAt: string;
}

/**
 * 인사이트 1건.
 * basis: "근거"(데이터 출처 있음) | "가설"(검증 전)
 * sources: 이 인사이트가 나온 원본 기록 참조
 * status: "active" = 프롬프트에 포함 | "retired" = 보관
 */
export type InsightBasis = "근거" | "가설";
export type InsightSourceType = "result" | "review" | "keyword" | "verdict";

export interface InsightSource {
  type: InsightSourceType;
  ref: string;
}

export interface Insight {
  id: string;
  productId: string;
  text: string;
  basis: InsightBasis;
  sources: InsightSource[];
  createdAt: string;
  status: "active" | "retired";
}

/**
 * 캠페인(프로모션) 상위 기획.
 * 화면은 후순위지만 키 이름은 지금 고정.
 * outputIds: 이 캠페인에 속한 Creative ID 목록
 */
export interface Campaign {
  id: string;
  name: string;
  period: { from: string; to: string };
  goal: string;
  offer: string;
  productIds: string[];
  budget?: number;
  outputIds: string[];
  status: "draft" | "active" | "done";
}

/**
 * 6단계 테스트 결과 1건.
 * outputId: 어떤 Creative의 결과인지
 */
export type TestVerdict = "winner" | "off" | "pending";

export interface TestResult {
  id: string;
  productId: string;
  outputId: string;
  verdict: TestVerdict;
  note: string;
  recordedAt: string;
}

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
    return null; // 환경변수 없으면 Redis 비활성 — 오류 없이 null 반환
  }
  _redis = Redis.fromEnv();
  return _redis;
}

// 단일 값 저장 (덮어쓰기)
export async function storeSet(key: string, value: unknown): Promise<void> {
  const r = getRedis();
  if (!r) return;
  await r.set(key, value);
}

// 단일 값 읽기
export async function storeGet<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  return r.get<T>(key);
}

// 리스트에 항목 추가 (이력 보존, 최신이 앞)
export async function storePrepend(key: string, value: unknown): Promise<void> {
  const r = getRedis();
  if (!r) return;
  await r.lpush(key, value);
}

// 리스트 전체 읽기
export async function storeList<T>(key: string, limit = 50): Promise<T[]> {
  const r = getRedis();
  if (!r) return [];
  return r.lrange<T>(key, 0, limit - 1);
}

// 제품별 키 헬퍼
export const keys = {
  brand: () => "brand_profile",
  research: (type: string) => `research_${type}`,
  productStage: (productId: string, stage: string) => `product:${productId}:${stage}`,
  verdicts: (productId: string) => `product:${productId}:verdicts`,   // O/X 판정 이력
  creatives: (productId: string) => `product:${productId}:creatives`, // 제작 요청서 이력
};

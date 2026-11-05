export interface Product {
  id: string;
  name: string;          // 표시 이름
  shortName: string;     // 짧은 이름 (셀렉터용)
  category: string;      // 소구 카테고리
  keyMessage: string;    // 핵심 메시지 한 줄
  priceKRW?: number;     // 판매가 (원)
  bepRoas?: number;      // 손익분기 ROAS (비워두고 직접 채움)
  keywords: string[];    // 3단계 키워드 시드
  targetHints: string[]; // 타겟 신호 초기값
}

const products: Product[] = [
  {
    id: "allsanding",
    name: "올샌딩 올라운더 폴리쉬 크림",
    shortName: "올샌딩",
    category: "연마 세정제",
    keyMessage: "모든 얼룩은 올샌딩 하나로",
    priceKRW: undefined,  // 직접 채워주세요
    bepRoas: undefined,   // 직접 채워주세요
    keywords: [
      "스텐 광택", "스텐 얼룩", "연마세정제", "크림세정제",
      "물때 제거", "석회 제거", "인덕션 청소", "스티커 자국 제거", "캐리어 얼룩",
    ],
    targetHints: [
      "집꾸미기 30~50대 여성", "신혼·이사", "아이 있는 집", "요리 자주 하는 집",
    ],
  },
  // 제품 추가 시 여기에 계속 작성
];

export default products;

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

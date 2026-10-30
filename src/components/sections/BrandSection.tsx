"use client";

import { useState, useEffect } from "react";
import { BrandProfile } from "@/types";

const STORAGE_KEY = "brand_profile";

const DEFAULT: BrandProfile = {
  brandName: "프레이포잇 (Prayforit)",
  industry: "라이프스타일 / 홈케어 (세정·세탁·탈취·쿨링)",
  slogan: "모든 얼룩은 올샌딩 하나로",
  description:
    "자사몰 중심으로 운영하는 D2C 홈케어 브랜드. 세탁, 주방, 욕실, 인테리어 소품까지 집 안 곳곳의 얼룩과 냄새를 관리하는 제품을 만들어요. '닦아도 안 지워지던 얼룩', '매일 눈에 밟히는 자국'처럼 생활 속 작은 불편을 해결해서, 아끼는 집과 물건을 오래 깨끗하게 쓰게 해주는 가치를 전달해요. 세정력과 함께 저자극, 예쁜 패키지도 중요하게 가져가요.",
  products:
    "• 올샌딩 (베스트·메인): 크림형 연마 세정제. 스텐, 수전, 인덕션, 조명, 냄비, 벽지 낙서 얼룩까지 관리\n• 세탁폼 (장기 베스트): 덴마크 7종 효소 폼 세제. 효소 세정력 + 저자극\n• 멀티폼, 멀티클리너, 탈취제, 아로마탈취제 리필, 쿨링스프레이",
  priceRange: "3~5만원",
  targetAge: ["30대", "40대", "50대+"],
  targetGender: "여성 중심",
  targetDescription:
    "집 꾸미기·인테리어에 관심 많고 스텐 소품, 조명 등 예쁜 물건을 아끼는 사람. 아이 키우는 엄마, 워킹맘 (벽지 낙서, 아기 옷 얼룩, 살림 시간 절약이 고민). 신혼·이사·집들이 시기. 살림 인플루언서 콘텐츠 즐겨 보고 후기 믿고 구매. 구매 동기: 안 지워지는 얼룩 해결, 아끼는 물건 새것처럼 유지, 순한 세제 찾기, 실용적 선물",
  toneKeywords: ["공감형", "친근한", "실용적인", "생활밀착형"],
  toneDescription:
    "말투: 질문으로 시작해 '맞아, 나도 그래'를 끌어내는 공감형. 상황을 짧게 그린 뒤 '~해 보세요'로 부드럽게 권함. 이모지는 문장 끝에 1~2개.\n비주얼: 제품이 실제 생활 공간에 자연스럽게 놓인 컷, 얼룩 전후 비교, 크림 질감. AI 한글 텍스트 NO, 타이포 직접 삽입.\n잘 됐던 카피: '분명 청소했는데, 수전만 아직 뿌옇다면? 👀' / '잠깐 조용하다 했더니… 종이 대신 벽지에 크레파스 자국이😅' / '예뻐서 고른 스텐 조명, 요즘은 얼룩부터 눈에 들어오나요? 👀'",
  channels: ["자사몰", "스마트스토어", "쿠팡", "인스타그램", "카카오"],
  competitors: "위칙, 프로쉬, 더티린넨, 리브비, 쿼시, 플레인팟, 라비킷, 블랑코",
  successCases:
    "• 살림 인플루언서 파트너십: 다리미언니 CTR 7~8%, 90일 ROAS 3.6 / 코코꿀템 그을음 편 90일간 구매 1,400건+\n• 아이 낙서 소구: 꼬끌리꼬 육아낙서, 벽지낙서 DA 반응 좋음 → 대표님 SNS 낙서대회 기획 중\n• 스텐 인테리어 광택 소구: 카카오 테스트 1위 효율\n• 특정 얼룩 콕 집기: 식기건조대 물때, 수전 얼룩, 아이패드 스티커 끈적이 등 → 전환 좋음\n• 무물 형식: 세탁폼·멀티폼에서 반응 좋음",
  doNotList:
    "• 인증 없는 강한 효능 표현 (예방, 방지 등) → 인증 기반 표현만\n• 연마 세정제 사용 주의 문구 누락 → '사용 전 눈에 띄지 않는 부위 테스트' 필수\n• AI 생성 한글 텍스트를 이미지에 삽입 NO\n• 다이소 꿀템 위주 결 안 맞는 인플루언서, 후킹 없는 영상\n• 인스타 이벤트 비제휴·비후원 고지 누락",
};

const AGE_OPTIONS = ["10대", "20대 초반", "20대 후반", "30대", "40대", "50대+"];
const GENDER_OPTIONS = ["여성 중심", "남성 중심", "전 성별"];
const TONE_OPTIONS = [
  "공감형", "친근한", "따뜻한", "생활밀착형", "실용적인",
  "감성적", "깔끔한", "트렌디한", "고급스러운", "신뢰감 있는",
  "유머러스", "전문적", "힙한", "귀여운", "에너지틱한",
];
const CHANNEL_OPTIONS = [
  "자사몰", "스마트스토어", "쿠팡", "29cm", "오늘의집",
  "인스타그램", "카카오", "네이버 쇼핑", "네이버 블로그",
  "유튜브", "유튜브 쇼츠", "틱톡", "페이스북",
];
const PRICE_OPTIONS = ["~1만원", "1~3만원", "3~5만원", "5~10만원", "10만원+"];

function Tag({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
      style={{
        background: selected ? "var(--accent)" : "var(--surface-2)",
        color: selected ? "#fff" : "var(--fg-3)",
        border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
      }}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--fg-2)" }}>
        {label}
      </label>
      {hint && (
        <p className="text-xs mb-2" style={{ color: "var(--fg-3)" }}>
          {hint}
        </p>
      )}
      {children}
    </div>
  );
}

const inputStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  color: "var(--fg)",
  borderRadius: "8px",
  fontSize: "13px",
  padding: "8px 12px",
  width: "100%",
  outline: "none",
};

const textareaStyle = {
  ...inputStyle,
  resize: "vertical" as const,
  minHeight: "80px",
  lineHeight: "1.6",
};

function Card({
  title,
  emoji,
  children,
}: {
  title: string;
  emoji: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">{emoji}</span>
        <span className="text-sm font-bold" style={{ color: "var(--fg)" }}>
          {title}
        </span>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

export default function BrandSection() {
  const [profile, setProfile] = useState<BrandProfile>(DEFAULT);
  const [saved, setSaved] = useState(false);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProfile(JSON.parse(stored));
        setHasData(true);
      }
    } catch {}
  }, []);

  const set = (key: keyof BrandProfile, value: BrandProfile[keyof BrandProfile]) =>
    setProfile((p) => ({ ...p, [key]: value }));

  const toggleArr = (key: "targetAge" | "toneKeywords" | "channels", val: string) => {
    setProfile((p) => {
      const arr = p[key] as string[];
      return {
        ...p,
        [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val],
      };
    });
  };

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      setSaved(true);
      setHasData(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
  };

  const isEmpty = !profile.brandName.trim();

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
            브랜드 프로필
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--fg-3)" }}>
            AI 기획봇이 우리 브랜드를 이해하기 위한 기본 정보
          </p>
        </div>
        {hasData && (
          <span
            className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: "var(--positive-light)", color: "var(--positive)" }}
          >
            저장됨
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {/* 기본 정보 */}
        <Card title="기본 정보" emoji="🏷️">
          <div className="grid grid-cols-2 gap-3">
            <Field label="브랜드명 *">
              <input
                style={inputStyle}
                value={profile.brandName}
                onChange={(e) => set("brandName", e.target.value)}
                placeholder="예) 라메종"
              />
            </Field>
            <Field label="업종">
              <input
                style={inputStyle}
                value={profile.industry}
                onChange={(e) => set("industry", e.target.value)}
                placeholder="예) 뷰티 / 라이프스타일"
              />
            </Field>
          </div>
          <Field label="브랜드 슬로건 / 한 줄 소개">
            <input
              style={inputStyle}
              value={profile.slogan}
              onChange={(e) => set("slogan", e.target.value)}
              placeholder="예) 일상을 향기롭게"
            />
          </Field>
          <Field
            label="브랜드 설명"
            hint="어떤 브랜드인지, 어떤 가치를 전달하는지 자유롭게 써주세요"
          >
            <textarea
              style={textareaStyle}
              value={profile.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="예) 20-30대 여성을 위한 감성 선물 브랜드. 향기, 뷰티, 소품 카테고리를 중심으로 '나를 위한 선물'이라는 컨셉으로 운영 중."
            />
          </Field>
        </Card>

        {/* 제품/서비스 */}
        <Card title="제품 / 서비스" emoji="📦">
          <Field
            label="주요 제품 및 카테고리"
            hint="어떤 제품을 파는지, 베스트셀러나 주력 상품도 적어주세요"
          >
            <textarea
              style={textareaStyle}
              value={profile.products}
              onChange={(e) => set("products", e.target.value)}
              placeholder="예) 핸드크림, 향수, 캔들, 디퓨저. 베스트셀러: 장미향 핸드크림 / 바닐라 디퓨저"
            />
          </Field>
          <Field label="가격대">
            <div className="flex flex-wrap gap-2">
              {PRICE_OPTIONS.map((p) => (
                <Tag
                  key={p}
                  label={p}
                  selected={profile.priceRange === p}
                  onClick={() => set("priceRange", profile.priceRange === p ? "" : p)}
                />
              ))}
            </div>
          </Field>
        </Card>

        {/* 타겟 고객 */}
        <Card title="타겟 고객" emoji="🎯">
          <Field label="주 연령대 (복수 선택)">
            <div className="flex flex-wrap gap-2">
              {AGE_OPTIONS.map((a) => (
                <Tag
                  key={a}
                  label={a}
                  selected={profile.targetAge.includes(a)}
                  onClick={() => toggleArr("targetAge", a)}
                />
              ))}
            </div>
          </Field>
          <Field label="성별">
            <div className="flex flex-wrap gap-2">
              {GENDER_OPTIONS.map((g) => (
                <Tag
                  key={g}
                  label={g}
                  selected={profile.targetGender === g}
                  onClick={() => set("targetGender", profile.targetGender === g ? "" : g)}
                />
              ))}
            </div>
          </Field>
          <Field
            label="타겟 고객 상세 설명"
            hint="고객의 라이프스타일, 관심사, 구매 동기 등"
          >
            <textarea
              style={textareaStyle}
              value={profile.targetDescription}
              onChange={(e) => set("targetDescription", e.target.value)}
              placeholder="예) 선물 문화에 민감한 20-30대 여성. 자기 자신에게도 작은 선물을 즐기며, 인스타에서 감성 콘텐츠를 자주 소비함."
            />
          </Field>
        </Card>

        {/* 톤앤매너 */}
        <Card title="톤 앤 매너" emoji="🎨">
          <Field label="브랜드 느낌 (복수 선택)">
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map((t) => (
                <Tag
                  key={t}
                  label={t}
                  selected={profile.toneKeywords.includes(t)}
                  onClick={() => toggleArr("toneKeywords", t)}
                />
              ))}
            </div>
          </Field>
          <Field
            label="톤앤매너 상세 설명"
            hint="어떤 말투, 어떤 분위기, 어떤 색감인지 — 잘 됐던 카피나 게시물 예시도 좋아요"
          >
            <textarea
              style={textareaStyle}
              value={profile.toneDescription}
              onChange={(e) => set("toneDescription", e.target.value)}
              placeholder="예) 따뜻하고 감성적인 말투. 과한 세일즈 느낌 NO. '오늘 하루도 수고했어요'처럼 위로하는 느낌. 파스텔 톤 이미지 선호."
            />
          </Field>
        </Card>

        {/* 채널 & 경쟁사 */}
        <Card title="채널 & 경쟁사" emoji="📣">
          <Field label="운영 중인 채널 (복수 선택)">
            <div className="flex flex-wrap gap-2">
              {CHANNEL_OPTIONS.map((c) => (
                <Tag
                  key={c}
                  label={c}
                  selected={profile.channels.includes(c)}
                  onClick={() => toggleArr("channels", c)}
                />
              ))}
            </div>
          </Field>
          <Field label="주요 경쟁사">
            <input
              style={inputStyle}
              value={profile.competitors}
              onChange={(e) => set("competitors", e.target.value)}
              placeholder="예) 록시땅, 이솝, 탬버린즈"
            />
          </Field>
        </Card>

        {/* AI에게 알려줄 것 */}
        <Card title="AI에게 알려줄 것" emoji="🤖">
          <Field
            label="잘 됐던 기획 / 반응 좋았던 콘텐츠"
            hint="어떤 게 잘 됐는지 알수록 AI가 더 잘 맞춰요"
          >
            <textarea
              style={textareaStyle}
              value={profile.successCases}
              onChange={(e) => set("successCases", e.target.value)}
              placeholder="예) '나에게 주는 선물' 컨셉 릴스 조회수 10만. 크리스마스 시즌 선물 패키지 기획 판매량 3배."
            />
          </Field>
          <Field
            label="하지 말아야 할 것 / 브랜드와 안 맞는 것"
            hint="이건 절대 안 된다 싶은 방향, 톤, 소재"
          >
            <textarea
              style={textareaStyle}
              value={profile.doNotList}
              onChange={(e) => set("doNotList", e.target.value)}
              placeholder="예) 과도한 할인 강조 NO, 연예인 유행 밈 억지로 끼워넣기 NO, 너무 젊은 10대 감성 NO"
            />
          </Field>
        </Card>

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          disabled={isEmpty}
          className="w-full py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-30"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          {saved ? "✓ 저장됐어요!" : "브랜드 프로필 저장"}
        </button>

        <p className="text-center text-xs pb-4" style={{ color: "var(--fg-3)" }}>
          브라우저에 저장됩니다 · 나중에 언제든 수정 가능
        </p>
      </div>
    </div>
  );
}

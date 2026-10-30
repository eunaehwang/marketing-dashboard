"use client";

import { useState, useEffect } from "react";
import { BrandProfile } from "@/types";

const STORAGE_KEY = "brand_profile";

const DEFAULT: BrandProfile = {
  brandName: "",
  industry: "",
  slogan: "",
  description: "",
  products: "",
  priceRange: "",
  targetAge: [],
  targetGender: "",
  targetDescription: "",
  toneKeywords: [],
  toneDescription: "",
  channels: [],
  competitors: "",
  successCases: "",
  doNotList: "",
};

const AGE_OPTIONS = ["10대", "20대 초반", "20대 후반", "30대", "40대", "50대+"];
const GENDER_OPTIONS = ["여성 중심", "남성 중심", "전 성별"];
const TONE_OPTIONS = [
  "따뜻한", "감성적", "트렌디한", "힙한", "고급스러운",
  "귀여운", "유머러스", "전문적", "신뢰감 있는", "에너지틱한",
];
const CHANNEL_OPTIONS = [
  "인스타그램", "유튜브", "네이버 블로그", "네이버 쇼핑", "카카오",
  "틱톡", "페이스북", "유튜브 쇼츠",
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

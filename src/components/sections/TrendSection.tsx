"use client";

import { useState, useEffect } from "react";

interface WeatherMain { temp: number; feels_like: number; humidity: number; }
interface WeatherDesc { id: number; description: string; icon: string; }
interface CurrentWeather { weather: WeatherDesc[]; main: WeatherMain; wind: { speed: number }; name: string; }
interface ForecastItem { dt: number; main: WeatherMain; weather: WeatherDesc[]; dt_txt: string; }
interface WeatherResponse { current: CurrentWeather; forecast: { list: ForecastItem[] } | null; }

interface SeasonEvent { months: number[]; label: string; desc: string; tag: string; color: string; }
interface ProductDemand { name: string; level: number; reason: string; }

const SEASON_EVENTS: SeasonEvent[] = [
  { months: [1],       label: "설날 대청소",       desc: "명절 전 집 청소 수요 급증",          tag: "명절",  color: "#8B5CF6" },
  { months: [2, 3],    label: "봄맞이 대청소",      desc: "겨울 먼지 정리, 봄 청소 시즌",       tag: "대청소", color: "#22C55E" },
  { months: [3, 4],    label: "봄 이사 시즌",       desc: "이사 후 새집 청소 용품 수요",        tag: "이사",  color: "#3B82F6" },
  { months: [3, 4, 5], label: "황사·미세먼지",      desc: "실내·주방 청소 강화 필요",           tag: "황사",  color: "#F59E0B" },
  { months: [6, 7],    label: "장마 시즌",          desc: "곰팡이 방지·탈취 제품 최고 수요",    tag: "장마",  color: "#06B6D4" },
  { months: [8],       label: "여름 주방 위생",     desc: "고온다습 환경 위생 관리 강화",       tag: "위생",  color: "#EF4444" },
  { months: [9, 10],   label: "가을 이사 시즌",     desc: "이사 청소 용품 수요 증가",           tag: "이사",  color: "#3B82F6" },
  { months: [9],       label: "추석 대청소",        desc: "명절 전 집 청소 수요 급증",          tag: "명절",  color: "#8B5CF6" },
  { months: [11, 12],  label: "연말 대청소",        desc: "연말 집 정리 최고 수요",             tag: "대청소", color: "#22C55E" },
  { months: [12],      label: "김장철",             desc: "주방·냄비 세정 강화 시즌",           tag: "김장",  color: "#F97316" },
];

// Monthly base demand index (Jan–Dec)
const BASE_DEMAND: Record<string, number[]> = {
  "스텐·냄비 세정":  [70, 70, 80, 80, 75, 70, 65, 70, 80, 80, 85, 95],
  "주방세정제":      [65, 65, 70, 75, 80, 85, 90, 95, 80, 75, 70, 75],
  "세탁폼":          [60, 65, 75, 85, 90, 85, 80, 75, 80, 75, 65, 60],
  "탈취·섬유탈취":   [55, 55, 60, 65, 70, 85, 95, 90, 70, 65, 60, 55],
  "욕실청소":        [60, 65, 70, 75, 75, 80, 85, 85, 75, 70, 70, 70],
  "홈케어 종합":     [65, 65, 80, 85, 75, 70, 65, 65, 80, 82, 78, 85],
};

function calcDemand(month: number, weather?: WeatherResponse): ProductDemand[] {
  const temp = weather?.current?.main?.temp ?? null;
  const humidity = weather?.current?.main?.humidity ?? null;
  const weatherId = weather?.current?.weather?.[0]?.id ?? null;
  const isRainy = weatherId !== null && weatherId >= 200 && weatherId < 700;

  return Object.entries(BASE_DEMAND).map(([name, levels]) => {
    let level = levels[month - 1];
    let reason = "";

    if (temp !== null) {
      if (name === "탈취·섬유탈취" && temp > 25)  { level = Math.min(100, level + 10); reason = "고온 탈취 수요 ↑"; }
      if (name === "주방세정제" && temp > 28)       { level = Math.min(100, level + 8);  reason = "무더위 식중독 예방"; }
      if (name === "주방세정제" && temp < 5)        { level = Math.max(20,  level - 10); reason = "저온 세균 감소"; }
    }
    if (humidity !== null && humidity > 75) {
      if (name === "탈취·섬유탈취") { level = Math.min(100, level + 12); reason = "고습도 탈취 급증"; }
    }
    if (isRainy && name === "욕실청소") { level = Math.min(100, level + 8); reason = "장마 곰팡이 방지"; }

    return { name, level, reason };
  });
}

function weatherIcon(id: number): string {
  if (id >= 200 && id < 300) return "⛈️";
  if (id >= 300 && id < 400) return "🌦️";
  if (id >= 500 && id < 600) return "🌧️";
  if (id >= 600 && id < 700) return "❄️";
  if (id >= 700 && id < 800) return "🌫️";
  if (id === 800) return "☀️";
  if (id === 801) return "🌤️";
  if (id === 802) return "⛅";
  if (id >= 803) return "☁️";
  return "🌡️";
}

export default function TrendSection() {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [weatherErr, setWeatherErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  const now = new Date();
  const month = now.getMonth() + 1;
  const nextMonth = month === 12 ? 1 : month + 1;

  const thisMonthEvents = SEASON_EVENTS.filter((e) => e.months.includes(month));
  const nextMonthEvents = SEASON_EVENTS.filter(
    (e) => e.months.includes(nextMonth) && !e.months.includes(month)
  );
  const demands = calcDemand(month, weather ?? undefined).sort((a, b) => b.level - a.level);
  const maxDemand = demands[0]?.level ?? 1;

  useEffect(() => { fetchWeather(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchWeather() {
    setLoading(true);
    setWeatherErr(null);
    try {
      const res = await fetch("/api/weather");
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 503) { setHasKey(false); }
        else { setWeatherErr(data.error ?? `오류 ${res.status}`); }
        return;
      }
      setHasKey(true);
      setWeather(data);
    } catch (err) {
      setWeatherErr(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const forecastItems = weather?.forecast?.list?.slice(0, 4) ?? [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>트렌드 분석</h1>
          <p className="text-xs mt-1" style={{ color: "var(--fg-3)" }}>날씨 · 계절 이벤트 기반 제품 수요 예측</p>
        </div>
        <button
          onClick={fetchWeather}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <span style={{ display: "inline-block", animation: loading ? "spin 0.8s linear infinite" : "none" }}>↻</span>
          {loading ? "업데이트 중..." : "날씨 업데이트"}
        </button>
      </div>

      {/* Weather + Season grid */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>

        {/* Weather card */}
        <div className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: "var(--fg-3)", fontSize: 10, letterSpacing: "0.07em" }}>
            서울 날씨
          </div>

          {hasKey === false ? (
            <div>
              <div className="text-sm font-bold mb-1.5" style={{ color: "var(--fg)" }}>🔑 날씨 API 필요</div>
              <div className="text-xs mb-2" style={{ color: "var(--fg-3)" }}>Vercel 환경 변수에 추가해주세요</div>
              <code className="block text-xs px-2 py-1.5 rounded font-mono mb-2"
                style={{ background: "var(--surface-2)", color: "var(--accent)" }}>
                OPENWEATHER_API_KEY
              </code>
              <div className="text-xs" style={{ color: "var(--fg-3)" }}>
                openweathermap.org → Free 플랜 무료 발급
              </div>
            </div>
          ) : weatherErr ? (
            <div className="text-xs font-mono break-all" style={{ color: "#EF4444" }}>{weatherErr}</div>
          ) : weather ? (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span style={{ fontSize: 36, lineHeight: 1 }}>
                  {weatherIcon(weather.current.weather[0]?.id ?? 800)}
                </span>
                <div>
                  <div className="text-2xl font-bold" style={{ color: "var(--fg)" }}>
                    {Math.round(weather.current.main.temp)}°C
                  </div>
                  <div className="text-xs" style={{ color: "var(--fg-3)" }}>
                    {weather.current.weather[0]?.description}
                    {" · "}습도 {weather.current.main.humidity}%
                  </div>
                </div>
              </div>
              {forecastItems.length > 0 && (
                <div className="flex gap-1.5">
                  {forecastItems.map((item, i) => {
                    const h = new Date(item.dt * 1000).getHours();
                    const label = h === 0 ? "자정" : h < 12 ? `오전${h}시` : h === 12 ? "정오" : `오후${h - 12}시`;
                    return (
                      <div key={i} className="flex-1 text-center rounded-lg py-1.5 px-1"
                        style={{ background: "var(--surface-2)" }}>
                        <div className="text-xs mb-0.5" style={{ color: "var(--fg-3)", fontSize: 9 }}>{label}</div>
                        <div style={{ fontSize: 14 }}>{weatherIcon(item.weather[0]?.id ?? 800)}</div>
                        <div className="text-xs font-bold" style={{ color: "var(--fg)", fontSize: 11 }}>
                          {Math.round(item.main.temp)}°
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs" style={{ color: "var(--fg-3)" }}>날씨 정보를 불러오는 중...</div>
          )}
        </div>

        {/* Season events card */}
        <div className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: "var(--fg-3)", fontSize: 10, letterSpacing: "0.07em" }}>
            {month}월 시즌 이벤트
          </div>

          {thisMonthEvents.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {thisMonthEvents.map((ev, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-xs px-1.5 py-0.5 rounded font-semibold shrink-0 mt-0.5"
                    style={{ background: `${ev.color}1a`, color: ev.color }}>
                    {ev.tag}
                  </span>
                  <div>
                    <div className="text-sm font-semibold leading-tight" style={{ color: "var(--fg)" }}>{ev.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--fg-3)" }}>{ev.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs" style={{ color: "var(--fg-3)" }}>이 달에 주요 이벤트가 없어요</div>
          )}

          {nextMonthEvents.length > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="text-xs mb-2 font-semibold" style={{ color: "var(--fg-3)" }}>
                다음 달 ({nextMonth}월) 예정
              </div>
              <div className="flex flex-col gap-1.5">
                {nextMonthEvents.map((ev, i) => (
                  <div key={i} className="flex items-center gap-2 opacity-60">
                    <span className="text-xs px-1.5 py-0.5 rounded font-semibold"
                      style={{ background: `${ev.color}1a`, color: ev.color }}>
                      {ev.tag}
                    </span>
                    <span className="text-xs" style={{ color: "var(--fg-2)" }}>{ev.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product demand bars */}
      <div className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--fg-3)", fontSize: 10, letterSpacing: "0.07em" }}>
            제품 카테고리별 수요 지수
          </div>
          <div className="text-xs" style={{ color: "var(--fg-3)" }}>
            {month}월 기준 · 계절·날씨 반영
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {demands.map((d) => (
            <div key={d.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold" style={{ color: "var(--fg)" }}>{d.name}</span>
                <div className="flex items-center gap-2">
                  {d.reason && (
                    <span className="text-xs rounded px-1.5 py-0.5"
                      style={{ background: "rgba(var(--accent-rgb),0.1)", color: "var(--accent)", fontSize: 10 }}>
                      {d.reason}
                    </span>
                  )}
                  <span className="text-xs font-bold tabular-nums" style={{ color: "var(--fg)", minWidth: 24, textAlign: "right" }}>
                    {d.level}
                  </span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(d.level / maxDemand) * 100}%`,
                    background: d.level >= 85 ? "#22C55E" : d.level >= 70 ? "var(--accent)" : "#94A3B8",
                    transitionDuration: "700ms",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 text-xs" style={{ borderTop: "1px solid var(--border)", color: "var(--fg-3)" }}>
          계절 패턴 기반 추정치입니다. 실제 판매 데이터와 차이가 있을 수 있습니다.
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE = "https://api.openweathermap.org/data/2.5";

export async function GET() {
  if (!API_KEY) {
    return Response.json({ error: "OPENWEATHER_API_KEY 환경 변수가 없습니다" }, { status: 503 });
  }
  try {
    const [cRes, fRes] = await Promise.all([
      fetch(`${BASE}/weather?q=Seoul,KR&appid=${API_KEY}&units=metric&lang=ko`),
      fetch(`${BASE}/forecast?q=Seoul,KR&appid=${API_KEY}&units=metric&lang=ko&cnt=8`),
    ]);
    if (!cRes.ok) {
      const t = await cRes.text();
      return Response.json({ error: `OpenWeather (${cRes.status}): ${t}` }, { status: cRes.status });
    }
    const current = await cRes.json();
    const forecast = fRes.ok ? await fRes.json() : null;
    return Response.json({ current, forecast });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

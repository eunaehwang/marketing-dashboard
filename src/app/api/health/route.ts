export async function GET() {
  return Response.json({
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    naverAd: !!(
      process.env.NAVER_AD_CUSTOMER_ID &&
      process.env.NAVER_AD_API_KEY &&
      process.env.NAVER_AD_SECRET_KEY
    ),
    openRouter: !!process.env.OPENROUTER_API_KEY,
  });
}

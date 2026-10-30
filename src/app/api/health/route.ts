export async function GET() {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  return Response.json({ ok: hasKey }, { status: hasKey ? 200 : 503 });
}

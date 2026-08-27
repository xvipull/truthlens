import { NextResponse } from "next/server";

import { analyzeArticle, validateArticleInput } from "@/lib/truthlens";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "invalid_json",
          message: "The request body must be valid JSON.",
        },
      },
      { status: 400 },
    );
  }

  const validated = validateArticleInput(
    typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {},
  );

  if (!validated.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "validation_error",
          message: validated.errors[0],
          details: validated.errors,
        },
      },
      { status: 400 },
    );
  }

  const analysis = await analyzeArticle({
    title: validated.title,
    text: validated.text,
  });

  return NextResponse.json({ ok: true, analysis });
}

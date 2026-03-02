import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/lib/pipeline";

export async function POST(_: NextRequest, { params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = await params;

  try {
    const result = await runPipeline(profileId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

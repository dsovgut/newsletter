import { NextRequest, NextResponse } from "next/server";
import { suggestSources } from "@/lib/generate";

export async function POST(req: NextRequest) {
  const { topic } = await req.json();
  if (!topic) return NextResponse.json({ error: "topic required" }, { status: 400 });

  const sources = await suggestSources(topic);
  return NextResponse.json(sources);
}

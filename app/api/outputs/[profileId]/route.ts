import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/db";
import { getOutputHistory, readOutput } from "@/lib/db";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = await params;
  const date = req.nextUrl.searchParams.get("date");

  const profile = getProfile(profileId);
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const slug = slugify(profile.name);

  if (date) {
    const content = readOutput(slug, date);
    if (!content) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ content, date });
  }

  const history = getOutputHistory(slug);
  return NextResponse.json({ history, slug });
}

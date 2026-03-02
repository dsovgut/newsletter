import { NextRequest, NextResponse } from "next/server";
import { saveWritingSample } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { profileId, content } = await req.json();
  if (!profileId || !content) {
    return NextResponse.json({ error: "profileId and content required" }, { status: 400 });
  }
  const filePath = saveWritingSample(profileId, content);
  return NextResponse.json({ filePath });
}

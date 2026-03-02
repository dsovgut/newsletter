import { NextRequest, NextResponse } from "next/server";
import { saveFeedback, getFeedbackForProfile } from "@/lib/db";
import { FeedbackEntry } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const entry: FeedbackEntry = {
    profileId: body.profileId,
    runDate: body.runDate,
    storyTitle: body.storyTitle,
    storyUrl: body.storyUrl,
    rating: body.rating,
    comment: body.comment ?? "",
    savedAt: new Date().toISOString(),
  };
  saveFeedback(entry);
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const profileId = req.nextUrl.searchParams.get("profileId");
  if (!profileId) return NextResponse.json({ error: "profileId required" }, { status: 400 });
  return NextResponse.json(getFeedbackForProfile(profileId));
}

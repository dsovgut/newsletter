import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getProfiles, saveProfile } from "@/lib/db";
import { Profile } from "@/lib/types";
import { scheduleProfile } from "@/lib/scheduler";

export async function GET() {
  const profiles = getProfiles();
  return NextResponse.json(profiles);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const profile: Profile = {
    id: uuidv4(),
    name: body.name,
    topic: body.topic,
    sources: body.sources ?? [],
    format: body.format ?? "brief",
    linkedinStyle: body.linkedinStyle ?? "",
    tweetStyle: body.tweetStyle ?? "",
    writingSamplePath: body.writingSamplePath ?? "",
    schedule: body.schedule ?? { enabled: false, cron: "", timezone: "UTC" },
    createdAt: new Date().toISOString(),
    lastRunAt: null,
  };

  saveProfile(profile);

  if (profile.schedule.enabled && profile.schedule.cron) {
    scheduleProfile(profile.id, profile.schedule.cron, profile.schedule.timezone);
  }

  return NextResponse.json(profile, { status: 201 });
}

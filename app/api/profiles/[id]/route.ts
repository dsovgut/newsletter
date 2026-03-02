import { NextRequest, NextResponse } from "next/server";
import { getProfile, saveProfile, deleteProfile, saveWritingSample } from "@/lib/db";
import { scheduleProfile, unscheduleProfile } from "@/lib/scheduler";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = getProfile(id);
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(profile);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = getProfile(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updated = { ...existing, ...body, id };

  if (body.writingSample) {
    const filePath = saveWritingSample(id, body.writingSample);
    updated.writingSamplePath = filePath;
    delete updated.writingSample;
  }

  saveProfile(updated);

  // Update schedule
  if (updated.schedule.enabled && updated.schedule.cron) {
    scheduleProfile(id, updated.schedule.cron, updated.schedule.timezone);
  } else {
    unscheduleProfile(id);
  }

  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  unscheduleProfile(id);
  deleteProfile(id);
  return NextResponse.json({ ok: true });
}

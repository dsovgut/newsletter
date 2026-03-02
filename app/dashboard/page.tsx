"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Profile } from "@/lib/types";
import Button from "@/components/Button";

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatBadge(format: string) {
  const map: Record<string, string> = { flash: "Flash", brief: "Brief", digest: "Digest" };
  return map[format] ?? format;
}

export default function Dashboard() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profiles")
      .then((r) => r.json())
      .then(setProfiles)
      .finally(() => setLoading(false));
  }, []);

  async function runNow(id: string) {
    setRunning(id);
    try {
      const res = await fetch(`/api/run/${id}`, { method: "POST" });
      if (res.ok) {
        router.push(`/run/${id}`);
      }
    } finally {
      setRunning(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Your Newsletters</h1>
            <p className="mt-1 text-gray-500 text-sm">
              {profiles.length} profile{profiles.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/onboarding">
            <Button size="md">+ New Profile</Button>
          </Link>
        </div>

        {profiles.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-gray-200 rounded-2xl">
            <p className="text-gray-400 text-lg mb-2">No profiles yet</p>
            <p className="text-gray-400 text-sm mb-6">
              Create your first newsletter profile to get started
            </p>
            <Link href="/onboarding">
              <Button>Create Profile</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="border border-gray-100 rounded-xl p-6 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-lg font-semibold truncate">{profile.name}</h2>
                      <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full shrink-0">
                        {formatBadge(profile.format)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3 truncate">{profile.topic}</p>
                    <div className="flex items-center gap-6 text-xs text-gray-400">
                      <span>Last run: {formatDate(profile.lastRunAt)}</span>
                      <span>{profile.sources.length} source{profile.sources.length !== 1 ? "s" : ""}</span>
                      {profile.schedule.enabled && (
                        <span className="text-green-600">● Scheduled</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/run/${profile.id}`}>
                      <Button variant="ghost" size="sm">History</Button>
                    </Link>
                    <Link href={`/profile/${profile.id}`}>
                      <Button variant="secondary" size="sm">Edit</Button>
                    </Link>
                    <Button
                      size="sm"
                      onClick={() => runNow(profile.id)}
                      disabled={running === profile.id}
                    >
                      {running === profile.id ? "Running…" : "Run Now"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import Button from "@/components/Button";
import Toast from "@/components/Toast";
import { Profile, Source } from "@/lib/types";

const TYPE_COLORS: Record<string, string> = {
  twitter: "bg-blue-50 text-blue-700",
  linkedin: "bg-indigo-50 text-indigo-700",
  blog: "bg-green-50 text-green-700",
  newsletter: "bg-amber-50 text-amber-700",
  other: "bg-gray-100 text-gray-600",
};

function detectType(url: string): Source["type"] {
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  if (url.includes("linkedin.com")) return "linkedin";
  if (url.includes("substack.com") || url.includes("newsletter")) return "newsletter";
  return "blog";
}

const TIMEZONES = ["UTC", "America/New_York", "America/Chicago", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo", "Asia/Singapore", "Australia/Sydney"];

export default function ProfileEdit() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [writingSample, setWritingSample] = useState("");

  useEffect(() => {
    fetch(`/api/profiles/${id}`)
      .then((r) => r.json())
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [id]);

  function updateField<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
  }

  function addSource() {
    if (!customName.trim() || !customUrl.trim() || !profile) return;
    const source: Source = {
      id: uuidv4(),
      name: customName.trim(),
      url: customUrl.trim(),
      type: detectType(customUrl),
      suggested: false,
    };
    updateField("sources", [...profile.sources, source]);
    setCustomName("");
    setCustomUrl("");
  }

  function removeSource(sourceId: string) {
    if (!profile) return;
    updateField("sources", profile.sources.filter((s) => s.id !== sourceId));
  }

  async function save() {
    if (!profile) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = { ...profile };
      if (writingSample.trim()) body.writingSample = writingSample;

      const res = await fetch(`/api/profiles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setToast("Profile saved");
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteProfile() {
    if (!confirm("Delete this profile? This cannot be undone.")) return;
    await fetch(`/api/profiles/${id}`, { method: "DELETE" });
    router.push("/dashboard");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Profile not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600 mb-6 block">
          ← Dashboard
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight mb-8">Edit Profile</h1>

        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile name</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              value={profile.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </div>

          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
              rows={2}
              value={profile.topic}
              onChange={(e) => updateField("topic", e.target.value)}
            />
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <div className="flex gap-2">
              {(["flash", "brief", "digest"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => updateField("format", f)}
                  className={`flex-1 py-2 text-sm rounded-lg border capitalize transition-colors ${
                    profile.format === f
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Sources */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sources ({profile.sources.length})
            </label>
            <div className="space-y-1 mb-3">
              {profile.sources.map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-sm py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{s.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${TYPE_COLORS[s.type]}`}>
                    {s.type}
                  </span>
                  <span className="text-gray-400 text-xs truncate flex-1">{s.url}</span>
                  <button onClick={() => removeSource(s.id)} className="text-gray-300 hover:text-red-500 text-xs">✕</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
              <input
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="URL"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSource()}
              />
              <Button variant="secondary" size="sm" onClick={addSource}>Add</Button>
            </div>
          </div>

          {/* LinkedIn style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn style</label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
              rows={2}
              placeholder="Describe your writing voice..."
              value={profile.linkedinStyle}
              onChange={(e) => updateField("linkedinStyle", e.target.value)}
            />
          </div>

          {/* Writing samples */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Writing samples (paste to update)</label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
              rows={5}
              placeholder="Paste new writing samples here to replace existing ones..."
              value={writingSample}
              onChange={(e) => setWritingSample(e.target.value)}
            />
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => updateField("schedule", { ...profile.schedule, enabled: !profile.schedule.enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  profile.schedule.enabled ? "bg-gray-900" : "bg-gray-200"
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profile.schedule.enabled ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <span className="text-sm text-gray-700">Enabled</span>
            </div>
            {profile.schedule.enabled && (
              <div className="flex gap-3">
                <input
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Cron expression, e.g. 0 8 * * 1"
                  value={profile.schedule.cron}
                  onChange={(e) => updateField("schedule", { ...profile.schedule, cron: e.target.value })}
                />
                <select
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  value={profile.schedule.timezone}
                  onChange={(e) => updateField("schedule", { ...profile.schedule, timezone: e.target.value })}
                >
                  {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-100">
            <Button variant="danger" size="sm" onClick={deleteProfile}>Delete Profile</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

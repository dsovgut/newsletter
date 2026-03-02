"use client";

import Button from "@/components/Button";
import { OnboardingState } from "../page";

interface Props {
  state: OnboardingState;
  update: (patch: Partial<OnboardingState>) => void;
  onConfirm: () => void;
  onBack: () => void;
  saving: boolean;
}

export default function StepReview({ state, update, onConfirm, onBack, saving }: Props) {
  const defaultName = state.topic
    .split(" ")
    .slice(0, 5)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const profileName = state.profileName || defaultName;

  return (
    <div>
      <h2 className="text-3xl font-semibold tracking-tight mb-2">Review & confirm</h2>
      <p className="text-gray-500 mb-8">Everything look right?</p>

      <div className="space-y-4 mb-8">
        {/* Profile name */}
        <div className="border border-gray-100 rounded-xl p-4">
          <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">Profile name</label>
          <input
            className="w-full text-lg font-semibold focus:outline-none"
            value={profileName}
            onChange={(e) => update({ profileName: e.target.value })}
            placeholder="Profile name"
          />
        </div>

        <div className="border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Topic</p>
          <p className="text-sm">{state.topic}</p>
        </div>

        <div className="border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
            Sources ({state.sources.length})
          </p>
          <ul className="text-sm space-y-1">
            {state.sources.slice(0, 5).map((s) => (
              <li key={s.id} className="flex items-center gap-2">
                <span className="text-gray-400">•</span>
                <span>{s.name}</span>
                <span className="text-xs text-gray-400">{s.url}</span>
              </li>
            ))}
            {state.sources.length > 5 && (
              <li className="text-gray-400 text-sm">+ {state.sources.length - 5} more</li>
            )}
          </ul>
        </div>

        <div className="border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Format</p>
          <p className="text-sm capitalize">{state.format}</p>
        </div>

        <div className="border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Social posts</p>
          <p className="text-sm">{state.generateSocial ? "LinkedIn post + 3 tweets per run" : "Disabled"}</p>
        </div>

        <div className="border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Schedule</p>
          <p className="text-sm">
            {state.scheduleEnabled
              ? `Enabled — ${state.scheduleCron} (${state.scheduleTimezone})`
              : "Manual runs only"}
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} disabled={saving}>← Back</Button>
        <Button onClick={onConfirm} disabled={saving} size="lg">
          {saving ? "Creating…" : "Create Profile"}
        </Button>
      </div>
    </div>
  );
}

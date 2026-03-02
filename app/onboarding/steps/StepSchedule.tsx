"use client";

import Button from "@/components/Button";
import { OnboardingState } from "../page";

interface Props {
  state: OnboardingState;
  update: (patch: Partial<OnboardingState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${i.toString().padStart(2, "0")}:00`,
}));

const DAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
];

type Frequency = "daily" | "2x" | "weekly";

function parseCron(cron: string): { freq: Frequency; hour: number; days: number[] } {
  const parts = cron.split(" ");
  const hour = parseInt(parts[1]) || 8;
  const dayPart = parts[4];
  if (dayPart === "*") return { freq: "daily", hour, days: [1] };
  const days = dayPart.split(",").map(Number);
  if (days.length === 1) return { freq: "weekly", hour, days };
  return { freq: "2x", hour, days };
}

function buildCron(freq: Frequency, hour: number, days: number[]): string {
  if (freq === "daily") return `0 ${hour} * * *`;
  if (freq === "weekly") return `0 ${hour} * * ${days[0] ?? 1}`;
  return `0 ${hour} * * ${days.slice(0, 2).join(",")}`;
}

function cronDescription(cron: string, timezone: string): string {
  const { freq, hour, days } = parseCron(cron);
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const timeStr = `${hour.toString().padStart(2, "0")}:00 ${timezone}`;
  if (freq === "daily") return `Every day at ${timeStr}`;
  if (freq === "weekly") return `Every ${dayNames[(days[0] ?? 1) - 1]} at ${timeStr}`;
  return `Every ${days.map((d) => dayNames[d - 1]).join(" and ")} at ${timeStr}`;
}

export default function StepSchedule({ state, update, onNext, onBack }: Props) {
  const { freq, hour, days } = parseCron(state.scheduleCron);

  function setFreq(f: Frequency) {
    update({ scheduleCron: buildCron(f, hour, days) });
  }

  function setHour(h: number) {
    update({ scheduleCron: buildCron(freq, h, days) });
  }

  function toggleDay(d: number) {
    const next = days.includes(d) ? days.filter((x) => x !== d) : [...days, d];
    if (next.length === 0) return;
    update({ scheduleCron: buildCron(freq, hour, next) });
  }

  return (
    <div>
      <h2 className="text-3xl font-semibold tracking-tight mb-2">Schedule</h2>
      <p className="text-gray-500 mb-8">You can always run manually. This sets up automatic runs.</p>

      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => update({ scheduleEnabled: !state.scheduleEnabled })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            state.scheduleEnabled ? "bg-gray-900" : "bg-gray-200"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              state.scheduleEnabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className="text-sm text-gray-700">Enable automatic runs</span>
      </div>

      {state.scheduleEnabled && (
        <div className="space-y-6">
          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
            <div className="flex gap-2">
              {(["daily", "2x", "weekly"] as Frequency[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFreq(f)}
                  className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                    freq === f ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {f === "daily" ? "Daily" : f === "2x" ? "2x / week" : "Weekly"}
                </button>
              ))}
            </div>
          </div>

          {/* Day picker */}
          {(freq === "weekly" || freq === "2x") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {freq === "2x" ? "Pick 2 days" : "Pick a day"}
              </label>
              <div className="flex gap-2">
                {DAYS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => toggleDay(d.value)}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                      days.includes(d.value)
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Time */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                value={hour}
                onChange={(e) => setHour(parseInt(e.target.value))}
              >
                {HOURS.map((h) => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                value={state.scheduleTimezone}
                onChange={(e) => update({ scheduleTimezone: e.target.value })}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview */}
          <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-3">
            Will run: <strong>{cronDescription(state.scheduleCron, state.scheduleTimezone)}</strong>
          </p>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <Button onClick={onNext} size="lg">Next →</Button>
      </div>
    </div>
  );
}

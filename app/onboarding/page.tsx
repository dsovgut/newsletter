"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Source } from "@/lib/types";
import Button from "@/components/Button";
import StepTopic from "./steps/StepTopic";
import StepSources from "./steps/StepSources";
import StepFormat from "./steps/StepFormat";
import StepWritingStyle from "./steps/StepWritingStyle";
import StepSchedule from "./steps/StepSchedule";
import StepReview from "./steps/StepReview";

export interface OnboardingState {
  topic: string;
  sources: Source[];
  format: "flash" | "brief" | "digest";
  generateSocial: boolean;
  linkedinStyle: string;
  linkedinSamples: string;
  tweetStyle: string;
  tweetSamples: string;
  scheduleEnabled: boolean;
  scheduleCron: string;
  scheduleTimezone: string;
  profileName: string;
}

const STEPS = ["Topic", "Sources", "Format", "Writing Style", "Schedule", "Review"];

const defaultState: OnboardingState = {
  topic: "",
  sources: [],
  format: "brief",
  generateSocial: true,
  linkedinStyle: "",
  linkedinSamples: "",
  tweetStyle: "",
  tweetSamples: "",
  scheduleEnabled: false,
  scheduleCron: "0 8 * * 1",
  scheduleTimezone: "UTC",
  profileName: "",
};

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<OnboardingState>(defaultState);
  const [saving, setSaving] = useState(false);

  function update(patch: Partial<OnboardingState>) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  function next() {
    setStep((s) => s + 1);
  }

  function back() {
    setStep((s) => s - 1);
  }

  async function confirm() {
    setSaving(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.profileName || state.topic,
          topic: state.topic,
          sources: state.sources,
          format: state.format,
          linkedinStyle: state.linkedinStyle,
          tweetStyle: state.tweetStyle,
          schedule: {
            enabled: state.scheduleEnabled,
            cron: state.scheduleCron,
            timezone: state.scheduleTimezone,
          },
        }),
      });
      const profile = await res.json();

      // Save writing samples if provided
      if (state.linkedinSamples || state.tweetSamples) {
        const content = [
          state.linkedinSamples ? `=== LinkedIn Posts ===\n${state.linkedinSamples}` : "",
          state.tweetSamples ? `=== Tweets ===\n${state.tweetSamples}` : "",
        ]
          .filter(Boolean)
          .join("\n\n");
        await fetch("/api/writing-sample", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId: profile.id, content }),
        });
      }

      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    i < step
                      ? "bg-gray-900 text-white"
                      : i === step
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 w-8 mx-1 ${i < step ? "bg-gray-900" : "bg-gray-100"}`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-400">
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>
        </div>

        {/* Steps */}
        {step === 0 && <StepTopic state={state} update={update} onNext={next} />}
        {step === 1 && <StepSources state={state} update={update} onNext={next} onBack={back} />}
        {step === 2 && <StepFormat state={state} update={update} onNext={next} onBack={back} />}
        {step === 3 && (
          <StepWritingStyle state={state} update={update} onNext={next} onBack={back} />
        )}
        {step === 4 && <StepSchedule state={state} update={update} onNext={next} onBack={back} />}
        {step === 5 && (
          <StepReview state={state} update={update} onConfirm={confirm} onBack={back} saving={saving} />
        )}
      </div>
    </div>
  );
}

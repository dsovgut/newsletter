"use client";

import Button from "@/components/Button";
import { OnboardingState } from "../page";

interface Props {
  state: OnboardingState;
  update: (patch: Partial<OnboardingState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const FORMATS = [
  {
    id: "flash" as const,
    name: "Flash",
    description: "5 bullet points, 2 min read, pure signal",
    goodFor: "Daily",
  },
  {
    id: "brief" as const,
    name: "Brief",
    description: "3 stories, 3-sentence summary each + 'why it matters'",
    goodFor: "2-3x / week",
  },
  {
    id: "digest" as const,
    name: "Digest",
    description: "5 stories with fuller takes + synthesis paragraph at end",
    goodFor: "Weekly",
  },
];

export default function StepFormat({ state, update, onNext, onBack }: Props) {
  return (
    <div>
      <h2 className="text-3xl font-semibold tracking-tight mb-2">Pick your format</h2>
      <p className="text-gray-500 mb-8">This determines how much detail you get in each digest.</p>

      <div className="space-y-3 mb-8">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            onClick={() => update({ format: f.id })}
            className={`w-full text-left p-5 rounded-xl border transition-colors ${
              state.format === f.id
                ? "border-gray-900 bg-gray-50"
                : "border-gray-100 hover:border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-base">{f.name}</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {f.goodFor}
              </span>
            </div>
            <p className="text-sm text-gray-500">{f.description}</p>
          </button>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <Button onClick={onNext} size="lg">Next →</Button>
      </div>
    </div>
  );
}

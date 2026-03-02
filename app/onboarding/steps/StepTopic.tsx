"use client";

import Button from "@/components/Button";
import { OnboardingState } from "../page";

interface Props {
  state: OnboardingState;
  update: (patch: Partial<OnboardingState>) => void;
  onNext: () => void;
}

export default function StepTopic({ state, update, onNext }: Props) {
  return (
    <div>
      <h2 className="text-3xl font-semibold tracking-tight mb-2">What do you want to stay on top of?</h2>
      <p className="text-gray-500 mb-8">
        Be specific. The more focused, the better your digest will be.
      </p>

      <textarea
        className="w-full border border-gray-200 rounded-xl p-4 text-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        rows={3}
        placeholder="e.g. AI in venture capital, climate tech policy, consumer brand building"
        value={state.topic}
        onChange={(e) => update({ topic: e.target.value })}
        autoFocus
      />

      <div className="mt-6 flex justify-end">
        <Button onClick={onNext} disabled={!state.topic.trim()} size="lg">
          Next →
        </Button>
      </div>
    </div>
  );
}

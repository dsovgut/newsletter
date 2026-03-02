"use client";

import Button from "@/components/Button";
import { OnboardingState } from "../page";

interface Props {
  state: OnboardingState;
  update: (patch: Partial<OnboardingState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepWritingStyle({ state, update, onNext, onBack }: Props) {
  return (
    <div>
      <h2 className="text-3xl font-semibold tracking-tight mb-2">Writing style</h2>
      <p className="text-gray-500 mb-2">
        Optional but highly recommended. The more context you give, the better the output.
      </p>

      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => update({ generateSocial: !state.generateSocial })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            state.generateSocial ? "bg-gray-900" : "bg-gray-200"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              state.generateSocial ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className="text-sm text-gray-700">Generate LinkedIn posts and tweets</span>
      </div>

      {state.generateSocial && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe your voice
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
              rows={2}
              placeholder='Direct, no fluff, slightly contrarian, never uses buzzwords'
              value={state.linkedinStyle}
              onChange={(e) => update({ linkedinStyle: e.target.value })}
            />
            <p className="text-xs text-gray-400 mt-1">
              Leave blank to use default: "Human, direct, no emojis, no bullet points, no corporate speak."
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              LinkedIn writing samples
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
              rows={5}
              placeholder="Paste 3-5 examples of your own LinkedIn posts here..."
              value={state.linkedinSamples}
              onChange={(e) => update({ linkedinSamples: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tweet examples
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
              rows={4}
              placeholder="Paste 3-5 example tweets you've written or like..."
              value={state.tweetSamples}
              onChange={(e) => update({ tweetSamples: e.target.value })}
            />
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <Button onClick={onNext} size="lg">Next →</Button>
      </div>
    </div>
  );
}

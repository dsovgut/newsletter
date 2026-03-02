"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Button from "@/components/Button";
import { Source } from "@/lib/types";
import { OnboardingState } from "../page";

interface Props {
  state: OnboardingState;
  update: (patch: Partial<OnboardingState>) => void;
  onNext: () => void;
  onBack: () => void;
}

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

export default function StepSources({ state, update, onNext, onBack }: Props) {
  const [suggested, setSuggested] = useState<(Source & { description?: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customName, setCustomName] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [customSources, setCustomSources] = useState<Source[]>(
    state.sources.filter((s) => !s.suggested)
  );

  useEffect(() => {
    setLoading(true);
    fetch("/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: state.topic }),
    })
      .then((r) => r.json())
      .then((data) => {
        setSuggested(data);
        // Pre-select all
        setSelected(new Set(data.map((s: Source) => s.id)));
      })
      .finally(() => setLoading(false));
  }, [state.topic]);

  function toggleSource(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addCustom() {
    if (!customName.trim() || !customUrl.trim()) return;
    const source: Source = {
      id: uuidv4(),
      name: customName.trim(),
      url: customUrl.trim(),
      type: detectType(customUrl),
      suggested: false,
    };
    setCustomSources((prev) => [...prev, source]);
    setCustomName("");
    setCustomUrl("");
  }

  function removeCustom(id: string) {
    setCustomSources((prev) => prev.filter((s) => s.id !== id));
  }

  function handleNext() {
    const selectedSuggested = suggested.filter((s) => selected.has(s.id));
    update({ sources: [...selectedSuggested, ...customSources] });
    onNext();
  }

  const totalSelected = selected.size + customSources.length;

  return (
    <div>
      <h2 className="text-3xl font-semibold tracking-tight mb-2">Choose your sources</h2>
      <p className="text-gray-500 mb-8">
        AI-suggested based on your topic. Select the ones you want to track.
      </p>

      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-block w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-gray-400 text-sm">Finding the best sources for "{state.topic}"...</p>
        </div>
      ) : (
        <div className="space-y-2 mb-8">
          {suggested.map((source) => (
            <button
              key={source.id}
              onClick={() => toggleSource(source.id)}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${
                selected.has(source.id)
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    selected.has(source.id) ? "bg-gray-900 border-gray-900" : "border-gray-300"
                  }`}
                >
                  {selected.has(source.id) && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="currentColor">
                      <path d="M1.5 5.5L3.5 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm">{source.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${TYPE_COLORS[source.type]}`}>
                      {source.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{source.url}</p>
                  {"description" in source && source.description && (
                    <p className="text-xs text-gray-500 mt-1">{(source as Source & { description: string }).description}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Add custom */}
      <div className="border-t border-gray-100 pt-6 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Add your own</h3>
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
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
          />
          <Button variant="secondary" size="sm" onClick={addCustom}>
            Add
          </Button>
        </div>

        {customSources.length > 0 && (
          <div className="mt-3 space-y-1">
            {customSources.map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-sm py-2 px-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{s.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${TYPE_COLORS[s.type]}`}>
                  {s.type}
                </span>
                <span className="text-gray-400 text-xs truncate flex-1">{s.url}</span>
                <button
                  onClick={() => removeCustom(s.id)}
                  className="text-gray-300 hover:text-red-500 text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <Button onClick={handleNext} disabled={totalSelected === 0}>
          Next → ({totalSelected} selected)
        </Button>
      </div>
    </div>
  );
}

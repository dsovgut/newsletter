"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/Button";
import Toast from "@/components/Toast";
import { DigestRun } from "@/lib/types";

interface OutputData {
  content: string;
  date: string;
}

interface HistoryData {
  history: string[];
  slug: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded px-2 py-1 transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function StoryFeedback({
  profileId,
  runDate,
  storyTitle,
  storyUrl,
  onSaved,
}: {
  profileId: string;
  runDate: string;
  storyTitle: string;
  storyUrl: string;
  onSaved: () => void;
}) {
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [comment, setComment] = useState("");
  const [saved, setSaved] = useState(false);

  async function save() {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, runDate, storyTitle, storyUrl, rating, comment }),
    });
    setSaved(true);
    onSaved();
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 flex items-start gap-3">
      <div className="flex gap-1">
        <button
          onClick={() => setRating("up")}
          className={`text-lg transition-opacity ${rating === "up" ? "opacity-100" : "opacity-40 hover:opacity-70"}`}
        >
          👍
        </button>
        <button
          onClick={() => setRating("down")}
          className={`text-lg transition-opacity ${rating === "down" ? "opacity-100" : "opacity-40 hover:opacity-70"}`}
        >
          👎
        </button>
      </div>
      {rating && !saved && (
        <div className="flex-1 flex gap-2">
          <input
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-900"
            placeholder="Optional comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button size="sm" onClick={save}>Save</Button>
        </div>
      )}
      {saved && <p className="text-xs text-gray-400 pt-1">Saved — this will improve future digests</p>}
    </div>
  );
}

export default function RunPage() {
  const { id: profileId } = useParams<{ id: string }>();
  const router = useRouter();
  const [history, setHistory] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [output, setOutput] = useState<OutputData | null>(null);
  const [runResult, setRunResult] = useState<DigestRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const loadHistory = useCallback(async () => {
    const res = await fetch(`/api/outputs/${profileId}`);
    const data: HistoryData = await res.json();
    setHistory(data.history);
    return data.history;
  }, [profileId]);

  useEffect(() => {
    loadHistory().then((hist) => {
      if (hist.length > 0) {
        const latest = hist[0].replace(".md", "");
        setSelectedDate(latest);
      } else {
        setLoading(false);
      }
    });
  }, [loadHistory]);

  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    fetch(`/api/outputs/${profileId}?date=${selectedDate}`)
      .then((r) => r.json())
      .then((data: OutputData) => setOutput(data))
      .finally(() => setLoading(false));
  }, [selectedDate, profileId]);

  async function runNow() {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await fetch(`/api/run/${profileId}`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        alert(`Run failed: ${err.error}`);
        return;
      }
      const data: DigestRun = await res.json();
      setRunResult(data);
      // Refresh history
      await loadHistory();
      setSelectedDate(data.date);
    } finally {
      setRunning(false);
    }
  }

  // Parse the markdown output into sections
  function parseSections(content: string) {
    const digestMatch = content.match(/## Digest\n\n([\s\S]*?)(?=\n---|\n## |$)/);
    const linkedinMatch = content.match(/## LinkedIn Post\n\n([\s\S]*?)(?=\n---|\n## |$)/);
    const tweetsMatch = content.match(/## Tweets\n\n([\s\S]*?)(?=\n---|\n## |$)/);

    const tweets = tweetsMatch
      ? tweetsMatch[1]
          .trim()
          .split("\n")
          .filter((l) => l.match(/^\d+\./))
          .map((l) => l.replace(/^\d+\.\s*/, "").trim())
      : [];

    return {
      digest: digestMatch?.[1]?.trim() ?? content,
      linkedin: linkedinMatch?.[1]?.trim() ?? "",
      tweets,
    };
  }

  const content = output?.content ?? "";
  const { digest, linkedin, tweets } = parseSections(content);
  const runDate = selectedDate ?? runResult?.date ?? "";

  return (
    <div className="min-h-screen bg-white">
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600 mb-2 block">
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-semibold">Digest</h1>
            {runDate && <p className="text-sm text-gray-400 mt-0.5">{runDate}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              History
            </button>
            <Button onClick={runNow} disabled={running}>
              {running ? "Running…" : "Run Again"}
            </Button>
          </div>
        </div>

        {/* History dropdown */}
        {showHistory && history.length > 0 && (
          <div className="mb-6 border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Past runs</p>
            <div className="space-y-1">
              {history.map((file) => {
                const date = file.replace(".md", "");
                return (
                  <button
                    key={date}
                    onClick={() => { setSelectedDate(date); setShowHistory(false); }}
                    className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                      selectedDate === date ? "bg-gray-900 text-white" : "hover:bg-gray-50"
                    }`}
                  >
                    {date}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center">
            {running ? (
              <div>
                <div className="inline-block w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-400">Fetching sources and generating digest…</p>
                <p className="text-gray-300 text-sm mt-1">This takes about 30-60 seconds</p>
              </div>
            ) : (
              <p className="text-gray-400">Loading…</p>
            )}
          </div>
        ) : history.length === 0 && !runResult ? (
          <div className="py-24 text-center border border-dashed border-gray-200 rounded-2xl">
            <p className="text-gray-400 mb-4">No digests yet</p>
            <Button onClick={runNow} disabled={running}>
              {running ? "Running…" : "Run Now"}
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Digest */}
            {digest && (
              <section>
                <div className="prose prose-gray max-w-none">
                  {digest.split("\n").map((line, i) => {
                    if (line.startsWith("### ") || line.startsWith("## ") || line.startsWith("# ")) {
                      return <h3 key={i} className="text-base font-semibold mt-6 mb-2">{line.replace(/^#+\s/, "")}</h3>;
                    }
                    if (line.startsWith("• ") || line.startsWith("- ")) {
                      return <p key={i} className="text-gray-700 leading-relaxed mb-2 pl-4 border-l-2 border-gray-200">{line.replace(/^[•-]\s/, "")}</p>;
                    }
                    if (line.trim() === "") return <div key={i} className="h-3" />;
                    return <p key={i} className="text-gray-700 leading-relaxed mb-2">{line}</p>;
                  })}
                </div>

                {/* Feedback per story - using run result if available */}
                {runResult?.stories?.map((story) => (
                  <div key={story.url} className="mt-6 p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs font-medium text-gray-500 mb-0.5">{story.source}</p>
                    <a href={story.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">
                      {story.title}
                    </a>
                    <StoryFeedback
                      profileId={profileId}
                      runDate={runDate}
                      storyTitle={story.title}
                      storyUrl={story.url}
                      onSaved={() => setToast("Saved — this will improve future digests")}
                    />
                  </div>
                ))}
              </section>
            )}

            {/* LinkedIn */}
            {linkedin && (
              <section className="border-t border-gray-100 pt-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold">LinkedIn Post</h2>
                  <CopyButton text={linkedin} />
                </div>
                <div className="bg-blue-50 rounded-xl p-5">
                  {linkedin.split("\n").map((line, i) =>
                    line.trim() === "" ? (
                      <div key={i} className="h-3" />
                    ) : (
                      <p key={i} className="text-gray-800 text-sm leading-relaxed">
                        {line}
                      </p>
                    )
                  )}
                </div>
              </section>
            )}

            {/* Tweets */}
            {tweets.length > 0 && (
              <section className="border-t border-gray-100 pt-8">
                <h2 className="text-base font-semibold mb-3">Tweet Options</h2>
                <div className="space-y-3">
                  {tweets.map((tweet, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                      <span className="text-xs text-gray-400 font-medium mt-0.5">{i + 1}</span>
                      <p className="flex-1 text-sm leading-relaxed">{tweet}</p>
                      <CopyButton text={tweet} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

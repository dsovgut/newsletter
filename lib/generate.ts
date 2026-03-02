import Anthropic from "@anthropic-ai/sdk";
import {
  SOURCE_SUGGESTION_PROMPT,
  STORY_SCORING_PROMPT,
  FLASH_DIGEST_PROMPT,
  BRIEF_DIGEST_PROMPT,
  DIGEST_PROMPT,
  LINKEDIN_POST_PROMPT,
  TWEET_PROMPT,
} from "./prompts";
import { Candidate, FeedbackEntry, Profile, Source } from "./types";

const MODEL = "claude-sonnet-4-20250514";

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

async function ask(prompt: string): Promise<string> {
  const client = getClient();
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });
  const block = msg.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");
  return block.text;
}

export async function suggestSources(topic: string): Promise<Source[]> {
  const prompt = SOURCE_SUGGESTION_PROMPT(topic);
  const raw = await ask(prompt);

  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return parsed.map((s: { name: string; url: string; type: string }, i: number) => ({
      id: `suggested-${i}`,
      name: s.name,
      url: s.url,
      type: (["twitter", "linkedin", "blog", "newsletter"].includes(s.type)
        ? s.type
        : "other") as Source["type"],
      suggested: true,
    }));
  } catch {
    return [];
  }
}

export async function scoreCandidates(
  candidates: Candidate[],
  topic: string,
  feedback: FeedbackEntry[],
  targetCount: number
): Promise<Candidate[]> {
  if (candidates.length === 0) return [];

  const liked = feedback
    .filter((f) => f.rating === "up")
    .map((f) => f.storyTitle)
    .slice(-10);
  const disliked = feedback
    .filter((f) => f.rating === "down")
    .map((f) => f.storyTitle)
    .slice(-10);

  const feedbackSummary =
    [
      liked.length ? `User liked: ${liked.join(", ")}` : "",
      disliked.length ? `User disliked: ${disliked.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join(". ") || "No feedback yet.";

  const candidateList = candidates
    .map((c, i) => `${i + 1}. Title: ${c.title}\n   URL: ${c.url}\n   Summary: ${c.summary}`)
    .join("\n\n");

  const prompt = STORY_SCORING_PROMPT(topic, feedbackSummary, candidateList, targetCount);
  const raw = await ask(prompt);

  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return candidates.slice(0, targetCount);
  }
}

export async function generateDigest(
  stories: Candidate[],
  format: Profile["format"],
  topic: string
): Promise<string> {
  const storiesText = stories
    .map((s, i) => `${i + 1}. ${s.title}\n   URL: ${s.url}\n   ${s.summary}`)
    .join("\n\n");

  let prompt: string;
  if (format === "flash") {
    prompt = FLASH_DIGEST_PROMPT(topic, storiesText);
  } else if (format === "brief") {
    prompt = BRIEF_DIGEST_PROMPT(topic, storiesText);
  } else {
    prompt = DIGEST_PROMPT(topic, storiesText);
  }

  return ask(prompt);
}

export async function generateLinkedInPost(
  topStory: Candidate,
  topic: string,
  writingSample: string | null,
  linkedinStyle: string
): Promise<string> {
  const storyText = `${topStory.title}\n${topStory.url}\n${topStory.summary}`;
  const prompt = LINKEDIN_POST_PROMPT(topic, storyText, writingSample, linkedinStyle);
  return ask(prompt);
}

export async function generateTweets(
  topStory: Candidate,
  topic: string,
  tweetSamples: string | null,
  tweetStyle: string
): Promise<string[]> {
  const storyText = `${topStory.title}\n${topStory.url}\n${topStory.summary}`;
  const prompt = TWEET_PROMPT(topic, storyText, tweetSamples, tweetStyle);
  const raw = await ask(prompt);

  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    // Try to extract tweets from numbered list
    const lines = raw
      .split("\n")
      .filter((l) => l.match(/^\d+\./))
      .map((l) => l.replace(/^\d+\.\s*/, "").trim());
    return lines.length >= 3 ? lines.slice(0, 3) : ["Tweet generation failed. Try again."];
  }
}

export const SOURCE_SUGGESTION_PROMPT = (topic: string) => `
Given the topic "${topic}", suggest 10 high-quality sources a professional should follow.
Include a mix of: Twitter/X accounts, LinkedIn thought leaders, independent blogs, and newsletters.
For each source return: name, URL, type (twitter/linkedin/blog/newsletter), one-sentence description of why it's relevant.
Return ONLY a valid JSON array with no markdown, no code blocks, just the raw JSON array.
Format: [{"name": "...", "url": "...", "type": "...", "description": "..."}]
`.trim();

export const STORY_SCORING_PROMPT = (
  topic: string,
  feedbackSummary: string,
  candidates: string,
  targetCount: number
) => `
Topic: ${topic}
User feedback history: ${feedbackSummary || "No feedback yet."}

Here are recent articles/posts from this user's sources:
${candidates}

Select the best ${targetCount} for a professional digest on this topic.
Criteria: relevance to topic, recency, signal over noise, not generic takes.
Return ONLY a valid JSON array of the selected items ranked by importance, with fields: title, url, summary, publishedDate, source.
`.trim();

export const FLASH_DIGEST_PROMPT = (topic: string, stories: string) => `
Write a Flash digest (5 bullet points, max 2 min read) for a professional following "${topic}".
Based on these stories:
${stories}

Rules: pure signal, no fluff, each bullet is one crisp insight. No emojis. Start each bullet with "•".
`.trim();

export const BRIEF_DIGEST_PROMPT = (topic: string, stories: string) => `
Write a Brief digest covering 3 stories for a professional following "${topic}".
Based on these stories:
${stories}

For each story: headline, 3-sentence summary, one "why it matters" sentence.
Tone: sharp, direct, no corporate speak.
`.trim();

export const DIGEST_PROMPT = (topic: string, stories: string) => `
Write a Digest covering 5 stories for a professional following "${topic}".
Based on these stories:
${stories}

For each story: headline + substantive paragraph (4-6 sentences).
End with a short synthesis paragraph titled "The bigger picture".
Tone: intelligent, direct, like a sharp analyst writing for a peer.
`.trim();

export const LINKEDIN_POST_PROMPT = (
  topic: string,
  topStory: string,
  writingSample: string | null,
  linkedinStyle: string
) => `
Write a LinkedIn post based on this story: ${topStory}
Topic context: ${topic}

${
  writingSample
    ? `Here are examples of how this person writes:\n${writingSample}\nMatch their voice closely.`
    : `Style: ${linkedinStyle || "Human, direct, no emojis, no bullet points, no hashtags unless natural, no corporate speak. Write like a sharp person sharing a genuine take with their professional network."}`
}

Max 200 words. Do not start with "I". No emojis.
`.trim();

export const TWEET_PROMPT = (
  topic: string,
  topStory: string,
  tweetSamples: string | null,
  tweetStyle: string
) => `
Write 3 tweet options based on this story: ${topStory}
Topic context: ${topic}

${
  tweetSamples
    ? `Examples of their tweet style:\n${tweetSamples}`
    : `Style: ${tweetStyle || "Punchy, no hashtags, no emojis, sounds like a real person not a content account."}`
}

Each tweet under 280 characters. Return ONLY a valid JSON array of 3 strings, no markdown, no code blocks.
`.trim();

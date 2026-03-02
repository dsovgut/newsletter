# Intelligent Newsletter Builder — MVP Spec
> For Claude Code. Build this exactly as described. Do not over-engineer. Ship the simplest version that does the job.

---

## What This Is

A local web app that lets a user create multiple "newsletter profiles" — each profile tracks a topic, a curated list of sources, a preferred format, and a writing style. On demand (or on schedule), it fetches the latest content from those sources, synthesizes it into a digest, and generates LinkedIn posts and tweets in the user's voice. Output is saved as local files. Feedback per story is logged locally and fed back into future prompts.

---

## Tech Stack

- **Frontend:** Next.js (App Router) + Tailwind CSS
- **Backend:** Next.js API routes
- **LLM:** Anthropic Claude API (`claude-sonnet-4-20250514`)
- **News fetching:** Exa API (best for semantic search + URL crawling) with NewsAPI as fallback
- **Database:** Local JSON files in `/database` folder for now. Structure so that swapping to Postgres later requires only changing the read/write functions — keep all DB calls in `/lib/db.ts`
- **Scheduling:** node-cron running inside the Next.js server
- **Output:** Markdown files saved to `/outputs/{profile-slug}/{date}.md`

---

## Environment Variables

```
ANTHROPIC_API_KEY=
EXA_API_KEY=
NEWSAPI_KEY=
DATABASE_URL= # empty for now, reserved for Postgres later
```

---

## Folder Structure

```
/app
  /onboarding         # multi-step profile creation flow
  /dashboard          # list of all newsletter profiles
  /profile/[id]       # view/edit a single profile
  /run/[id]           # view generated digest for a profile
/components
/lib
  /db.ts              # ALL database reads/writes go here
  /fetch.ts           # news fetching logic (Exa + NewsAPI)
  /generate.ts        # all Claude API calls
  /scheduler.ts       # cron job logic
/database             # local JSON files (git-ignored except .gitkeep)
  /profiles.json
  /feedback.json
  /writing-samples/   # one .txt file per profile
/outputs              # generated digests (git-ignored except .gitkeep)
  /{profile-slug}/
    /2025-01-27.md
```

---

## Data Models

### Profile
```typescript
{
  id: string,
  name: string,                    // e.g. "AI in Venture Capital"
  topic: string,                   // the raw topic string
  sources: Source[],
  format: "flash" | "brief" | "digest",
  linkedinStyle: string,           // free text style description, optional
  tweetStyle: string,              // free text style description, optional
  writingSamplePath: string,       // path to .txt file with writing samples
  schedule: {
    enabled: boolean,
    cron: string,                  // e.g. "0 8 * * 1" for Monday 8am
    timezone: string
  },
  createdAt: string,
  lastRunAt: string | null
}
```

### Source
```typescript
{
  id: string,
  name: string,                    // e.g. "Ben Evans"
  url: string,                     // blog, Twitter, LinkedIn URL
  type: "blog" | "twitter" | "linkedin" | "newsletter" | "other",
  suggested: boolean               // true if AI suggested it, false if user added
}
```

### Feedback Entry
```typescript
{
  profileId: string,
  runDate: string,
  storyTitle: string,
  storyUrl: string,
  rating: "up" | "down",
  comment: string,                 // optional free text
  savedAt: string
}
```

---

## Features

### 1. Onboarding Flow (multi-step, `/onboarding`)

A clean step-by-step flow. Progress indicator at top. Each step saves to state, profile only written to DB on final confirmation.

**Step 1 — Topic**
- Large text input: "What do you want to stay on top of?"
- Placeholder examples: "AI in venture capital", "climate tech policy", "consumer brand building"
- On Next: kick off background API call to suggest sources (non-blocking, shows loading state on step 2)

**Step 2 — Sources**
- Shows AI-suggested sources (fetched using Exa search: `"{topic} best blogs twitter linkedin accounts to follow"`)
- Each suggestion shows: Name, URL, type badge (Twitter / LinkedIn / Blog / Newsletter), one-line description
- Checkboxes to select which to include
- "Add your own" section below: fields for Name + URL, type auto-detected from URL
- At least 1 source required to continue

**Step 3 — Format**
- Three cards to pick from:

  | Format | Description | Good for |
  |--------|-------------|----------|
  | **Flash** | 5 bullet points, 2 min read, pure signal | Daily |
  | **Brief** | 3 stories, 3-sentence summary each + "why it matters" | 2-3x/week |
  | **Digest** | 5 stories with fuller takes + synthesis paragraph at end | Weekly |

**Step 4 — Writing Style (optional but encouraged)**
- Toggle: "Generate LinkedIn posts and tweets" (default ON)
- If ON, show:
  - Style description textarea: "Describe your voice" — placeholder: "Direct, no fluff, slightly contrarian, never uses buzzwords"
  - Default style if left blank: `"Human, direct, no emojis, no bullet points, no corporate speak. Write like a sharp person texting a smart friend."`
  - Writing samples uploader: textarea where user pastes 3-5 examples of their own LinkedIn posts or tweets. Saved to `/database/writing-samples/{profile-id}.txt`
  - Tweet examples: separate textarea — "Paste 3-5 example tweets you've written or like"

**Step 5 — Schedule**
- Toggle: Enable automatic runs
- If enabled:
  - Frequency picker: Daily / 2x per week / Weekly
  - Day picker (if weekly/2x): Mon, Tue, Wed, Thu, Fri
  - Time picker: Hour + timezone dropdown
  - Preview: "Will run every Monday at 8:00 AM CET"
- Manual run always available regardless

**Step 6 — Review + Confirm**
- Summary of all choices
- Profile name auto-generated from topic (editable)
- "Create Profile" button → saves to `/database/profiles.json` → redirects to dashboard

---

### 2. Dashboard (`/dashboard`)

- List of all profiles as cards
- Each card shows: profile name, topic, format, last run date, next scheduled run
- Buttons: "Run Now", "Edit", "View History"
- "New Profile" button → goes to onboarding
- Empty state: friendly prompt to create first profile

---

### 3. Run a Digest

Triggered manually ("Run Now") or by scheduler. Calls `/api/run/[profileId]`.

**Pipeline:**

```
1. Fetch recent content from all sources in profile
   → Use Exa to search each source URL + topic for last 7 days
   → Deduplicate by URL
   → Take top 10-15 candidates

2. Score + filter with Claude
   → Send all candidates to Claude with topic context + any past feedback from feedback.json
   → Claude selects best 3 or 5 (based on format) and ranks them
   → Prompt includes: feedback history summarised as "User previously disliked: X. User previously liked: Y."

3. Generate digest in selected format
   → Flash: 5 bullets
   → Brief: 3 stories with summary + why it matters
   → Digest: 5 stories with fuller takes + synthesis paragraph

4. Generate LinkedIn post (if enabled)
   → Uses writing sample file if it exists
   → Default style if not
   → No emojis. No bullet points. Human voice. Max 200 words.
   → Based on the single most interesting story in the digest

5. Generate 3 tweet options (if enabled)
   → Short, punchy, no hashtags unless user's samples use them
   → Each under 280 chars
   → Based on same top story as LinkedIn post

6. Save output to /outputs/{profile-slug}/{YYYY-MM-DD}.md
   → Include: digest + linkedin post + tweets + metadata (sources used, run date)

7. Return to frontend for display
```

---

### 4. Digest View (`/run/[id]`)

Displays the most recent (or selected) digest for a profile.

**Layout:**
- Header: profile name, run date, sources used
- Digest content rendered as clean readable text (not a table, not bullet soup)
- Each story has at the bottom: 👍 👎 + optional comment text field + "Save feedback" button
  - Feedback saved to `/database/feedback.json`
  - Toast confirmation: "Saved — this will improve future digests"
- LinkedIn post section: rendered post + "Copy" button + "Regenerate" button
- Tweets section: 3 options, each with "Copy" button
- "Run Again" button at top right
- "View History" link → lists all past runs for this profile

---

### 5. Profile Edit (`/profile/[id]`)

Same layout as onboarding but pre-filled. Can edit any field. Can add/remove sources. Can update writing samples. Save updates profile in DB.

---

### 6. Scheduler (`/lib/scheduler.ts`)

- Runs on server start
- Loads all profiles with `schedule.enabled = true`
- Registers cron jobs for each
- On trigger: calls the same run pipeline as "Run Now"
- Logs run to profile's `lastRunAt`
- If a new profile is created or schedule updated, re-registers cron jobs

---

## Claude Prompts

Keep all prompts in `/lib/prompts.ts` as exported constants so they're easy to iterate on.

### Source Suggestion Prompt
```
Given the topic "{topic}", suggest 10 high-quality sources a professional should follow. 
Include a mix of: Twitter/X accounts, LinkedIn thought leaders, independent blogs, and newsletters.
For each source return: name, URL, type (twitter/linkedin/blog/newsletter), one-sentence description of why it's relevant.
Return as JSON array.
```

### Story Scoring Prompt
```
Topic: {topic}
User feedback history: {feedbackSummary}

Here are {n} recent articles/posts from this user's sources:
{candidateList}

Select the best {targetCount} for a professional digest on this topic.
Criteria: relevance to topic, recency, signal over noise, not generic takes.
Return as JSON array with selected items ranked by importance.
```

### Digest Generation Prompts (one per format)

**Flash:**
```
Write a Flash digest (5 bullet points, max 2 min read) for a professional following "{topic}".
Based on these stories: {stories}
Rules: pure signal, no fluff, each bullet is one crisp insight. No emojis.
```

**Brief:**
```
Write a Brief digest covering 3 stories for a professional following "{topic}".
Based on these stories: {stories}
For each story: headline, 3-sentence summary, one "why it matters" sentence.
Tone: sharp, direct, no corporate speak.
```

**Digest:**
```
Write a Digest covering 5 stories for a professional following "{topic}".
Based on these stories: {stories}
For each story: headline + substantive paragraph (4-6 sentences).
End with a short synthesis paragraph: "The bigger picture".
Tone: intelligent, direct, like a sharp analyst writing for a peer.
```

### LinkedIn Post Prompt
```
Write a LinkedIn post based on this story: {topStory}
Topic context: {topic}

{if writingSample exists}
Here are examples of how this person writes:
{writingSample}
Match their voice closely.
{else}
Style: human, direct, no emojis, no bullet points, no hashtags unless natural, no corporate speak. 
Write like a sharp person sharing a genuine take with their professional network.
{endif}

Max 200 words. Do not start with "I".
```

### Tweet Prompt
```
Write 3 tweet options based on this story: {topStory}
Topic context: {topic}

{if tweetSamples exist}
Examples of their tweet style:
{tweetSamples}
{else}
Style: punchy, no hashtags, no emojis, sounds like a real person not a content account.
{endif}

Each tweet under 280 characters. Return as JSON array of 3 strings.
```

---

## Output File Format

Each run saved as `/outputs/{profile-slug}/{YYYY-MM-DD}.md`:

```markdown
# {Profile Name} — {Date}

**Topic:** {topic}  
**Format:** {format}  
**Sources used:** {n} sources  

---

## Digest

{digest content}

---

## LinkedIn Post

{linkedin post}

---

## Tweets

1. {tweet 1}
2. {tweet 2}
3. {tweet 3}

---

*Generated by Newsletter Builder*
```

---

## UI Notes

- Clean, minimal. No sidebar clutter. White background, good typography.
- Onboarding feels like a modern SaaS signup — one thing per screen, big text, clear progress
- Dashboard is a simple card grid
- Digest view is readable — treat it like a reading experience, not a dashboard
- Use Tailwind only, no component libraries needed except maybe shadcn for the form inputs if convenient

---

## What This Is NOT (do not build)

- No authentication (single user, local)
- No email sending (v1 — files only)
- No Telegram integration (v2)
- No OAuth Twitter/LinkedIn import (v2 — manual entry only for now)
- No mobile app
- No multi-tenancy
- No analytics dashboard

---

## Definition of Done for V1

- [ ] Can create a profile through the full onboarding flow
- [ ] AI suggests sources on step 2 based on topic
- [ ] Can add custom sources manually
- [ ] Can paste writing samples and tweet examples
- [ ] "Run Now" generates a digest in the selected format
- [ ] LinkedIn post and 3 tweet options generated per run
- [ ] Output saved as .md file in /outputs
- [ ] Feedback (👍/👎 + comment) saved to /database/feedback.json
- [ ] Feedback included in next run's scoring prompt
- [ ] Scheduler runs profiles on their configured cadence
- [ ] Multiple profiles supported
- [ ] Dashboard shows all profiles with last run info
- [ ] Can view history of past runs per profile
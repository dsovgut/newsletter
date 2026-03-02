import { Candidate, Source } from "./types";

async function fetchWithExa(sources: Source[], topic: string): Promise<Candidate[]> {
  const Exa = (await import("exa-js")).default;
  const exa = new Exa(process.env.EXA_API_KEY!);

  const candidates: Candidate[] = [];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  for (const source of sources) {
    try {
      const results = await exa.searchAndContents(`${topic} site:${new URL(source.url).hostname}`, {
        numResults: 5,
        startPublishedDate: sevenDaysAgo,
        text: { maxCharacters: 500 },
      });

      for (const r of results.results) {
        candidates.push({
          title: r.title ?? "Untitled",
          url: r.url,
          summary: r.text ?? "",
          publishedDate: r.publishedDate ?? undefined,
          source: source.name,
        });
      }
    } catch {
      // skip failed source
    }
  }

  // Also do a general search on the topic
  try {
    const general = await exa.searchAndContents(topic, {
      numResults: 10,
      startPublishedDate: sevenDaysAgo,
      text: { maxCharacters: 500 },
    });
    for (const r of general.results) {
      candidates.push({
        title: r.title ?? "Untitled",
        url: r.url,
        summary: r.text ?? "",
        publishedDate: r.publishedDate ?? undefined,
        source: "General search",
      });
    }
  } catch {
    // skip
  }

  return candidates;
}

async function fetchWithNewsAPI(topic: string): Promise<Candidate[]> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) return [];

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&from=${sevenDaysAgo}&sortBy=relevancy&pageSize=15&apiKey=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.articles) return [];

    return data.articles.map((a: { title: string; url: string; description: string; publishedAt: string; source: { name: string } }) => ({
      title: a.title,
      url: a.url,
      summary: a.description ?? "",
      publishedDate: a.publishedAt,
      source: a.source?.name ?? "NewsAPI",
    }));
  } catch {
    return [];
  }
}

function deduplicateByUrl(candidates: Candidate[]): Candidate[] {
  const seen = new Set<string>();
  return candidates.filter((c) => {
    if (seen.has(c.url)) return false;
    seen.add(c.url);
    return true;
  });
}

export async function fetchCandidates(sources: Source[], topic: string): Promise<Candidate[]> {
  let candidates: Candidate[] = [];

  if (process.env.EXA_API_KEY) {
    candidates = await fetchWithExa(sources, topic);
  }

  if (candidates.length < 5 && process.env.NEWSAPI_KEY) {
    const newsApiResults = await fetchWithNewsAPI(topic);
    candidates = [...candidates, ...newsApiResults];
  }

  return deduplicateByUrl(candidates).slice(0, 15);
}

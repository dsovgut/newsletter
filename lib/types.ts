export interface Source {
  id: string;
  name: string;
  url: string;
  type: "blog" | "twitter" | "linkedin" | "newsletter" | "other";
  suggested: boolean;
}

export interface Profile {
  id: string;
  name: string;
  topic: string;
  sources: Source[];
  format: "flash" | "brief" | "digest";
  linkedinStyle: string;
  tweetStyle: string;
  writingSamplePath: string;
  schedule: {
    enabled: boolean;
    cron: string;
    timezone: string;
  };
  createdAt: string;
  lastRunAt: string | null;
}

export interface FeedbackEntry {
  profileId: string;
  runDate: string;
  storyTitle: string;
  storyUrl: string;
  rating: "up" | "down";
  comment: string;
  savedAt: string;
}

export interface Candidate {
  title: string;
  url: string;
  summary: string;
  publishedDate?: string;
  source?: string;
}

export interface DigestRun {
  profileId: string;
  date: string;
  digest: string;
  linkedinPost: string;
  tweets: string[];
  sourcesUsed: number;
  stories: Candidate[];
}

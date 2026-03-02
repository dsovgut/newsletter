import fs from "fs";
import path from "path";
import { Profile, FeedbackEntry } from "./types";

const DB_DIR = path.join(process.cwd(), "database");
const PROFILES_FILE = path.join(DB_DIR, "profiles.json");
const FEEDBACK_FILE = path.join(DB_DIR, "feedback.json");
const WRITING_SAMPLES_DIR = path.join(DB_DIR, "writing-samples");

function readJSON<T>(filePath: string, fallback: T): T {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// Profiles
export function getProfiles(): Profile[] {
  return readJSON<Profile[]>(PROFILES_FILE, []);
}

export function getProfile(id: string): Profile | null {
  const profiles = getProfiles();
  return profiles.find((p) => p.id === id) ?? null;
}

export function saveProfile(profile: Profile): void {
  const profiles = getProfiles();
  const idx = profiles.findIndex((p) => p.id === profile.id);
  if (idx >= 0) {
    profiles[idx] = profile;
  } else {
    profiles.push(profile);
  }
  writeJSON(PROFILES_FILE, profiles);
}

export function deleteProfile(id: string): void {
  const profiles = getProfiles().filter((p) => p.id !== id);
  writeJSON(PROFILES_FILE, profiles);
}

// Feedback
export function getFeedback(): FeedbackEntry[] {
  return readJSON<FeedbackEntry[]>(FEEDBACK_FILE, []);
}

export function getFeedbackForProfile(profileId: string): FeedbackEntry[] {
  return getFeedback().filter((f) => f.profileId === profileId);
}

export function saveFeedback(entry: FeedbackEntry): void {
  const feedback = getFeedback();
  feedback.push(entry);
  writeJSON(FEEDBACK_FILE, feedback);
}

// Writing samples
export function getWritingSample(profileId: string): string | null {
  const filePath = path.join(WRITING_SAMPLES_DIR, `${profileId}.txt`);
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

export function saveWritingSample(profileId: string, content: string): string {
  if (!fs.existsSync(WRITING_SAMPLES_DIR)) {
    fs.mkdirSync(WRITING_SAMPLES_DIR, { recursive: true });
  }
  const filePath = path.join(WRITING_SAMPLES_DIR, `${profileId}.txt`);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

// Outputs
export function getOutputPath(profileSlug: string, date: string): string {
  const dir = path.join(process.cwd(), "outputs", profileSlug);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, `${date}.md`);
}

export function saveOutput(profileSlug: string, date: string, content: string): void {
  const filePath = getOutputPath(profileSlug, date);
  fs.writeFileSync(filePath, content, "utf-8");
}

export function getOutputHistory(profileSlug: string): string[] {
  const dir = path.join(process.cwd(), "outputs", profileSlug);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .reverse();
}

export function readOutput(profileSlug: string, date: string): string | null {
  const filePath = path.join(process.cwd(), "outputs", profileSlug, `${date}.md`);
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

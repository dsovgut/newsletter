import cron, { ScheduledTask } from "node-cron";
import { getProfiles, saveProfile } from "./db";
import { runPipeline } from "./pipeline";

const jobs = new Map<string, ScheduledTask>();

export function registerScheduler() {
  const profiles = getProfiles();
  for (const profile of profiles) {
    if (profile.schedule.enabled && profile.schedule.cron) {
      scheduleProfile(profile.id, profile.schedule.cron, profile.schedule.timezone);
    }
  }
}

export function scheduleProfile(profileId: string, cronExpr: string, timezone: string) {
  // Cancel existing job if any
  const existing = jobs.get(profileId);
  if (existing) {
    existing.stop();
    jobs.delete(profileId);
  }

  if (!cron.validate(cronExpr)) {
    console.warn(`Invalid cron expression for profile ${profileId}: ${cronExpr}`);
    return;
  }

  const task = cron.schedule(
    cronExpr,
    async () => {
      console.log(`[Scheduler] Running profile ${profileId}`);
      try {
        await runPipeline(profileId);
        const profiles = getProfiles();
        const profile = profiles.find((p) => p.id === profileId);
        if (profile) {
          profile.lastRunAt = new Date().toISOString();
          saveProfile(profile);
        }
      } catch (err) {
        console.error(`[Scheduler] Failed to run profile ${profileId}:`, err);
      }
    },
    { timezone }
  );

  jobs.set(profileId, task);
}

export function unscheduleProfile(profileId: string) {
  const task = jobs.get(profileId);
  if (task) {
    task.stop();
    jobs.delete(profileId);
  }
}

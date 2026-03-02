export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerScheduler } = await import("./lib/scheduler");
    registerScheduler();
  }
}

import catalog from "../data/activities.json" with { type: "json" };
import type {
  ActivityId,
  Assessment,
  Card,
  EvaluateRequest,
  Event,
  Observation,
  ResolvedPlan,
  Result,
} from "./contracts.ts";

const cards = catalog as Card[];
export const demoClock = "2026-11-27T05:50:00.000Z";
const kstOffset = 9 * 60 * 60 * 1000;
const observationMinutes = 10;
export function clockDate(instant: Date) {
  const local = new Date(instant.getTime() + kstOffset).toISOString();
  return {
    day: local.slice(0, 10),
    time: local.slice(11, 16),
    weekday: new Date(instant.getTime() + kstOffset).getUTCDay(),
  };
}
const toMinutes = (clock: string) =>
  Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3));
const formatTime = (minute: number) =>
  String(Math.floor(minute / 60) % 24).padStart(2, "0") +
  ":" +
  String(minute % 60).padStart(2, "0");
export class PlanInputError extends Error {}
function key(event: Event) {
  if (event.kind === "venueClosed") return "venue/" + event.venue;
  if (event.kind === "verify" || event.kind === "wait")
    return "timing/" + event.id;
  return event.kind + "/" + event.id;
}
function keepLatest(rows: Observation[]) {
  const map = new Map<string, Observation>();
  for (const row of rows) {
    const id = key(row.event),
      prev = map.get(id);
    if (!prev || prev.at <= row.at) map.set(id, row);
  }
  return [...map.values()];
}
function assess(
  card: Card,
  plan: ResolvedPlan,
  rows: Observation[],
  now: Date,
): Assessment {
  const local = clockDate(now),
    current = toMinutes(local.time),
    deadline = toMinutes(plan.timing.time);
  const result = (
    status: Assessment["status"],
    reason: string,
    returnAt: string | null = null,
  ): Assessment => ({ card, status, reason, returnAt });
  if (!card.goals.includes(plan.goal))
    return result("excluded", "It does not meet the experience you chose.");
  if (plan.stepFree && card.access === "stairs")
    return result("excluded", "The reviewed Gwanggyo entrance has stairs.");
  const events = rows.map((row) => row.event);
  if (events.some((e) => e.kind === "venueClosed" && e.venue === card.venue))
    return result("excluded", "You reported this whole venue closed.");
  if (events.some((e) => e.kind === "closed" && e.id === card.id))
    return result("excluded", "You reported this activity closed.");
  if (events.some((e) => e.kind === "skip" && e.id === card.id))
    return result("excluded", "You skipped this activity for this trip.");
  if (card.venue === "hikr" && (local.weekday === 1 || current >= 1200))
    return result(
      "excluded",
      "The published exhibition schedule is closed at this time.",
    );
  const alreadyInside = plan.origin === "stage" || plan.origin === "booth";
  if (card.venue === "hikr" && !alreadyInside && current > 1180)
    return result("excluded", "The published last admission is 19:40.");
  const row = rows.find(
    (x) =>
      (x.event.kind === "verify" || x.event.kind === "wait") &&
      x.event.id === card.id,
  );
  let knownWait: number | null = null;
  if (row && (row.event.kind === "wait" || row.event.kind === "verify")) {
    const reported = toMinutes(clockDate(new Date(row.at)).time);
    knownWait =
      row.event.kind === "wait" ? row.event.minutes : row.event.times.wait;
    if (knownWait !== null && reported + knownWait === deadline)
      return result(
        "excluded",
        "The reported wait ends at your " +
          plan.timing.time +
          " return, leaving no time for the activity.",
      );
    if (knownWait !== null && reported + knownWait > deadline)
      return result(
        "excluded",
        "The reported wait puts the earliest start at " +
          formatTime(reported + knownWait) +
          ", past your " +
          plan.timing.time +
          " return.",
      );
    if ((now.getTime() - Date.parse(row.at)) / 60000 >= observationMinutes)
      return result(
        "check",
        "Your last timing is over 10 minutes old. Confirm the current timing on site.",
      );
    if (row.event.kind === "verify") {
      const t = row.event.times;
      const arrival = current + t.outward;
      const start =
        (card.venue === "hikr" ? Math.max(arrival, 600) : arrival) + t.wait;
      const finish = start + t.visit;
      if (
        card.venue === "hikr" &&
        ((!alreadyInside && arrival > 1180) || finish > 1200)
      )
        return result(
          "excluded",
          "The timing you entered runs outside published admission or closing hours.",
        );
      if (finish + t.back > deadline)
        return result(
          "excluded",
          "Your travel, wait, activity and return estimates finish after " +
            plan.timing.time +
            ".",
        );
      if (plan.stepFree && !t.accessible)
        return result(
          "check",
          "Confirm a step-free route to this activity and back.",
        );
      return result(
        "ready",
        "Your on-site estimates fit the return time.",
        formatTime(finish + t.back),
      );
    }
  }
  const earliest =
    (card.venue === "hikr" ? Math.max(600, current) : current) +
    (knownWait ?? 0);
  // An optimistic lower bound can rule out a candidate. It can never certify a return.
  if (earliest >= deadline)
    return result(
      "excluded",
      "There is no time left for the activity before your return.",
    );
  if (card.venue === "hikr" && earliest >= 1200)
    return result(
      "excluded",
      "The earliest start is at or after the published closing time.",
    );
  if (plan.stepFree)
    return result(
      "check",
      "Check step-free access, current availability and return timing.",
    );
  if (card.id === "stream")
    return result(
      "check",
      "Check the official stream notice and allow time to return.",
    );
  return result(
    "check",
    knownWait === null
      ? "Ask about the current wait and confirm your return timing."
      : "Wait recorded. Confirm travel, activity and return time.",
  );
}
export function recover(
  req: EvaluateRequest,
  observedNow = new Date(),
): Result {
  const now = req.mode === "demo" ? new Date(demoClock) : observedNow;
  const local = clockDate(now),
    current = toMinutes(local.time),
    timing = req.plan.timing;
  if (timing.kind === "budget" && current + timing.minutes >= 1440)
    throw new PlanInputError("Choose a return time within this Seoul day.");
  const deadline =
    timing.kind === "budget"
      ? formatTime(current + timing.minutes)
      : timing.time;
  const day = timing.kind === "clock" && timing.day ? timing.day : local.day;
  const plan: ResolvedPlan = {
    ...req.plan,
    timing: { kind: "clock", day, time: deadline },
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day > local.day)
    throw new PlanInputError("Choose a return time for today in Seoul.");
  const currentRows = req.observations.filter(
    (r) =>
      Date.parse(r.at) <= now.getTime() &&
      clockDate(new Date(r.at)).day === local.day,
  );
  if (req.event) currentRows.push({ event: req.event, at: now.toISOString() });
  const observations = keepLatest(currentRows);
  const remaining =
    day === local.day ? Math.max(0, toMinutes(deadline) - current) : 0;
  const base = {
    mode: req.mode,
    plan,
    observations,
    now: now.toISOString(),
    remaining,
  };
  if (remaining === 0)
    return {
      ...base,
      pick: null,
      previousReason: null,
      reasons: ["Your return time has passed. Head back or edit your plan."],
      expired: true,
    };
  const assessments = cards.map((c) => assess(c, plan, observations, now));
  const preferred: ActivityId =
    plan.preferStage || plan.goal === "stage"
      ? "stage"
      : plan.goal === "walk"
        ? "stream"
        : "booth";
  const candidates = assessments.filter((a) => a.status !== "excluded");
  candidates.sort(
    (a, b) =>
      Number(b.status === "ready") - Number(a.status === "ready") ||
      Number(b.card.id === preferred) - Number(a.card.id === preferred) ||
      a.card.id.localeCompare(b.card.id),
  );
  const previous = assessments.find(
    (a) => a.card.id === req.previous && a.status === "excluded",
  );
  return {
    ...base,
    pick: candidates[0] ?? null,
    previousReason: previous?.reason ?? null,
    reasons: [
      ...new Set(
        assessments
          .filter(
            (a) => a.card.goals.includes(plan.goal) && a.status === "excluded",
          )
          .map((a) => a.reason),
      ),
    ],
    expired: false,
  };
}

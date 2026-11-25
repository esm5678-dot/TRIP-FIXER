import { requestSchema } from "../lib/contracts";
import type {
  EvaluateRequest,
  IntentResult,
  Mode,
  Observation,
  Plan,
  Result,
} from "../lib/contracts";

export const initialPlan: Plan = {
  goal: "photo",
  preferStage: false,
  stepFree: false,
  origin: "entrance",
  meet: "entrance",
  timing: { kind: "budget", minutes: 60 },
};
export const demoPlan: Plan = {
  ...initialPlan,
  preferStage: true,
  origin: "stage",
  timing: { kind: "clock", time: "15:30" },
};
export const sessionKey = "tripfixer-rehearsal-v1";
type Saved = { mode: Mode; plan: Plan; observations: Observation[] };
export function storedPlan(): Saved | null {
  try {
    const data = JSON.parse(sessionStorage.getItem(sessionKey) ?? "null");
    if (!data) return null;
    const parsed = requestSchema.safeParse({
      op: "evaluate",
      mode: data.mode,
      plan: data.plan,
      observations: data.observations,
    });
    if (!parsed.success || parsed.data.op !== "evaluate") return null;
    const localDay = new Date(Date.now() + 9 * 3600000)
      .toISOString()
      .slice(0, 10);
    if (
      parsed.data.mode === "today" &&
      parsed.data.plan.timing.kind === "clock" &&
      parsed.data.plan.timing.day !== localDay
    ) {
      sessionStorage.removeItem(sessionKey);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}
export function save(result: Result | null) {
  try {
    if (result)
      sessionStorage.setItem(
        sessionKey,
        JSON.stringify({
          mode: result.mode,
          plan: result.plan,
          observations: result.observations,
        }),
      );
    else sessionStorage.removeItem(sessionKey);
  } catch {
    /* A visitor can use this screen with browser storage disabled. */
  }
}
async function post<T>(data: unknown): Promise<T> {
  const response = await fetch("/api/recover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    const message = await response.json().catch(() => null);
    throw new Error(message?.error ?? "The request failed. Please try again.");
  }
  return response.json();
}
export const evaluate = (input: Omit<EvaluateRequest, "op">) =>
  post<Result>({ op: "evaluate", ...input });
export const readNote = (text: string) =>
  post<IntentResult>({ op: "interpret", text });

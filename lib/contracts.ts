import { z } from "zod";

export const goals = ["photo", "stage", "walk"] as const;
export const activityIds = ["stage", "booth", "stream"] as const;
export const locations = {
  entrance: "HiKR Ground entrance",
  stage: "HiKR Ground, floor 2",
  booth: "HiKR Ground, floor 3",
  bridge: "Gwanggyo bridge entrance",
} as const;
export const goalLabels = {
  photo: "A photo together",
  stage: "A K-pop stage video",
  walk: "A walk by the stream",
} as const;
const location = z.enum(["entrance", "stage", "booth", "bridge"]);
const activity = z.enum(activityIds);
const minutes = z.number().int().min(0).max(720);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const timing = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("clock"), time, day: day.optional() }).strict(),
  z
    .object({
      kind: z.literal("budget"),
      minutes: z.union([z.literal(30), z.literal(60), z.literal(90)]),
    })
    .strict(),
]);
export const planSchema = z
  .object({
    goal: z.enum(goals),
    preferStage: z.boolean(),
    stepFree: z.boolean(),
    origin: location,
    meet: location,
    timing,
  })
  .strict();
export const verifiedTimes = z
  .object({
    outward: minutes,
    wait: minutes,
    visit: minutes.min(1),
    back: minutes,
    open: z.literal(true),
    accessible: z.boolean(),
  })
  .strict();
export const eventSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("skip"), id: activity }).strict(),
  z.object({ kind: z.literal("closed"), id: activity }).strict(),
  z
    .object({
      kind: z.literal("venueClosed"),
      venue: z.enum(["hikr", "stream"]),
    })
    .strict(),
  z
    .object({
      kind: z.literal("wait"),
      id: activity,
      minutes: minutes.nullable(),
    })
    .strict(),
  z
    .object({ kind: z.literal("verify"), id: activity, times: verifiedTimes })
    .strict(),
]);
const observation = z
  .object({
    event: eventSchema,
    at: z.string().datetime(),
  })
  .strict();
export const requestSchema = z.discriminatedUnion("op", [
  z
    .object({
      op: z.literal("interpret"),
      text: z.string().trim().min(1).max(300),
    })
    .strict(),
  z
    .object({
      op: z.literal("evaluate"),
      mode: z.enum(["today", "demo"]),
      plan: planSchema,
      observations: z.array(observation).max(20),
      event: eventSchema.optional(),
      previous: activity.nullable().optional(),
    })
    .strict(),
]);
export const interpretationSchema = z
  .object({
    goal: z.enum(["photo", "stage", "walk", "clarify"]),
    preferStage: z.boolean(),
    stepFree: z.boolean(),
  })
  .strict();
export type Plan = z.infer<typeof planSchema>;
export type Event = z.infer<typeof eventSchema>;
export type Observation = z.infer<typeof observation>;
export type RequestData = z.infer<typeof requestSchema>;
export type EvaluateRequest = Extract<RequestData, { op: "evaluate" }>;
export type ActivityId = (typeof activityIds)[number];
export type Goal = (typeof goals)[number];
export type Mode = EvaluateRequest["mode"];
export type Place = keyof typeof locations;
export type ResolvedPlan = Omit<Plan, "timing"> & {
  timing: { kind: "clock"; time: string; day: string };
};
export type Interpretation = z.infer<typeof interpretationSchema>;
export type IntentResult =
  | { kind: "suggestion"; suggestion: Interpretation }
  | { kind: "choose"; message: string };
export type Card = {
  id: ActivityId;
  venue: string;
  place: string;
  title: string;
  description: string;
  goals: string[];
  location: string;
  access: string;
  question: string;
  korean: string;
  source: string;
  sourceLabel: string;
  hoursSource: string;
  checked: string;
};
export type Assessment = {
  card: Card;
  status: "ready" | "check" | "excluded";
  reason: string;
  returnAt: string | null;
};
export type Result = {
  mode: Mode;
  plan: ResolvedPlan;
  observations: Observation[];
  now: string;
  remaining: number;
  pick: Assessment | null;
  previousReason: string | null;
  reasons: string[];
  expired: boolean;
};

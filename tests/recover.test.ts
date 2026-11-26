import test from "node:test";
import assert from "node:assert/strict";
import { recover, PlanInputError } from "../lib/recover.ts";
import { requestSchema } from "../lib/contracts.ts";
import type { EvaluateRequest, Event, Plan } from "../lib/contracts.ts";
const demo: EvaluateRequest = {
  op: "evaluate",
  mode: "demo",
  plan: {
    goal: "photo",
    preferStage: true,
    stepFree: false,
    origin: "stage",
    meet: "entrance",
    timing: { kind: "clock", time: "15:30" },
  },
  observations: [],
};
const event = (e: Event, plan: Plan = demo.plan) =>
  recover({ ...demo, plan, event: e, previous: "stage" });
const times = {
  outward: 3,
  wait: 4,
  visit: 10,
  back: 6,
  open: true as const,
  accessible: false,
};
const live = (
  clock: string,
  plan: Plan = demo.plan,
  observations: EvaluateRequest["observations"] = [],
) =>
  recover(
    { ...demo, mode: "today", plan, observations },
    new Date(clock + "+09:00"),
  );
test("photo preference starts on stage, unknown wait stays unverified", () => {
  const r = recover(demo);
  assert.equal(r.pick?.card.id, "stage");
  assert.equal(r.pick?.status, "check");
  assert.equal(r.remaining, 40);
  assert.equal(r.pick.returnAt, null);
});
test("45-minute wait changes the photo activity only", () => {
  const r = event({ kind: "wait", id: "stage", minutes: 45 });
  assert.equal(r.pick?.card.id, "booth");
  assert.match(r.previousReason!, /15:35/);
  assert.equal(r.pick.status, "check");
});
test("strict stage goal never becomes a photo", () =>
  assert.equal(
    event(
      { kind: "wait", id: "stage", minutes: 45 },
      { ...demo.plan, goal: "stage" },
    ).pick,
    null,
  ));
test("unknown queue does not imply zero or readiness", () => {
  const r = event({ kind: "wait", id: "stage", minutes: null });
  assert.equal(r.pick?.status, "check");
  assert.equal(r.pick?.returnAt, null);
});
test("activity closure keeps the next floor available", () =>
  assert.equal(event({ kind: "closed", id: "stage" }).pick?.card.id, "booth"));
test("building-wide closure removes both floors", () =>
  assert.equal(event({ kind: "venueClosed", venue: "hikr" }).pick, null));
test("skip does not alter the goal", () => {
  const r = event({ kind: "skip", id: "stage" });
  assert.equal(r.pick?.card.id, "booth");
  assert.equal(r.plan.goal, "photo");
});
test("Gwanggyo stairs incompatible with required step-free access", () =>
  assert.equal(
    recover({ ...demo, plan: { ...demo.plan, goal: "walk", stepFree: true } })
      .pick,
    null,
  ));
test("stream access remains on-site check", () =>
  assert.equal(
    recover({ ...demo, plan: { ...demo.plan, goal: "walk" } }).pick?.status,
    "check",
  ));
test("four checked estimates produce actual time arithmetic", () => {
  const r = event({ kind: "verify", id: "stage", times });
  assert.equal(r.pick?.status, "ready");
  assert.equal(r.pick.returnAt, "15:13");
});
test("route access must also be confirmed when required", () =>
  assert.equal(
    event(
      { kind: "verify", id: "stage", times },
      { ...demo.plan, goal: "stage", stepFree: true },
    ).pick?.status,
    "check",
  ));
test("infeasible return also excludes an otherwise open activity", () =>
  assert.equal(
    event(
      { kind: "verify", id: "stage", times: { ...times, back: 45 } },
      { ...demo.plan, goal: "stage" },
    ).pick,
    null,
  ));
test("a reported wait reaching the deadline leaves no time for the activity", () =>
  assert.equal(
    event(
      { kind: "wait", id: "stage", minutes: 40 },
      { ...demo.plan, goal: "stage" },
    ).pick,
    null,
  ));
test("a wait ending at the deadline stays excluded after expiry until replaced", () => {
  const plan: Plan = { ...demo.plan, goal: "stage" };
  const initial = event({ kind: "wait", id: "stage", minutes: 40 }, plan);
  for (const clock of ["15:00:00", "15:01:00"]) {
    const refreshed = live("2026-11-27T" + clock, plan, initial.observations);
    assert.equal(refreshed.pick, null);
    assert.match(refreshed.reasons.join(" "), /15:30/);
  }
  const revised = recover(
    {
      ...demo,
      mode: "today",
      plan,
      observations: initial.observations,
      event: { kind: "wait", id: "stage", minutes: 5 },
    },
    new Date("2026-11-27T15:01:00+09:00"),
  );
  assert.equal(revised.pick?.card.id, "stage");
  assert.equal(revised.pick?.status, "check");
  assert.equal(revised.observations.length, 1);
});
test("published Monday closure follows Seoul date", () =>
  assert.equal(live("2026-11-30T14:50:00").pick, null));
test("before opening, wait for opening is part of the calculation", () => {
  const p = { ...demo.plan, timing: { kind: "clock" as const, time: "10:05" } };
  assert.equal(
    live("2026-11-27T09:25:00", p, [
      {
        at: "2026-11-27T00:25:00.000Z",
        event: { kind: "verify", id: "stage", times },
      },
    ]).pick?.card.id,
    "booth",
  );
});
test("last entry distinguishes outside from already inside", () => {
  const p: Plan = {
    ...demo.plan,
    origin: "entrance",
    timing: { kind: "clock", time: "20:15" },
  };
  assert.equal(live("2026-11-27T19:45:00", p).pick, null);
  assert.ok(live("2026-11-27T19:45:00", { ...p, origin: "stage" }).pick);
});
test("expired day and actual deadline both block suggestion", () => {
  assert.equal(live("2026-11-27T15:30:00").expired, true);
  assert.equal(
    live("2026-11-27T14:50:00", {
      ...demo.plan,
      timing: { kind: "clock", day: "2026-11-26", time: "15:30" },
    }).expired,
    true,
  );
});
test("relative budget resolves once to a fixed deadline", () => {
  const r = live("2026-11-27T14:50:00", {
    ...demo.plan,
    timing: { kind: "budget", minutes: 60 },
  });
  assert.equal(r.plan.timing.time, "15:50");
  assert.equal(live("2026-11-27T15:00:00", r.plan).remaining, 50);
});
test("budget cannot silently cross midnight", () =>
  assert.throws(
    () =>
      live("2026-11-27T23:30:00", {
        ...demo.plan,
        timing: { kind: "budget", minutes: 60 },
      }),
    PlanInputError,
  ));
test("future and prior-day reports are ignored", () => {
  const r = live(
    "2026-11-27T14:50:00",
    demo.plan,
    ["2026-11-26T04:00:00.000Z", "2026-11-27T10:00:00.000Z"].map((at) => ({
      at,
      event: { kind: "closed" as const, id: "stage" as const },
    })),
  );
  assert.equal(r.pick?.card.id, "stage");
  assert.deepEqual(r.observations, []);
});
test("stale estimates require reconfirmation", () => {
  const r = live("2026-11-27T15:01:00", demo.plan, [
    {
      at: "2026-11-27T05:50:00.000Z",
      event: { kind: "verify", id: "stage", times },
    },
  ]);
  assert.equal(r.pick?.status, "check");
});
test("new queue replaces checked times without duplicating reports", () => {
  const r = event({ kind: "verify", id: "stage", times });
  const next = recover({
    ...demo,
    observations: r.observations,
    event: { kind: "wait", id: "stage", minutes: null },
  });
  assert.equal(next.observations.length, 1);
  assert.equal(next.pick?.status, "check");
});
test("schema rejects extra user-supplied clock, bad time and unconfirmed open", () => {
  assert.equal(
    requestSchema.safeParse({ ...demo, now: "2027-01-01" }).success,
    false,
  );
  assert.equal(
    requestSchema.safeParse({
      ...demo,
      plan: { ...demo.plan, timing: { kind: "clock", time: "25:00" } },
    }).success,
    false,
  );
  assert.equal(
    requestSchema.safeParse({
      ...demo,
      event: { kind: "verify", id: "stage", times: { ...times, open: false } },
    }).success,
    false,
  );
});

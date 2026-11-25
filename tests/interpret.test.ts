import test from "node:test";
import assert from "node:assert/strict";
import { interpret } from "../lib/interpret.ts";
const goal = { goal: "photo", preferStage: true, stepFree: false };
const output = (s: unknown) => ({
  status: "completed",
  output: [
    {
      type: "message",
      content: [{ type: "output_text", text: JSON.stringify(s) }],
    },
  ],
});
const provide =
  (value: unknown): typeof fetch =>
  async () =>
    Response.json(value);
test("button fallback without any key", async () =>
  assert.equal((await interpret("photo", "")).kind, "choose"));
test("successful JSON result is only a user-confirmed suggestion", async () => {
  let payload: any;
  const result = await interpret(
    "our photo",
    "test-double",
    async (_url, init) => {
      payload = JSON.parse(String(init?.body));
      return Response.json(output(goal));
    },
  );
  assert.deepEqual(result, { kind: "suggestion", suggestion: goal });
  assert.equal(payload.store, false);
  assert.equal(payload.text.format.strict, true);
  assert.equal(payload.input, "our photo");
  assert.equal(payload.tools, undefined);
});
test("unrelated, malformed, refused, incomplete and extra-field outputs are bounded", async () => {
  for (const variant of [
    output({ ...goal, goal: "clarify" }),
    output({ ...goal, place: "invented" }),
    output("invent"),
    { status: "incomplete", output: [] },
    {
      status: "completed",
      output: [{ type: "message", content: [{ type: "refusal" }] }],
    },
  ])
    assert.equal(
      (await interpret("test", "key", provide(variant))).kind,
      "choose",
    );
});
test("network and provider failures return manual controls", async () => {
  assert.equal(
    (
      await interpret("test", "key", async () => {
        throw new Error("timeout");
      })
    ).kind,
    "choose",
  );
  assert.equal(
    (
      await interpret(
        "test",
        "key",
        async () => new Response(null, { status: 429 }),
      )
    ).kind,
    "choose",
  );
});

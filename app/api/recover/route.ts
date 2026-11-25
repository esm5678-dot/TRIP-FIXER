import { requestSchema } from "../../../lib/contracts";
import { interpret } from "../../../lib/interpret";
import { recover, PlanInputError } from "../../../lib/recover";

export const runtime = "nodejs";
const bodyLimit = 14000;
const windowMs = 60_000;
const noteLimit = 24;
let windowStart = 0,
  notes = 0;
function allowNote(now: number) {
  if (now - windowStart >= windowMs) {
    windowStart = now;
    notes = 0;
  }
  return ++notes <= noteLimit;
}
const reply = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
export async function POST(request: Request) {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    return reply({ error: "Send JSON." }, 415);
  if (Number(request.headers.get("content-length")) > bodyLimit)
    return reply({ error: "Request is too large." }, 413);
  const reader = request.body?.getReader();
  if (!reader) return reply({ error: "Request body is missing." }, 400);
  let bytes = 0,
    raw = "";
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > bodyLimit) {
        await reader.cancel();
        return reply({ error: "Request is too large." }, 413);
      }
      raw += decoder.decode(value, { stream: true });
    }
    const parsed = requestSchema.safeParse(JSON.parse(raw + decoder.decode()));
    if (!parsed.success)
      return reply(
        { error: "Check the selected goal, place and timing." },
        400,
      );
    if (parsed.data.op === "interpret") {
      if (process.env.OPENAI_API_KEY && !allowNote(Date.now()))
        return reply({
          kind: "choose",
          message: "The note reader is busy. Choose your goal below.",
        });
      return reply(await interpret(parsed.data.text));
    }
    return reply(recover(parsed.data));
  } catch (error) {
    if (error instanceof SyntaxError)
      return reply({ error: "The JSON could not be read." }, 400);
    if (error instanceof PlanInputError)
      return reply({ error: error.message }, 400);
    return reply(
      { error: "We could not evaluate this plan. Please try again." },
      500,
    );
  } finally {
    reader.releaseLock();
  }
}

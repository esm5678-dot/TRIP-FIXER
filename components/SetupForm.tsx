"use client";
import { useRef, useState } from "react";
import {
  ArrowRight,
  Camera,
  Check,
  ChevronDown,
  Clapperboard,
  Footprints,
  MessageSquare,
  Play,
  Sparkles,
} from "lucide-react";
import { goalLabels, goals, locations } from "../lib/contracts";
import type { Goal, Interpretation, Mode, Place, Plan } from "../lib/contracts";
import { useText } from "./language";
import { useCompactLayout } from "./useCompactLayout";
import { readNote } from "./session";
const icons = { photo: Camera, stage: Clapperboard, walk: Footprints };
const hints = {
  photo: "Keep a memory with friends",
  stage: "Film a performance on set",
  walk: "Get outside by the water",
};

export function SetupForm({
  initial,
  mode,
  busy,
  onStart,
  onDemo,
  onCancel,
}: {
  initial: Plan;
  mode: Mode;
  busy: boolean;
  onStart: (p: Plan) => void;
  onDemo: () => void;
  onCancel?(): void;
}) {
  const t = useText();
  const compact = useCompactLayout();
  const [step, setStep] = useState<1 | 2>(1);
  const heading = useRef<HTMLHeadingElement>(null);
  function moveTo(next: 1 | 2) {
    setStep(next);
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    });
  }
  const [plan, setPlan] = useState<Plan>(initial);
  const [note, setNote] = useState(""),
    [reading, setReading] = useState(false),
    [message, setMessage] = useState("");
  const [suggestion, setSuggestion] = useState<Interpretation | null>(null);
  const update = (patch: Partial<Plan>) => setPlan((p) => ({ ...p, ...patch }));
  function changeGoal(goal: Goal) {
    update({ goal, preferStage: goal === "photo" && plan.preferStage });
  }
  async function analyze() {
    setReading(true);
    setSuggestion(null);
    setMessage("");
    try {
      const data = await readNote(note);
      if (data.kind === "suggestion") setSuggestion(data.suggestion);
      else setMessage(data.message);
    } catch {
      setMessage("Could not reach the note reader. Choose your goal below.");
    } finally {
      setReading(false);
    }
  }
  function accept(s: Interpretation) {
    if (s.goal !== "clarify")
      update({
        goal: s.goal,
        preferStage: s.goal === "photo" && s.preferStage,
        stepFree: s.stepFree,
      });
    setSuggestion(null);
    setMessage("Applied. You can still change your choices below.");
  }
  return (
    <section className="panel setup" aria-labelledby="setup-title">
      <div className="panel-heading">
        {compact && (
          <div className="step-meter" aria-hidden="true" data-step={step}>
            <i />
            <i />
          </div>
        )}
        <div>
          <p className="eyebrow">
            <span className="dot" />{" "}
            {compact
              ? t("Step {0} of 2", step)
              : mode === "demo"
                ? t("Demo plan")
                : t("Your plan")}
          </p>
          <h2 id="setup-title" ref={heading} tabIndex={-1}>
            {compact && step === 2
              ? t("Plan your return")
              : t("What do you want to keep?")}
          </h2>
        </div>
      </div>
      <form
        noValidate={compact && step === 1}
        onSubmit={(e) => {
          e.preventDefault();
          if (compact && step === 1) moveTo(2);
          else onStart(plan);
        }}
      >
        <div hidden={compact && step === 2}>
          <fieldset className="goal-list">
            <legend className="sr">{t("Experience to keep")}</legend>
            {goals.map((g) => {
              const Icon = icons[g];
              return (
                <label
                  key={g}
                  className={"goal " + (plan.goal === g ? "chosen" : "")}
                >
                  <input
                    type="radio"
                    name="goal"
                    checked={plan.goal === g}
                    onChange={() => changeGoal(g)}
                  />
                  <Icon size={23} aria-hidden="true" />
                  <span>
                    <strong>{t(goalLabels[g])}</strong>
                    <small>{t(hints[g])}</small>
                  </span>
                  <span className="radio-mark">
                    {plan.goal === g && <Check size={13} />}
                  </span>
                </label>
              );
            })}
          </fieldset>
          {plan.goal === "photo" && (
            <label className="check">
              <input
                type="checkbox"
                checked={plan.preferStage}
                onChange={(e) => update({ preferStage: e.target.checked })}
              />{" "}
              {t("I'd prefer a K-pop setting if it fits.")}
            </label>
          )}
          <details className="note">
            <summary>
              <MessageSquare size={16} /> {t("Describe it in your own words")}{" "}
              <ChevronDown size={15} />
            </summary>
            <label className="input-label" htmlFor="note">
              {t("Your travel note · optional")}
            </label>
            <textarea
              id="note"
              maxLength={300}
              rows={2}
              value={note}
              disabled={reading}
              placeholder={t(
                "We want a photo together, ideally on a K-pop set.",
              )}
              onChange={(e) => {
                setNote(e.target.value);
                setSuggestion(null);
                setMessage("");
              }}
            />
            <p className="fine">
              {t(
                "Only send your travel preference. An enabled note reader sends this text to OpenAI.",
              )}
            </p>
            <button
              type="button"
              className="text-button"
              disabled={reading || !note.trim()}
              onClick={analyze}
            >
              <Sparkles size={15} />
              {reading ? t("Reading…") : t("Read my note")}
            </button>
            {message && (
              <p role="status" className="notice">
                {t(message)}
              </p>
            )}
            {suggestion && suggestion.goal !== "clarify" && (
              <div className="notice" role="status">
                <strong>
                  {t("Suggested goal · {0}", t(goalLabels[suggestion.goal]))}
                </strong>
                <p>
                  {suggestion.preferStage
                    ? t("K-pop setting preferred.") + " "
                    : ""}
                  {suggestion.stepFree ? t("Step-free access requested.") : ""}
                </p>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => accept(suggestion)}
                >
                  {t("Use this suggestion")} <ArrowRight size={15} />
                </button>
              </div>
            )}
          </details>
        </div>
        <div hidden={compact && step === 1}>
          <div className="field-grid">
            {(["origin", "meet"] as const).map((field) => (
              <label key={field} className="input-label">
                {field === "origin"
                  ? t("Starting from")
                  : t("I need to return to")}
                <select
                  value={plan[field]}
                  onChange={(e) => update({ [field]: e.target.value as Place })}
                >
                  {Object.entries(locations).map(([id, title]) => (
                    <option key={id} value={id}>
                      {t(title)}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <fieldset className="timing">
            <legend>{t("When do you need to be back?")}</legend>
            <div className="segments">
              {([30, 60, 90] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={
                    plan.timing.kind === "budget" && plan.timing.minutes === n
                  }
                  onClick={() =>
                    update({ timing: { kind: "budget", minutes: n } })
                  }
                >
                  {t("{0} min", n)}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={plan.timing.kind === "clock"}
                onClick={() =>
                  update({
                    timing: {
                      kind: "clock",
                      time:
                        plan.timing.kind === "clock"
                          ? plan.timing.time
                          : "15:30",
                    },
                  })
                }
              >
                {t("Set a time")}
              </button>
            </div>
            {plan.timing.kind === "clock" && (
              <label className="input-label clock">
                {t("Return time in Seoul")}{" "}
                <input
                  required
                  type="time"
                  value={plan.timing.time}
                  onChange={(e) =>
                    update({ timing: { kind: "clock", time: e.target.value } })
                  }
                />
              </label>
            )}
          </fieldset>
          <label className="check access">
            <input
              type="checkbox"
              checked={plan.stepFree}
              onChange={(e) => update({ stepFree: e.target.checked })}
            />{" "}
            {t("I need a step-free route.")}
          </label>
        </div>
        <div className="step-actions">
          {compact && step === 2 && (
            <button
              type="button"
              className="step-back"
              onClick={() => moveTo(1)}
              disabled={busy}
            >
              {t("Back")}
            </button>
          )}
          <button type="submit" className="primary" disabled={busy || reading}>
            {compact && step === 1
              ? t("Choose return details")
              : busy
                ? t("Checking your plan…")
                : t("Find my next move")}
            <ArrowRight size={20} />
          </button>
        </div>
      </form>
      {onCancel ? (
        <button className="demo-link" onClick={onCancel} disabled={busy}>
          {t("Back to my current plan")}
        </button>
      ) : (
        <button className="demo-link" disabled={busy} onClick={onDemo}>
          <Play size={15} /> {t("Try the 14:50 demo")}
        </button>
      )}
    </section>
  );
}

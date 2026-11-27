"use client";
import { useContext, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  DoorClosed,
  Flag,
  Forward,
  Languages,
  MapPin,
  Pencil,
  Undo2,
} from "lucide-react";
import { LanguageContext, useText, translateReason } from "./language";
import { goalLabels, locations } from "../lib/contracts";
import type { Event, Result } from "../lib/contracts";

type Props = {
  value: Result;
  busy: boolean;
  canUndo: boolean;
  onEvent: (event: Event) => void;
  onUndo: () => void;
  onEdit: () => void;
  onEnd: () => void;
};
function TimingForm({
  value,
  busy,
  onEvent,
}: {
  value: Result;
  busy: boolean;
  onEvent: Props["onEvent"];
}) {
  const t = useText();
  const pick = value.pick;
  if (!pick) return null;
  const labels = {
    outward: "Get there",
    wait: "Wait",
    visit: "Do the activity",
    back: "Return to meeting point",
  } as const;
  return (
    <details className="note verification">
      <summary>
        <Clock3 size={16} /> {t("I checked the timing")}
      </summary>
      <p className="fine">
        {t("Enter today's estimates in minutes. Include all four parts.")}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          onEvent({
            kind: "verify",
            id: pick.card.id,
            times: {
              outward: Number(data.get("outward")),
              wait: Number(data.get("wait")),
              visit: Number(data.get("visit")),
              back: Number(data.get("back")),
              open: true,
              accessible: data.has("accessible"),
            },
          });
        }}
      >
        <div className="field-grid">
          {(Object.keys(labels) as (keyof typeof labels)[]).map((k) => (
            <label key={k} className="input-label">
              {t(labels[k])}
              <input
                name={k}
                type="number"
                inputMode="numeric"
                required
                min={k === "visit" ? 1 : 0}
                max={720}
                step={1}
              />
            </label>
          ))}
        </div>
        <label className="check">
          <input required type="checkbox" />{" "}
          {t("I checked that this activity is available.")}
        </label>
        {value.plan.stepFree && (
          <label className="check">
            <input name="accessible" type="checkbox" />{" "}
            {t("The complete route is step-free.")}
          </label>
        )}
        <button className="secondary" disabled={busy} type="submit">
          {t("Check my return time")} <ArrowRight size={16} />
        </button>
      </form>
    </details>
  );
}

export function ResultCard({
  value,
  busy,
  canUndo,
  onEvent,
  onUndo,
  onEdit,
  onEnd,
}: Props) {
  const language = useContext(LanguageContext);
  const t = useText();
  const [action, setAction] = useState<"staff" | "wait" | "closed" | null>(
    null,
  );
  const { plan, pick } = value;
  const labels = {
    stage: "2F K-pop stage",
    booth: "3F photo spot",
    stream: "Gwanggyo stream entrance",
  } as const;
  const localTime = (at: string) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(at));
  const reports = value.observations.filter(
    (row) => row.event.kind === "wait" || row.event.kind === "verify",
  );
  const toggle = (a: typeof action) => setAction((s) => (s === a ? null : a));
  const send = (ev: Event) => {
    setAction(null);
    onEvent(ev);
  };
  const meetingQuery =
    plan.meet === "bridge" ? "광교 청계천 서울" : "하이커 그라운드 서울";
  return (
    <section className="panel result" aria-labelledby="result-title">
      <div className="result-head">
        <p className="eyebrow">
          <span className="dot" />
          {value.mode === "demo"
            ? t("Demo · 14:50 Seoul")
            : t("Your next move")}
        </p>
        <button className="icon-text" onClick={onEdit} disabled={busy}>
          <Pencil size={14} />
          {t("Edit plan")}
        </button>
      </div>
      <div className="receipt">
        <span>
          <Flag size={15} />
          {t(goalLabels[plan.goal])}
        </span>
        <span>
          <Clock3 size={15} />
          {t("{0} min left", value.remaining)}
        </span>
      </div>
      <p className="meeting">
        {t(
          "Back at {0} by {1}, Seoul time.",
          t(locations[plan.meet]),
          plan.timing.time,
        )}
      </p>
      {value.previousReason && (
        <div className="change-note" role="status">
          <strong>{t("Why your plan changed")}</strong>
          <p>{translateReason(value.previousReason, t)}</p>
        </div>
      )}
      {pick ? (
        <article className="recommendation">
          <div className="status-line">
            <span
              className={"status " + (pick.status === "ready" ? "ready" : "")}
            >
              {pick.status === "ready" ? (
                <Check size={13} />
              ) : (
                <Clock3 size={13} />
              )}{" "}
              {pick.status === "ready"
                ? t("Fits your estimates")
                : t("Check on site")}
            </span>
          </div>
          <h2 id="result-title" tabIndex={-1}>
            {t(pick.card.title)}
          </h2>
          <p className="place">
            <MapPin size={16} />
            {t(pick.card.place)}
          </p>
          <p className="description">{t(pick.card.description)}</p>
          <div className="time-note">
            <strong>
              {pick.returnAt
                ? t("Estimated return · {0}", pick.returnAt)
                : t("Timing to confirm")}
            </strong>
            <p>{translateReason(pick.reason, t)}</p>
          </div>
          <button
            className="primary"
            disabled={busy}
            aria-expanded={action === "staff"}
            onClick={() => toggle("staff")}
          >
            <Languages size={19} />
            {t("Ask staff")}
            <ArrowRight className="push" size={19} />
          </button>
          {action === "staff" && (
            <div className="staff">
              <span className="eyebrow">{t("Show this to staff")}</span>
              <p lang="ko">{pick.card.korean}</p>
              {language !== "ko" && <small>{t(pick.card.question)}</small>}
            </div>
          )}
          <div className="actions">
            <button
              disabled={busy}
              aria-expanded={action === "wait"}
              onClick={() => toggle("wait")}
            >
              <Clock3 size={16} /> {t("Long wait")}
            </button>
            <button
              disabled={busy}
              onClick={() => send({ kind: "skip", id: pick.card.id })}
            >
              <Forward size={16} /> {t("Skip this activity")}
            </button>
            <button
              disabled={busy}
              aria-expanded={action === "closed"}
              onClick={() => toggle("closed")}
            >
              <DoorClosed size={16} /> {t("Closed")}
            </button>
          </div>
          {action === "wait" && (
            <fieldset className="choice-box">
              <legend>{t("What wait were you told?")}</legend>
              <div className="segments">
                {[15, 30, 45].map((n) => (
                  <button
                    key={n}
                    disabled={busy}
                    onClick={() =>
                      send({ kind: "wait", id: pick.card.id, minutes: n })
                    }
                  >
                    {t("{0} min", n)}
                  </button>
                ))}
                <button
                  disabled={busy}
                  onClick={() =>
                    send({ kind: "wait", id: pick.card.id, minutes: null })
                  }
                >
                  {t("Not sure")}
                </button>
              </div>
            </fieldset>
          )}
          {action === "closed" && (
            <div className="choice-box">
              <strong>{t("What is closed?")}</strong>
              <div className="segments">
                <button
                  disabled={busy}
                  onClick={() => send({ kind: "closed", id: pick.card.id })}
                >
                  {t("Just this activity")}
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    send({
                      kind: "venueClosed",
                      venue: pick.card.venue === "hikr" ? "hikr" : "stream",
                    })
                  }
                >
                  {pick.card.venue === "hikr"
                    ? t("All of HiKR Ground")
                    : t("The stream area")}
                </button>
              </div>
            </div>
          )}
          <TimingForm value={value} busy={busy} onEvent={send} />
          <div className="sources">
            <a href={pick.card.source} rel="noreferrer" target="_blank">
              {t(pick.card.sourceLabel)} <ArrowUpRight size={13} />
            </a>
            <a href={pick.card.hoursSource} rel="noreferrer" target="_blank">
              {pick.card.venue === "stream"
                ? t("Access notices")
                : t("Published hours")}{" "}
              <ArrowUpRight size={13} />
            </a>
          </div>
        </article>
      ) : (
        <article className="empty">
          <Flag size={32} />
          <h2 id="result-title" tabIndex={-1}>
            {value.expired
              ? t("Time to head back")
              : t("No match for this goal")}
          </h2>
          <p>
            {value.expired
              ? t("Your planned return time has arrived.")
              : t(
                  "The reviewed activities cannot meet the goal and constraints you selected.",
                )}
          </p>
          {value.reasons
            .filter((x) => x !== value.previousReason)
            .map((r) => (
              <p className="fine" key={r}>
                {translateReason(r, t)}
              </p>
            ))}
          <a
            className="primary"
            href={
              "https://www.google.com/maps/search/?api=1&query=" +
              encodeURIComponent(meetingQuery)
            }
            target="_blank"
            rel="noreferrer"
          >
            {t("Find the meeting place")} <ArrowUpRight size={18} />
          </a>
          <p className="fine">
            {t(
              "Meet at {0}. The map opens the location search.",
              t(locations[plan.meet]),
            )}
          </p>
        </article>
      )}
      {reports.length > 0 && (
        <details className="note observations">
          <summary>
            <Clock3 size={16} /> {t("My timing reports")}
          </summary>
          {reports.map((row) => {
            const ev = row.event;
            if (ev.kind !== "wait" && ev.kind !== "verify") return null;
            const total = ev.kind === "verify" ? ev.times : null;
            return (
              <section key={ev.id} className="report">
                <strong>
                  {t("{0} · {1} Seoul", t(labels[ev.id]), localTime(row.at))}
                </strong>
                <p className="fine">
                  {total
                    ? t(
                        "Go {0} + wait {1} + activity {2} + return {3} min.",
                        total.outward,
                        total.wait,
                        total.visit,
                        total.back,
                      )
                    : ev.kind === "wait" && ev.minutes !== null
                      ? t("Reported wait: {0} min.", ev.minutes)
                      : t("Wait unknown.")}
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    send({
                      kind: "wait",
                      id: ev.id,
                      minutes: Number(form.get("revised")),
                    });
                  }}
                >
                  <label className="input-label">
                    {t("New wait in minutes")}{" "}
                    <input
                      name="revised"
                      aria-label={t("New wait for {0}", t(labels[ev.id]))}
                      type="number"
                      min="0"
                      max="720"
                      step="1"
                      required
                    />
                  </label>
                  <button className="text-button" type="submit" disabled={busy}>
                    {t("Update wait")} <ArrowRight size={15} />
                  </button>
                </form>
              </section>
            );
          })}
        </details>
      )}
      <div className="result-footer">
        <button
          className="icon-text"
          disabled={!canUndo || busy}
          onClick={onUndo}
        >
          <Undo2 size={16} />
          {t("Undo last change")}
        </button>
        <button className="icon-text" disabled={busy} onClick={onEnd}>
          {t("End trip")}
        </button>
      </div>
    </section>
  );
}

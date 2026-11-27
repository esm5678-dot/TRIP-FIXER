"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Compass, MapPin } from "lucide-react";
import type { EvaluateRequest, Event, Plan, Result } from "../lib/contracts";
import { LanguageContext, defaultLanguage, languages, useText, type Language } from "./language";
import { SetupForm } from "./SetupForm";
import { ResultCard } from "./ResultCard";
import { demoPlan, evaluate, initialPlan, save, storedPlan } from "./session";

type Query = Omit<EvaluateRequest, "op">;
const asQuery = (r: Result): Query => ({
  mode: r.mode,
  plan: r.plan,
  observations: r.observations,
});
export function RecoveryApp() {
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  function changeLanguage(next: Language) {
    setLanguage(next);
    document.documentElement.lang = next;
    try {
      localStorage.setItem("tripfixer-language", next);
    } catch {}
  }
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tripfixer-language");
      if (saved && Object.hasOwn(languages, saved)) {
        setLanguage(saved as Language);
        document.documentElement.lang = saved;
      }
    } catch {}
  }, []);
  return (
    <LanguageContext.Provider value={language}>
      <TripScreen language={language} changeLanguage={changeLanguage} />
    </LanguageContext.Provider>
  );
}
function TripScreen({
  language,
  changeLanguage,
}: {
  language: Language;
  changeLanguage: (next: Language) => void;
}) {
  const t = useText();
  const title = "Trip Fixer · " + t("Seoul field guide");
  useEffect(() => {
    document.title = title;
  }, [title]);
  const [result, setResult] = useState<Result | null>(null),
    [editing, setEditing] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [undo, setUndo] = useState<Query | null>(null),
    [revision, setRevision] = useState(0);
  const seq = useRef(0),
    retry = useRef<(() => void) | null>(null),
    latest = useRef<Result | null>(null),
    inFlight = useRef(false);
  const apply = useCallback(
    async (q: Query, done?: () => void, quiet = false) => {
      const id = ++seq.current;
      inFlight.current = true;
      if (!quiet) {
        setBusy(true);
        setError("");
      }
      try {
        const next = await evaluate(q);
        if (id !== seq.current) return;
        latest.current = next;
        setResult(next);
        save(next);
        setError("");
        retry.current = null;
        if (!quiet) {
          setEditing(false);
          setRevision((n) => n + 1);
        }
        done?.();
      } catch (e) {
        if (id !== seq.current) return;
        retry.current = () => void apply(q, done, quiet);
        setError(
          e instanceof Error && e.name !== "TypeError"
            ? e.message
            : "Connection lost. Your last plan is still here.",
        );
      } finally {
        if (id === seq.current) {
          setBusy(false);
          inFlight.current = false;
        }
      }
    },
    [],
  );
  function end() {
    ++seq.current;
    latest.current = null;
    inFlight.current = false;
    retry.current = null;
    save(null);
    setResult(null);
    setEditing(false);
    setBusy(false);
    setError("");
    setUndo(null);
    setRevision((n) => n + 1);
  }
  useEffect(() => {
    const saved = storedPlan();
    if (saved) void apply(saved);
    return () => {
      ++seq.current;
    };
  }, [apply]);
  useEffect(() => {
    function refresh() {
      const r = latest.current;
      if (
        !r ||
        r.mode === "demo" ||
        document.visibilityState !== "visible" ||
        inFlight.current ||
        editing
      )
        return;
      const today = new Date(Date.now() + 9 * 3600000)
        .toISOString()
        .slice(0, 10);
      if (r.plan.timing.day !== today) {
        end();
        return;
      }
      void apply(asQuery(r), undefined, true);
    }
    const timer = window.setInterval(refresh, 60000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [apply, editing]);
  function start(p: Plan, demo = false) {
    const current = result && editing ? result : null;
    const changedRoute =
      current &&
      (p.origin !== current.plan.origin || p.meet !== current.plan.meet);
    const observations =
      current?.observations.filter(
        (o) => !(changedRoute && o.event.kind === "verify"),
      ) ?? [];
    void apply(
      {
        mode: demo ? "demo" : (current?.mode ?? "today"),
        plan: p,
        observations,
      },
      () => setUndo(null),
    );
  }
  function report(event: Event) {
    if (!result) return;
    const before = asQuery(result);
    void apply({ ...before, event, previous: result.pick?.card.id }, () =>
      setUndo(before),
    );
  }
  const showResult = !!result && !editing;
  return (
    <div className="shell">
      <header className="mast">
        <div className="brand">
          <span className="brand-icon">
            <Compass size={24} strokeWidth={1.8} />
          </span>
          tripfixer<span className="brand-period">.</span>
        </div>
        <div className="mast-tools">
          <label className="language">
            <span>{t("Language")}</span>
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value as Language)}
            >
              {Object.entries(languages).map(([id, name]) => (
                <option lang={id} key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <span className="mast-location">
            <MapPin size={15} /> {t("Seoul, South Korea")}
          </span>
        </div>
      </header>
      <main className="main-grid">
        <aside className="intro" aria-label={t("About Trip Fixer")}>
          <p className="eyebrow area">
            <span className="line" /> {t("Seoul field guide")}
          </p>
          <h1>
            {language === "en" ? (
              <>
                Keep the <em>best part</em> <br />
                of your day.
              </>
            ) : (
              t("Keep the best part of your day.")
            )}
          </h1>
          <p className="lead">
            {t(
              "A queue or a closed door can change your plans. Find another way to do what you came for, and make it back on time.",
            )}
          </p>
          <figure className="postcard">
            <img
              src="/cheonggyecheon.jpg"
              width="453"
              height="316"
              alt={t(
                "Water spilling over a low cascade at Cheonggyecheon in Seoul",
              )}
            />
            <figcaption>
              <div>
                <span className="eyebrow">{t("Covered area")}</span>
                <strong>{t("HiKR Ground & Cheonggyecheon")}</strong>
              </div>
              <MapPin size={20} />
            </figcaption>
          </figure>
        </aside>
        <div className="workspace" aria-busy={busy}>
          {error && (
            <div role="alert" className="error">
              {t(error)}{" "}
              <button onClick={() => retry.current?.()}>
                {t("Try again")}
              </button>
            </div>
          )}
          {showResult && result ? (
            <ResultCard
              key={revision}
              value={result}
              busy={busy}
              canUndo={!!undo}
              onEvent={report}
              onUndo={() => {
                if (undo) void apply(undo, () => setUndo(null));
              }}
              onEdit={() => {
                setEditing(true);
                setError("");
              }}
              onEnd={end}
            />
          ) : (
            <SetupForm
              key={editing ? "edit" : "start"}
              initial={editing && result ? result.plan : initialPlan}
              mode={editing && result ? result.mode : "today"}
              busy={busy}
              onStart={(p) => start(p)}
              onDemo={() => start(demoPlan, true)}
              onCancel={editing ? () => setEditing(false) : undefined}
            />
          )}
        </div>
      </main>
      <footer className="page-footer">
        <span>{t("Trip Fixer · Seoul rehearsal edition")}</span>
        <a
          href="https://commons.wikimedia.org/wiki/File:Cheonggyecheonview.jpg"
          target="_blank"
          rel="noreferrer"
        >
          {t("Photograph by Salalucio")} <ArrowUpRight size={12} />
        </a>
      </footer>
    </div>
  );
}

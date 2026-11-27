"use client";
import { createContext, useContext } from "react";
import messages from "../data/translations.json";

export const languages = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  "zh-Hans": "简体中文",
  fr: "Français",
} as const;
export type Language = keyof typeof languages;
export const defaultLanguage: Language = "ko";
export const LanguageContext = createContext<Language>(defaultLanguage);
export function useText() {
  const language = useContext(LanguageContext);
  return (key: string, ...values: (string | number)[]) => {
    const entry = Object.hasOwn(messages, key)
      ? messages[key as keyof typeof messages]
      : undefined;
    const pattern = language === "en" ? key : (entry?.[language] ?? key);
    return pattern.replace(/\{(\d+)\}/g, (_, i) =>
      String(values[Number(i)] ?? ""),
    );
  };
}

// These three API reasons include a clock time. Keep the API contract stable for older clients.
const timedReasons: [RegExp, string][] = [
  [
    /^The reported wait ends at your (\d\d:\d\d) return, leaving no time for the activity\.$/,
    "The reported wait ends at your {0} return, leaving no time for the activity.",
  ],
  [
    /^The reported wait puts the earliest start at (\d\d:\d\d), past your (\d\d:\d\d) return\.$/,
    "The reported wait puts the earliest start at {0}, past your {1} return.",
  ],
  [
    /^Your travel, wait, activity and return estimates finish after (\d\d:\d\d)\.$/,
    "Your travel, wait, activity and return estimates finish after {0}.",
  ],
];
export function translateReason(text: string, t: ReturnType<typeof useText>) {
  for (const [regex, template] of timedReasons) {
    const match = regex.exec(text);
    if (match) return t(template, ...match.slice(1));
  }
  return t(text);
}

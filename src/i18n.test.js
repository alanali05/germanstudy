import { describe, expect, it } from "vitest";
import { dict } from "./i18n";

const LANGS = ["de", "ku", "en"];
const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join();

describe("i18n dictionary", () => {
  it("has a German, Kurdish and English text for every key", () => {
    const missing = Object.entries(dict).flatMap(([key, e]) => LANGS.filter((l) => !e[l]?.trim()).map((l) => `${key}.${l}`));
    expect(missing).toEqual([]);
  });

  it("uses the same {placeholders} in every language", () => {
    const differ = Object.entries(dict).filter(([, e]) => new Set(LANGS.map((l) => placeholders(e[l] || ""))).size > 1).map(([k]) => k);
    expect(differ).toEqual([]);
  });
});

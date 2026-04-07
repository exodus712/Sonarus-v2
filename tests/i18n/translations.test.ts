/** @jest-environment node */

import fs from "fs";
import path from "path";

type TranslationData = Record<string, unknown>;

const localesDir = path.join(process.cwd(), "src", "i18n", "locales");
const referenceLanguage = "en";
const requiredTranslationKeys = [
  ["settings", "history", "searchPlaceholder"],
  ["settings", "history", "noSearchResults"],
  ["settings", "advanced", "transcribingVisualizer", "title"],
  ["settings", "advanced", "transcribingVisualizer", "description"],
  ["settings", "advanced", "transcribingVisualizer", "options", "dots"],
  ["settings", "advanced", "transcribingVisualizer", "options", "equalizer"],
  ["settings", "advanced", "transcribingVisualizer", "options", "gradient"],
];

function getAllKeyPaths(
  obj: TranslationData,
  prefix: string[] = [],
): string[][] {
  let paths: string[][] = [];

  for (const key in obj) {
    if (!Object.hasOwn(obj, key)) continue;

    const currentPath = prefix.concat(key);
    const value = obj[key];

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      paths = paths.concat(
        getAllKeyPaths(value as TranslationData, currentPath),
      );
    } else {
      paths.push(currentPath);
    }
  }

  return paths;
}

function hasKeyPath(obj: TranslationData, keyPath: string[]): boolean {
  let current: unknown = obj;

  for (const key of keyPath) {
    if (
      typeof current !== "object" ||
      current === null ||
      (current as Record<string, unknown>)[key] === undefined
    ) {
      return false;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return true;
}

function loadTranslation(lang: string): TranslationData {
  const filePath = path.join(localesDir, lang, "translation.json");
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as TranslationData;
}

describe("translation locales", () => {
  it("includes the required translation keys in English and every locale", () => {
    const languages = fs
      .readdirSync(localesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    const missingByLanguage = languages
      .map((lang) => {
        const langData = loadTranslation(lang);
        const missing = requiredTranslationKeys
          .filter((keyPath) => !hasKeyPath(langData, keyPath))
          .map((keyPath) => keyPath.join("."));

        return { lang, missing };
      })
      .filter((result) => result.missing.length > 0);

    expect(missingByLanguage).toEqual([]);
  });

  it("keeps every non-English locale in sync with the English keys", () => {
    const referenceData = loadTranslation(referenceLanguage);
    const referenceKeyPaths = getAllKeyPaths(referenceData);
    const referenceKeys = new Set(
      referenceKeyPaths.map((keyPath) => keyPath.join(".")),
    );
    const languages = fs
      .readdirSync(localesDir, { withFileTypes: true })
      .filter(
        (entry) => entry.isDirectory() && entry.name !== referenceLanguage,
      )
      .map((entry) => entry.name)
      .sort();

    const driftByLanguage = languages
      .map((lang) => {
        const langData = loadTranslation(lang);
        const langKeyPaths = getAllKeyPaths(langData);
        const missing = referenceKeyPaths
          .filter((keyPath) => !hasKeyPath(langData, keyPath))
          .map((keyPath) => keyPath.join("."));
        const orphaned = langKeyPaths
          .map((keyPath) => keyPath.join("."))
          .filter((keyPath) => !referenceKeys.has(keyPath));

        return { lang, missing, orphaned };
      })
      .filter(
        (result) => result.missing.length > 0 || result.orphaned.length > 0,
      );

    expect(driftByLanguage).toEqual([]);
  });
});

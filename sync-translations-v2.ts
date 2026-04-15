import fs from "fs";
import path from "path";

const localesDir = "src/i18n/locales";
const referenceLang = "en";
const referencePath = path.join(localesDir, referenceLang, "translation.json");
const reference = JSON.parse(fs.readFileSync(referencePath, "utf8"));

function deepMerge(target, source) {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(target).forEach((key) => {
      if (isObject(target[key]) && isObject(source[key])) {
        output[key] = deepMerge(target[key], source[key]);
      } else if (key in source) {
        output[key] = source[key];
      }
    });
  }
  return output;
}

function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

const languages = fs
  .readdirSync(localesDir)
  .filter((f) => fs.statSync(path.join(localesDir, f)).isDirectory());

for (const lang of languages) {
  if (lang === referenceLang) continue;
  const langPath = path.join(localesDir, lang, "translation.json");
  if (!fs.existsSync(langPath)) continue;

  console.log(`Syncing ${lang}...`);
  const current = JSON.parse(fs.readFileSync(langPath, "utf8"));
  const merged = deepMerge(reference, current);
  fs.writeFileSync(langPath, JSON.stringify(merged, null, 2) + "\n");
}

import fs from "fs";
import path from "path";
import { config } from "dotenv";
import { GT } from "generaltranslation";

// Load environment variables from .env file
config();

// Configuration
const localesDir = "src/i18n/locales";
const referenceLang = "en";
const referencePath = path.join(localesDir, referenceLang, "translation.json");

// Get General Translation credentials from environment
const apiKey = process.env.GT_DEV_API_KEY;
const projectId = process.env.GT_PROJECT_ID;

if (!apiKey || !projectId) {
  console.error(
    "GT_API_KEY and GT_PROJECT_ID environment variables are required",
  );
  console.error("\nTo get these:");
  console.error("1. Sign up at https://generaltranslation.com/signup");
  console.error("2. Create a project in the dashboard");
  console.error("3. Go to API Keys in project settings");
  console.error("4. Generate an API key and copy your Project ID");
  console.error("\nThen run:");
  console.error(
    "  GT_DEV_API_KEY=your-key GT_PROJECT_ID=your-id bun run translate-missing-keys-gt.ts",
  );
  process.exit(1);
}

const gt = new GT({ apiKey, projectId });

// Read reference translation
const reference = JSON.parse(fs.readFileSync(referencePath, "utf8"));

// Get all language directories
const languages = fs
  .readdirSync(localesDir)
  .filter((f) => fs.statSync(path.join(localesDir, f)).isDirectory())
  .filter((lang) => lang !== referenceLang);

/**
 * Recursively find all leaf values in an object
 */
function getLeafValues(obj: any, prefix = ""): Map<string, string> {
  const leaves = new Map<string, string>();

  function traverse(current: any, path: string) {
    if (typeof current === "string") {
      leaves.set(path, current);
    } else if (typeof current === "object" && current !== null) {
      for (const [key, value] of Object.entries(current)) {
        traverse(value, path ? `${path}.${key}` : key);
      }
    }
  }

  traverse(obj, prefix);
  return leaves;
}

/**
 * Recursively set a value in an object by dot path
 */
function setByPath(obj: any, path: string, value: string) {
  const keys = path.split(".");
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current)) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * Translate text using General Translation
 */
async function translateText(
  text: string,
  targetLang: string,
): Promise<string> {
  try {
    const result = await gt.translate(text, targetLang);
    // Extract the translation string from the result
    if (typeof result === "string") {
      return result;
    }
    if (result && typeof result === "object" && "translation" in result) {
      return String(result.translation);
    }
    return text;
  } catch (error) {
    console.error(`Translation error for ${targetLang}:`, error);
    return text; // Return original on error
  }
}

/**
 * Main translation function
 */
async function translateMissingKeys() {
  const referenceLeaves = getLeafValues(reference);

  for (const lang of languages) {
    console.log(`\nProcessing ${lang}...`);

    const langPath = path.join(localesDir, lang, "translation.json");
    const current = JSON.parse(fs.readFileSync(langPath, "utf8"));
    const currentLeaves = getLeafValues(current);

    let translatedCount = 0;
    const batchSize = 5; // Process 5 translations at a time

    // Find keys that are missing or still in English
    const keysToTranslate: string[] = [];
    for (const [path, value] of referenceLeaves) {
      const currentValue = currentLeaves.get(path);

      // Skip if translation exists and is different from English
      if (currentValue && currentValue !== value) {
        continue;
      }

      // Skip if the value is very short (likely a button label that should stay consistent)
      if (value.length < 3) {
        continue;
      }

      keysToTranslate.push(path);
    }

    console.log(`  Found ${keysToTranslate.length} keys to translate`);

    // Process in batches
    for (let i = 0; i < keysToTranslate.length; i += batchSize) {
      const batch = keysToTranslate.slice(i, i + batchSize);
      const promises = batch.map(async (key) => {
        const englishText = referenceLeaves.get(key)!;
        const translated = await translateText(englishText, lang);

        if (translated !== englishText) {
          setByPath(current, key, translated);
          translatedCount++;
          console.log(`  ✓ Translated: ${key}`);
        }
      });

      await Promise.all(promises);

      // Small delay to avoid rate limiting
      if (i + batchSize < keysToTranslate.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Write updated file
    fs.writeFileSync(langPath, JSON.stringify(current, null, 2) + "\n");
    console.log(`  Translated ${translatedCount} keys for ${lang}`);
  }

  console.log("\n✅ Translation complete!");
}

// Run the translation
translateMissingKeys().catch(console.error);

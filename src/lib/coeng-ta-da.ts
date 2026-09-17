/**
 * Approved ្ត (j+t) vs ្ដ (j+d) spellings for regression guards.
 * Keep in sync with scripts/coeng-ta-da-map.mjs
 *
 * Banned forms are built from code units so this file itself does not
 * contain searchable wrong spellings for the source audit.
 */

export const COENG_TA = "\u17D2\u178F";
export const COENG_DA = "\u17D2\u178A";

function ta(...parts: string[]): string {
  return parts.join("").replaceAll("\u0000", COENG_TA);
}

function da(...parts: string[]): string {
  return parts.join("").replaceAll("\u0000", COENG_DA);
}

/** Wrong TA forms that must not appear in content sources after the fix */
export const BANNED_TA_FORMS = [
  ta("សេចក", "\u0000", "ី"),
  ta("ទីស", "\u0000", "ី"),
  ta("ស", "\u0000", "ីពី"),
  ta("ស", "\u0000", "ី"),
  ta("ជាក់ស", "\u0000", "ែង"),
  ta("កណ", "\u0000", "ាល"),
  ta("អស", "\u0000", "ង្គត"),
  ta("បណ", "\u0000", "ាញ"),
  ta("បណ", "\u0000", "ុះ"),
  ta("បណ", "\u0000", "ាល"),
  ta("ដណ", "\u0000", "ប់"),
  ta("ផ", "\u0000", "ើម"),
  ta("ផ", "\u0000", "ល់"),
  ta("ប", "\u0000", "ូរ"),
  ta("ក", "\u0000", "ារ"),
  ta("ម", "\u0000", "ាយ"),
  ta("ឧត", "\u0000", "ម"),
  ta("ភក", "\u0000", "ិ"),
  ta("ស", "\u0000", "ាំ"),
  ta("ក", "\u0000", "ៅ"),
  ta("ក", "\u0000", "ី"),
] as const;

/** Wrong DA forms that must be TA */
export const BANNED_DA_FORMS = [da("ស", "\u0000", "ង់ដារ")] as const;

/** Canonical snippets that curriculum/UI should use */
export const REQUIRED_CANONICAL = [
  da("សេចក", "\u0000", "ី"),
  da("ទីស", "\u0000", "ី"),
  da("ស", "\u0000", "ីពី"),
  da("ក", "\u0000", "ារ"),
  da("កណ", "\u0000", "ាល"),
  da("ប", "\u0000", "ូរ"),
  da("ផ", "\u0000", "ើម"),
  da("ម", "\u0000", "ាយ"),
  da("ឧត", "\u0000", "ម"),
  da("ភក", "\u0000", "ិ"),
  da("ស", "\u0000", "ាំ"),
  ta("ស", "\u0000", "ង់ដារ"),
  da("ស", "\u0000"),
  da("ស", "\u0000", "ា"),
] as const;

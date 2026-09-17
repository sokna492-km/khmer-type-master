/**
 * Approved etymological NiDA map: ្ត (j+t) vs ្ដ (j+d).
 * Wrong form → canonical form. Apply longest-first.
 * Keep in sync with src/lib/coeng-ta-da.ts
 *
 * Forms built from code units so this file is not flagged by the audit.
 */

export const TA = "\u17D2\u178F"; // ្ត
export const DA = "\u17D2\u178A"; // ្ដ

const T = "\u0000"; // placeholder → TA/DA

function withMark(mark, ...parts) {
  return parts.join("").split(T).join(mark);
}

/** Flip/unify: every wrong spelling → approved spelling */
export const REPLACEMENTS = [
  [withMark(TA, "សេចក", T, "ី"), withMark(DA, "សេចក", T, "ី")],
  [withMark(TA, "ទីស", T, "ីការ"), withMark(DA, "ទីស", T, "ីការ")],
  [withMark(TA, "ទីស", T, "ី"), withMark(DA, "ទីស", T, "ី")],
  [withMark(TA, "ស", T, "ីពី"), withMark(DA, "ស", T, "ីពី")],
  [withMark(TA, "ស", T, "ី"), withMark(DA, "ស", T, "ី")],
  [withMark(TA, "ជាក់ស", T, "ែង"), withMark(DA, "ជាក់ស", T, "ែង")],
  [withMark(TA, "កណ", T, "ាល"), withMark(DA, "កណ", T, "ាល")],
  [withMark(TA, "អស", T, "ង្គត"), withMark(DA, "អស", T, "ង្គត")],
  [withMark(TA, "បណ", T, "ាញ"), withMark(DA, "បណ", T, "ាញ")],
  [withMark(TA, "បណ", T, "ុះ"), withMark(DA, "បណ", T, "ុះ")],
  [withMark(TA, "បណ", T, "ាល"), withMark(DA, "បណ", T, "ាល")],
  [withMark(TA, "ដណ", T, "ប់"), withMark(DA, "ដណ", T, "ប់")],
  [withMark(TA, "ផ", T, "ើម"), withMark(DA, "ផ", T, "ើម")],
  [withMark(TA, "ផ", T, "ល់"), withMark(DA, "ផ", T, "ល់")],
  [withMark(TA, "ប", T, "ូរ"), withMark(DA, "ប", T, "ូរ")],
  [withMark(TA, "ក", T, "ារ"), withMark(DA, "ក", T, "ារ")],
  [withMark(TA, "ម", T, "ាយ"), withMark(DA, "ម", T, "ាយ")],
  [withMark(TA, "ឧត", T, "ម"), withMark(DA, "ឧត", T, "ម")],
  [withMark(TA, "ភក", T, "ិ"), withMark(DA, "ភក", T, "ិ")],
  [withMark(TA, "ស", T, "ាំ"), withMark(DA, "ស", T, "ាំ")],
  [withMark(TA, "ក", T, "ៅ"), withMark(DA, "ក", T, "ៅ")],
  [withMark(TA, "ក", T, "ី"), withMark(DA, "ក", T, "ី")],
  [withMark(DA, "ស", T, "ង់ដារ"), withMark(TA, "ស", T, "ង់ដារ")],
];

export const BANNED_TA_FORMS = REPLACEMENTS.filter(([from, to]) => from.includes(TA) && to.includes(DA)).map(
  ([from]) => from,
);

export const BANNED_DA_FORMS = [withMark(DA, "ស", T, "ង់ដារ")];

export const REQUIRED_CANONICAL = [
  withMark(DA, "សេចក", T, "ី"),
  withMark(DA, "ទីស", T, "ី"),
  withMark(DA, "ស", T, "ីពី"),
  withMark(DA, "ក", T, "ារ"),
  withMark(DA, "កណ", T, "ាល"),
  withMark(DA, "ប", T, "ូរ"),
  withMark(DA, "ផ", T, "ើម"),
  withMark(DA, "ម", T, "ាយ"),
  withMark(DA, "ឧត", T, "ម"),
  withMark(DA, "ភក", T, "ិ"),
  withMark(DA, "ស", T, "ាំ"),
  withMark(TA, "ស", T, "ង់ដារ"),
];

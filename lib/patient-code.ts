const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";

/** First 3 letters from the company name, uppercased (pads with X if needed). */
export function patientCodePrefixFromCompanyName(companyName: string) {
  const letters = companyName.replace(/[^A-Za-z]/g, "").toUpperCase();
  if (letters.length >= 3) return letters.slice(0, 3);
  return (letters + "XXX").slice(0, 3);
}

function pickRandom(chars: string) {
  return chars[Math.floor(Math.random() * chars.length)];
}

/** Shuffle in place (Fisher–Yates). */
function shuffle<T>(items: T[]) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/** Suffix must be exactly 6 chars: 3 letters + 3 digits, mixed. */
export function isPatientCodeSuffixValid(suffix: string) {
  if (!/^[A-Za-z0-9]{6}$/.test(suffix)) return false;
  const letters = suffix.replace(/[^A-Za-z]/g, "");
  const digits = suffix.replace(/[^0-9]/g, "");
  return letters.length === 3 && digits.length === 3;
}

export function isValidPatientCode(companyName: string, code: string) {
  const trimmed = code.trim().toUpperCase();
  const prefix = patientCodePrefixFromCompanyName(companyName);
  if (!trimmed.startsWith(`${prefix}-`)) return false;
  return isPatientCodeSuffixValid(trimmed.slice(prefix.length + 1));
}

export function patientCodeFormatHint(companyName: string) {
  const prefix = patientCodePrefixFromCompanyName(companyName);
  return `${prefix}-XXXXXX (3 letters + 3 numbers, mixed)`;
}

function generateMixedSuffix() {
  const chars = [
    pickRandom(LETTERS),
    pickRandom(LETTERS),
    pickRandom(LETTERS),
    pickRandom(DIGITS),
    pickRandom(DIGITS),
    pickRandom(DIGITS),
  ];
  return shuffle(chars).join("");
}

/** Auto-create a code like CLA-A7K2M9 (3 letters + 3 digits mixed). */
export function generatePatientCode(companyName: string) {
  const prefix = patientCodePrefixFromCompanyName(companyName);
  return `${prefix}-${generateMixedSuffix()}`;
}

export function patientCodeErrorMessage(companyName: string) {
  return `Patient code is required in the format ${patientCodeFormatHint(companyName)}.`;
}

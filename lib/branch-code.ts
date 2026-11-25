const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateBranchCode() {
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return `BR-${suffix}`;
}

export function isValidBranchCode(value: string) {
  return /^BR-[A-Z0-9]{4}$/i.test(value.trim());
}

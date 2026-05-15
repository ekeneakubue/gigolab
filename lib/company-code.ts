const CODE_SUFFIX_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export const COMPANY_CODE_PREFIX = "Gigolab-";
export const COMPANY_CODE_SUFFIX_LENGTH = 6;

export function generateCompanyCode(): string {
  let suffix = "";
  for (let i = 0; i < COMPANY_CODE_SUFFIX_LENGTH; i++) {
    suffix += CODE_SUFFIX_CHARS[Math.floor(Math.random() * CODE_SUFFIX_CHARS.length)];
  }
  return `${COMPANY_CODE_PREFIX}${suffix}`;
}

export function isValidCompanyCode(code: string): boolean {
  return new RegExp(`^Gigolab-[A-Za-z0-9]{${COMPANY_CODE_SUFFIX_LENGTH}}$`).test(code);
}

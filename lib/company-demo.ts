export const DEMO_COMPANY_PASSWORD = "demo123";
export const DEMO_CODE_PREFIX = "Demo-";
export const DEMO_CODE_SUFFIX_LENGTH = 4;

const DEMO_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function generateDemoCompanyCode(): string {
  let suffix = "";
  for (let i = 0; i < DEMO_CODE_SUFFIX_LENGTH; i++) {
    suffix += DEMO_CODE_CHARS[Math.floor(Math.random() * DEMO_CODE_CHARS.length)];
  }
  return `${DEMO_CODE_PREFIX}${suffix}`;
}

export function isDemoCompanyCode(code: string): boolean {
  return new RegExp(`^Demo-[A-Za-z0-9]{${DEMO_CODE_SUFFIX_LENGTH}}$`).test(code);
}

export const COMPANY_BRAND_COLORS = [
  { value: "#059669", label: "Emerald" },
  { value: "#0d9488", label: "Teal" },
  { value: "#0284c7", label: "Sky" },
  { value: "#2563eb", label: "Blue" },
  { value: "#4f46e5", label: "Indigo" },
  { value: "#7c3aed", label: "Violet" },
  { value: "#db2777", label: "Pink" },
  { value: "#dc2626", label: "Red" },
  { value: "#ea580c", label: "Orange" },
  { value: "#ca8a04", label: "Gold" },
  { value: "#65a30d", label: "Lime" },
  { value: "#334155", label: "Slate" },
] as const;

export const DEFAULT_COMPANY_BRAND_COLOR = COMPANY_BRAND_COLORS[0].value;

export type CompanyBrandColor = (typeof COMPANY_BRAND_COLORS)[number]["value"];

const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{6})$/;

export function isCompanyBrandColor(value: string): value is CompanyBrandColor {
  return COMPANY_BRAND_COLORS.some((color) => color.value === value);
}

export function isValidBrandHex(value: string) {
  return HEX_COLOR_PATTERN.test(value.trim());
}

export function companyBrandColorLabel(value: string | null | undefined) {
  if (!value) return COMPANY_BRAND_COLORS[0].label;
  return (
    COMPANY_BRAND_COLORS.find(
      (color) => color.value.toLowerCase() === value.toLowerCase(),
    )?.label ?? "Custom"
  );
}

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

/** True when white text reads well on this color (WCAG relative luminance). */
export function brandColorPrefersLightText(hex: string | null | undefined) {
  const color = hex && HEX_COLOR_PATTERN.test(hex) ? hex : DEFAULT_COMPANY_BRAND_COLOR;
  const { r, g, b } = hexToRgb(color);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  return luminance < 0.45;
}

/** Mix a hex color toward black (amount 0–1). */
export function darkenBrandColor(hex: string, amount: number) {
  const color = HEX_COLOR_PATTERN.test(hex) ? hex : DEFAULT_COMPANY_BRAND_COLOR;
  const { r, g, b } = hexToRgb(color);
  const mix = (c: number) => Math.round(c * (1 - amount));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

export function normalizeCompanyBrandColor(value: unknown) {
  if (typeof value !== "string") return DEFAULT_COMPANY_BRAND_COLOR;
  const trimmed = value.trim();
  if (!HEX_COLOR_PATTERN.test(trimmed)) return DEFAULT_COMPANY_BRAND_COLOR;
  return `#${trimmed.slice(1).toUpperCase()}`;
}

import { COMPANY_ADMINISTRATIONS_MENU } from "@/lib/company-administrations-menu";
import {
  COMPANY_DIAGNOSTICS_LEGACY_MENU,
  COMPANY_DIAGNOSTICS_MENU,
} from "@/lib/company-diagnostics-menu";
import { COMPANY_INSURANCE_MENU } from "@/lib/company-insurance-menu";
import { COMPANY_REPORTS_MENU } from "@/lib/company-reports-menu";

export type CompanyNavModule = {
  id?: string;
  label: string;
  children: CompanyNavModule[];
};

export type CompanyNavFeature = {
  id: string;
  name: string;
  route: string;
  type: "Page" | "Menu";
  modules: CompanyNavModule[];
};

export function slugifyNavLabel(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const knownTabByRouteAndLabel = new Map<string, string>();

function registerKnownTabs(route: string, items: readonly { label: string; tab: string; children?: readonly { label: string; tab: string }[] }[]) {
  for (const item of items) {
    knownTabByRouteAndLabel.set(`${route}::${item.label.toLowerCase()}`, item.tab);
    if ("children" in item && item.children) {
      for (const child of item.children) {
        knownTabByRouteAndLabel.set(`${route}::${child.label.toLowerCase()}`, child.tab);
      }
    }
  }
}

registerKnownTabs("/company/administrations", COMPANY_ADMINISTRATIONS_MENU);
registerKnownTabs("/company/diagnostics", [
  ...COMPANY_DIAGNOSTICS_MENU,
  ...COMPANY_DIAGNOSTICS_LEGACY_MENU,
]);
registerKnownTabs("/company/insurance", COMPANY_INSURANCE_MENU);
registerKnownTabs(
  "/company/reports",
  COMPANY_REPORTS_MENU as readonly {
    label: string;
    tab: string;
    children?: readonly { label: string; tab: string }[];
  }[],
);

export function navModuleTab(route: string, label: string) {
  return (
    knownTabByRouteAndLabel.get(`${route}::${label.toLowerCase()}`) ?? slugifyNavLabel(label)
  );
}

export function navModuleHref(route: string, label: string) {
  return `${route}?tab=${encodeURIComponent(navModuleTab(route, label))}`;
}

const iconPalette = [
  { iconColor: "text-emerald-600", iconActive: "text-emerald-700" },
  { iconColor: "text-slate-600", iconActive: "text-slate-700" },
  { iconColor: "text-sky-600", iconActive: "text-sky-700" },
  { iconColor: "text-rose-600", iconActive: "text-rose-700" },
  { iconColor: "text-teal-600", iconActive: "text-teal-700" },
  { iconColor: "text-amber-600", iconActive: "text-amber-700" },
  { iconColor: "text-indigo-600", iconActive: "text-indigo-700" },
  { iconColor: "text-violet-600", iconActive: "text-violet-700" },
];

export function navFeatureColors(index: number) {
  return iconPalette[index % iconPalette.length];
}

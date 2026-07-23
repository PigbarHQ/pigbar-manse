export const BIZRADAR_COMPANY_PROFILE_STORAGE_KEY = "pigbar.bizradar.companyProfile.v1";

export type BizRadarCompanyProfile = {
  companyName: string;
  businessRegistrationNumber: string;
  industry: string;
  region: string;
  employeeCount: string;
  revenueRange: string;
  technologies: string[];
  certifications: string[];
  licenses: string[];
  directProduction: string;
  majorPerformances: string[];
  updatedAt?: string;
};

export const EMPTY_COMPANY_PROFILE: BizRadarCompanyProfile = {
  companyName: "",
  businessRegistrationNumber: "",
  industry: "",
  region: "",
  employeeCount: "",
  revenueRange: "",
  technologies: [],
  certifications: [],
  licenses: [],
  directProduction: "",
  majorPerformances: [],
};

export function parseCompanyListInput(input: string) {
  return input
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function companyListToInput(items: string[]) {
  return items.join("\n");
}

export type Section =
  | "overview"
  | "keyword"
  | "trend"
  | "reviews"
  | "competitor"
  | "calendar"
  | "aibot"
  | "brand";

export interface BrandProfile {
  brandName: string;
  industry: string;
  slogan: string;
  description: string;
  products: string;
  priceRange: string;
  targetAge: string[];
  targetGender: string;
  targetDescription: string;
  toneKeywords: string[];
  toneDescription: string;
  channels: string[];
  competitors: string;
  successCases: string;
  doNotList: string;
}

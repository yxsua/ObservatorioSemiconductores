import type { components } from "@/api/schema";

export type Trend = components["schemas"]["Trend"] & {
  assessment?:import("@/features/assessment/trend-assessment").TrendAssessment|null;
  analyst?: { id: number; name: string } | null;
  signals: Array<{ id: number; businessCode: string; title: string }>;
  actors: Array<{ id: number; name: string; type?: string }>;
};
export interface Option { value: string; label: string; evidence?:import("@/features/assessment/trend-assessment").TrendEvidence }
export interface TrendFormOptions {
  directions: Option[];
  maturities: Option[];
  signals: Option[];
  actors: Option[];
}

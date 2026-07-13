import type { components } from "@/api/schema";

export type Trend = components["schemas"]["Trend"] & {
  analyst?: { id: number; name: string } | null;
  signals: Array<{ id: number; businessCode: string; title: string }>;
  actors: Array<{ id: number; name: string; type?: string }>;
};
export interface Option { value: string; label: string }
export interface TrendFormOptions {
  directions: Option[];
  maturities: Option[];
  signals: Option[];
  actors: Option[];
}

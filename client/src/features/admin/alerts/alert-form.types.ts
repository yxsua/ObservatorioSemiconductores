import type { components } from "@/api/schema";

export type Alert = components["schemas"]["Alert"] & {
  creator?: { id: number; name: string } | null;
  signals: Array<{ id: number; businessCode: string; title: string; statusCode: string }>;
  trends: Array<{ id: number; businessCode: string; title: string; statusCode: string }>;
};
export interface Option { value: string; label: string }
export interface AlertFormOptions {
  levels: Option[];
  signals: Option[];
  trends: Option[];
  audiences: Option[];
}

import type { components } from "@/api/schema";

export type Signal = components["schemas"]["Signal"] & {assessment?:import('@/features/assessment/assessment').SignalAssessment|null};

export interface SignalFormOption {
  label: string;
  value: string;
}

export interface SignalFormOptions {
  categories: SignalFormOption[];
  sources: SignalFormOption[];
  signalTypes: SignalFormOption[];
}

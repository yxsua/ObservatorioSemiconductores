import type { components } from "@/api/schema";

export type Signal = components["schemas"]["Signal"];

export interface SignalFormOption {
  label: string;
  value: string;
}

export interface SignalFormOptions {
  categories: SignalFormOption[];
  sources: SignalFormOption[];
  signalTypes: SignalFormOption[];
  impacts: SignalFormOption[];
  urgencies: SignalFormOption[];
  reliabilities: SignalFormOption[];
  scopes: SignalFormOption[];
}


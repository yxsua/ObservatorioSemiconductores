import type { components } from "@/api/schema";

export type User = components["schemas"]["User"];
export type LoginInput = components["schemas"]["LoginInput"];
export type RegisterInput = components["schemas"]["RegisterInput"];
export type AuthData = components["schemas"]["AuthData"];

export type AuthStatus =
  | "restoring"
  | "anonymous"
  | "authenticated"
  | "restore-error";

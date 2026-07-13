import type { paths } from "@/api/schema";
import { apiRequest } from "@/api";
import type { AuthData, LoginInput, RegisterInput, User } from "./types";

type LoginResponse = paths["/auth/login"]["post"]["responses"]["200"]["content"]["application/json"];
type RegisterResponse = paths["/auth/register"]["post"]["responses"]["201"]["content"]["application/json"];
type ProfileResponse = paths["/auth/me"]["get"]["responses"]["200"]["content"]["application/json"];

export async function login(input: LoginInput): Promise<AuthData> {
  const response = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: input
  });
  return response.data;
}

export async function register(input: RegisterInput): Promise<AuthData> {
  const response = await apiRequest<RegisterResponse>("/auth/register", {
    method: "POST",
    body: input
  });
  return response.data;
}

export async function getProfile(token: string): Promise<User> {
  const response = await apiRequest<ProfileResponse>("/auth/me", { token });
  return response.data;
}

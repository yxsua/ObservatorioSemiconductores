import { useState, type PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "../query-client";
import { AuthProvider } from "@/features/auth/AuthProvider";

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}

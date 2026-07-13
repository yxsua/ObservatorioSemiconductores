import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { appRoutes } from "@/app/router";
import { createQueryClient } from "@/app/query-client";
import { AuthProvider } from "@/features/auth/AuthProvider";

export function renderApp(initialEntry: string) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [initialEntry] });
  const queryClient = createQueryClient();

  return {
    router,
    ...render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    )
  };
}

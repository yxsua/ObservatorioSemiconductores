import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ViewCounter } from "./ViewCounter";

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

describe("ViewCounter", () => {
  it("registra la primera visita de la sesión y presenta el total", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      message: "Visita registrada correctamente.",
      data: { resourceType: "signal", resourceId: 9, viewCount: 125 }
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(<QueryClientProvider client={client}><ViewCounter id={9} resource="signal" /></QueryClientProvider>);

    expect(await screen.findByLabelText("125 visitas")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/views/signal/9"), expect.objectContaining({ method: "POST" }));
    expect(sessionStorage.getItem("observatorio:view:signal:9")).toBe("1");
  });
});

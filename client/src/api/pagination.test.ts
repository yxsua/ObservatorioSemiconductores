import { describe, expect, it } from "vitest";
import { canGoToNextPage, canGoToPreviousPage } from "./pagination";

describe("controles de paginación", () => {
  it("representan correctamente los límites", () => {
    const first = { page: 1, pageSize: 20, totalItems: 21, totalPages: 2 };
    const last = { ...first, page: 2 };
    expect(canGoToPreviousPage(first)).toBe(false);
    expect(canGoToNextPage(first)).toBe(true);
    expect(canGoToPreviousPage(last)).toBe(true);
    expect(canGoToNextPage(last)).toBe(false);
  });
});

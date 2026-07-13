import { afterEach, describe, expect, it, vi } from "vitest";
import { apiDownload, parseContentDispositionFilename } from "./download";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parseContentDispositionFilename", () => {
  it("admite filename y filename* codificado", () => {
    expect(parseContentDispositionFilename(
      'attachment; filename="observatorio-signals.csv"'
    )).toBe("observatorio-signals.csv");
    expect(parseContentDispositionFilename(
      "attachment; filename*=UTF-8''reporte%20p%C3%BAblico.json"
    )).toBe("reporte público.json");
  });

  it("elimina separadores de ruta", () => {
    expect(parseContentDispositionFilename('attachment; filename="../data.csv"'))
      .toBe(".._data.csv");
  });
});

describe("apiDownload", () => {
  it("devuelve archivo y metadatos de exportación", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("csv", {
      status: 200,
      headers: {
        "content-type": "text/csv",
        "content-disposition": 'attachment; filename="signals.csv"',
        "x-export-id": "9",
        "x-row-count": "12",
        "x-checksum-sha256": "a".repeat(64)
      }
    })));

    const result = await apiDownload("/exports/signals.csv", "export.csv", {
      token: "jwt"
    });
    expect(result.filename).toBe("signals.csv");
    expect(result.exportId).toBe(9);
    expect(result.rowCount).toBe(12);
    expect(result.checksum).toBe("a".repeat(64));
    const contents = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(result.blob);
    });
    expect(contents).toBe("csv");
  });
});

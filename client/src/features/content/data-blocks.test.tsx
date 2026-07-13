import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ChartBlock } from "./ChartBlock";
import { DataTable } from "./DataTableBlock";
import { parseChartData, parseTableData, type ChartData } from "./data-blocks";

afterEach(cleanup);
const tableInput = {
  caption: "Capacidad por región",
  columns: [
    { key: "region", label: "Región", type: "text" },
    { key: "capacity", label: "Capacidad", type: "number" },
    { key: "active", label: "Activa", type: "boolean" },
    { key: "date", label: "Fecha", type: "date" }
  ],
  rows: [
    { region: "Norte", capacity: 1250.5, active: true, date: "2026-06-20" },
    { region: "Centro", capacity: null, active: false, date: null }
  ]
};
const chart = (chartType: ChartData["chartType"]): ChartData => ({
  chartType,
  title: "Evolución regional",
  labels: ["2024", "2025", "2026"],
  series: [{ name: "Capacidad", values: [4, 7, 10], color: "#14788a" }]
});

describe("bloques de datos", () => {
  it("valida y presenta una tabla semántica con formatos públicos", () => {
    const data = parseTableData(tableInput);
    expect(data).not.toBeNull();
    render(<DataTable data={data!} />);
    expect(screen.getByRole("table", { name: "Capacidad por región" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Capacidad" })).toBeInTheDocument();
    expect(screen.getByText("1,250.5")).toBeInTheDocument();
    expect(screen.getByText("Sí")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(2);
    expect(screen.getByRole("region", { name: "Capacidad por región" })).toHaveAttribute("tabindex", "0");
  });
  it("rechaza columnas duplicadas y celdas con tipo incorrecto", () => {
    expect(parseTableData({ columns: [{ key: "x", label: "X", type: "number" }, { key: "x", label: "Otra", type: "number" }], rows: [] })).toBeNull();
    expect(parseTableData({ columns: [{ key: "x", label: "X", type: "number" }], rows: [{ x: "no" }] })).toBeNull();
  });
  it.each(["bar", "line", "area", "pie"] as const)("renderiza gráfico %s con descripción y tabla equivalente", (type) => {
    render(<ChartBlock data={chart(type)} id={20} />);
    expect(screen.getByRole("img", { name: /Evolución regional/ })).toBeInTheDocument();
    expect(screen.getByText(/Los datos completos están disponibles/)).toBeInTheDocument();
    expect(screen.getByText("Consultar datos del gráfico")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Evolución regional" })).toBeInTheDocument();
    if (type === "bar") expect(document.querySelector("rect")).toBeInTheDocument();
    if (type === "pie") expect(document.querySelector("path, circle")).toBeInTheDocument();
  });
  it("rechaza series desalineadas y pasteles con valores negativos", () => {
    expect(parseChartData({ chartType: "line", labels: ["A", "B"], series: [{ name: "X", values: [1] }] })).toBeNull();
    expect(parseChartData({ chartType: "pie", labels: ["A", "B"], series: [{ name: "X", values: [1, -1] }] })).toBeNull();
  });
});

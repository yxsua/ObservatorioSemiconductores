import type { ChartData, ChartSeries, TableData } from "./data-blocks";
import { DataTable } from "./DataTableBlock";
import styles from "./DataBlocks.module.css";

const PALETTE = ["#14788a", "#d47b22", "#6a5acd", "#238254", "#b52a2a", "#7a5b3a", "#3b6fb6", "#a5477e"];
const WIDTH = 720;
const HEIGHT = 360;
const LEFT = 58;
const RIGHT = 20;
const TOP = 28;
const BOTTOM = 58;
const PLOT_WIDTH = WIDTH - LEFT - RIGHT;
const PLOT_HEIGHT = HEIGHT - TOP - BOTTOM;

function color(series: ChartSeries, index: number) {
  return series.color || PALETTE[index % PALETTE.length];
}
function typeLabel(type: ChartData["chartType"]) {
  return { bar: "barras", line: "líneas", area: "áreas", pie: "pastel" }[type];
}
function tableFor(data: ChartData): TableData {
  return {
    caption: data.title || "Datos del gráfico",
    columns: [
      { key: "label", label: "Categoría", type: "text" },
      ...data.series.map((series, index) => ({ key: "series" + index, label: series.name, type: "number" as const }))
    ],
    rows: data.labels.map((label, labelIndex) => Object.fromEntries([
      ["label", label],
      ...data.series.map((series, seriesIndex) => ["series" + seriesIndex, series.values[labelIndex]])
    ]))
  };
}
function pointScale(data: ChartData) {
  const values = data.series.flatMap(({ values: seriesValues }) => seriesValues);
  let minimum = Math.min(0, ...values);
  let maximum = Math.max(0, ...values);
  if (minimum === maximum) { minimum -= 1; maximum += 1; }
  const x = (index: number) => LEFT + (data.labels.length === 1 ? PLOT_WIDTH / 2 : index * PLOT_WIDTH / (data.labels.length - 1));
  const y = (value: number) => TOP + (maximum - value) * PLOT_HEIGHT / (maximum - minimum);
  return { x, y, baseline: y(0), minimum, maximum };
}
function pathFor(values: number[], x: (index: number) => number, y: (value: number) => number) {
  return values.map((value, index) => (index ? "L" : "M") + x(index) + " " + y(value)).join(" ");
}
function polar(cx: number, cy: number, radius: number, angle: number) {
  const radians = (angle - 90) * Math.PI / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}
function arc(cx: number, cy: number, radius: number, start: number, end: number) {
  const from = polar(cx, cy, radius, start);
  const to = polar(cx, cy, radius, end);
  return "M " + cx + " " + cy + " L " + from.x + " " + from.y + " A " + radius + " " + radius + " 0 " + (end - start > 180 ? 1 : 0) + " 1 " + to.x + " " + to.y + " Z";
}

function CartesianChart({ data }: { data: ChartData }) {
  const scale = pointScale(data);
  const labelStep = Math.max(1, Math.ceil(data.labels.length / 8));
  return (
    <>
      <line className={styles.axis} x1={LEFT} x2={WIDTH - RIGHT} y1={scale.baseline} y2={scale.baseline} />
      <line className={styles.axis} x1={LEFT} x2={LEFT} y1={TOP} y2={HEIGHT - BOTTOM} />
      {data.chartType === "bar" ? data.labels.flatMap((_, labelIndex) => {
        const groupWidth = PLOT_WIDTH / data.labels.length;
        const barWidth = Math.max(1, Math.min(36, groupWidth / (data.series.length + 1)));
        return data.series.map((series, seriesIndex) => {
          const value = series.values[labelIndex];
          const valueY = scale.y(value);
          const x = LEFT + labelIndex * groupWidth + (groupWidth - barWidth * data.series.length) / 2 + seriesIndex * barWidth;
          return <rect fill={color(series, seriesIndex)} height={Math.abs(scale.baseline - valueY)} key={seriesIndex + "-" + labelIndex} width={Math.max(1, barWidth - 2)} x={x} y={Math.min(scale.baseline, valueY)} />;
        });
      }) : data.series.map((series, index) => {
        const line = pathFor(series.values, scale.x, scale.y);
        if (data.chartType === "area") {
          const area = "M " + scale.x(0) + " " + scale.baseline + " " + line.slice(1) + " L " + scale.x(series.values.length - 1) + " " + scale.baseline + " Z";
          return <g key={series.name}><path d={area} fill={color(series, index)} opacity=".2" /><path d={line} fill="none" stroke={color(series, index)} strokeWidth="3" vectorEffect="non-scaling-stroke" /></g>;
        }
        return <path d={line} fill="none" key={series.name} stroke={color(series, index)} strokeWidth="3" vectorEffect="non-scaling-stroke" />;
      })}
      {data.labels.map((label, index) => index % labelStep === 0 && <text className={styles.axisLabel} key={label + index} textAnchor="middle" x={scale.x(index)} y={HEIGHT - BOTTOM + 24}>{label}</text>)}
      <text className={styles.axisLabel} textAnchor="end" x={LEFT - 8} y={TOP + 4}>{new Intl.NumberFormat("es-MX", { notation: "compact" }).format(scale.maximum)}</text>
      <text className={styles.axisLabel} textAnchor="end" x={LEFT - 8} y={HEIGHT - BOTTOM}>{new Intl.NumberFormat("es-MX", { notation: "compact" }).format(scale.minimum)}</text>
    </>
  );
}

function PieChart({ data }: { data: ChartData }) {
  const values = data.series[0].values;
  const total = values.reduce((sum, value) => sum + value, 0);
  let angle = 0;
  return <>{values.map((value, index) => {
    if (value === 0) return null;
    const start = angle;
    const end = angle + value / total * 360;
    angle = end;
    return end - start >= 359.999
      ? <circle cx={WIDTH / 2} cy={HEIGHT / 2} fill={PALETTE[index % PALETTE.length]} key={index} r="125" />
      : <path d={arc(WIDTH / 2, HEIGHT / 2, 125, start, end)} fill={PALETTE[index % PALETTE.length]} key={index} />;
  })}</>;
}

export function ChartBlock({ data, id }: { data: ChartData; id: number }) {
  const titleId = "chart-title-" + id;
  const descriptionId = "chart-description-" + id;
  const legendEntries = data.chartType === "pie"
    ? data.labels.map((label, index) => ({ label, color: PALETTE[index % PALETTE.length] }))
    : data.series.map((series, index) => ({ label: series.name, color: color(series, index) }));
  return (
    <figure className={styles.chart}>
      <figcaption id={titleId}>{data.title || "Gráfico de " + typeLabel(data.chartType)}</figcaption>
      <svg aria-labelledby={titleId + " " + descriptionId} role="img" viewBox={"0 0 " + WIDTH + " " + HEIGHT}>
        <desc id={descriptionId}>Gráfico de {typeLabel(data.chartType)} con {data.labels.length} categorías y {data.series.length} series. Los datos completos están disponibles después del gráfico.</desc>
        {data.chartType === "pie" ? <PieChart data={data} /> : <CartesianChart data={data} />}
      </svg>
      <ul aria-label="Leyenda del gráfico" className={styles.legend}>{legendEntries.map((entry, index) => <li key={entry.label + index}><span style={{ backgroundColor: entry.color }} />{entry.label}</li>)}</ul>
      <details className={styles.chartData}><summary>Consultar datos del gráfico</summary><DataTable data={tableFor(data)} label="Datos equivalentes del gráfico" /></details>
    </figure>
  );
}

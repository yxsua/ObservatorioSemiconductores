import Chart from "chart.js/auto";
import { useEffect, useMemo, useRef } from "react";

const palette = [
  "#334a62",
  "#5d748c",
  "#8fa0ad",
  "#d2dae1",
  "#2f7d78",
  "#d6a63c",
  "#c75948",
  "#7b68ad",
];

function ChartCard({
  data = [],
  datasetLabel = "Total",
  indexAxis,
  subtitle,
  title,
  type = "bar",
}) {
  const canvasRef = useRef(null);

  const chartData = useMemo(
    () => ({
      labels: data.map((item) => item.label),
      values: data.map((item) => Number(item.value ?? 0)),
    }),
    [data],
  );

  const hasData = chartData.values.some((value) => value > 0);

  useEffect(() => {
    if (!canvasRef.current || !hasData) {
      return undefined;
    }

    const chart = new Chart(canvasRef.current, {
      type,
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: datasetLabel,
            data: chartData.values,
            backgroundColor:
              type === "doughnut"
                ? palette
                : "rgba(51, 74, 98, 0.72)",
            borderColor:
              type === "doughnut"
                ? "#ffffff"
                : "rgba(51, 74, 98, 1)",
            borderRadius: type === "bar" ? 6 : 0,
            borderWidth: type === "doughnut" ? 3 : 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis,
        plugins: {
          legend: {
            display: type === "doughnut",
            position: "right",
            labels: {
              boxWidth: 10,
              color: "#405366",
              font: {
                family: "Inter, system-ui, sans-serif",
                size: 11,
              },
            },
          },
        },
        scales:
          type === "doughnut"
            ? {}
            : {
                x: {
                  grid: {
                    display: indexAxis !== "y",
                    color: "rgba(207, 220, 229, 0.6)",
                  },
                  ticks: {
                    color: "#526274",
                  },
                },
                y: {
                  beginAtZero: true,
                  grid: {
                    display: indexAxis !== "y",
                    color: "rgba(207, 220, 229, 0.6)",
                  },
                  ticks: {
                    color: "#526274",
                    precision: 0,
                  },
                },
              },
      },
    });

    return () => {
      chart.destroy();
    };
  }, [chartData, datasetLabel, hasData, indexAxis, type]);

  return (
    <article className="chart-card">
      <div className="chart-card__header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      <div className="chart-card__canvas">
        {hasData ? (
          <canvas ref={canvasRef} aria-label={title} role="img" />
        ) : (
          <div className="empty-state">Sin datos para graficar.</div>
        )}
      </div>
    </article>
  );
}

export default ChartCard;

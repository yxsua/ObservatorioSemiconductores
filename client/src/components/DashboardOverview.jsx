import useObservatoryResource from "../hooks/useObservatoryResource";
import { getObservatorySummary } from "../services/observatoryApi";
import ChartCard from "./ChartCard";
import EventTimeline from "./EventTimeline";
import LoadingSpinner from "./LoadingSpinner";
import MetricCard from "./MetricCard";

const emptySummary = {
  counts: {
    sources: 0,
    signals: 0,
    trends: 0,
    alerts: 0,
    content: 0,
  },
  charts: {
    signalsByMonth: [],
    signalsByFactor: [],
    contentByType: [],
    alertsByLevel: [],
  },
  timeline: [],
};

function DashboardOverview({ compact = false }) {
  const { data, error, isLoading } = useObservatoryResource(
    getObservatorySummary,
    emptySummary,
  );

  if (isLoading) {
    return <LoadingSpinner label="Cargando datos del observatorio..." />;
  }

  if (error) {
    return <div className="auth-error">{error}</div>;
  }

  const counts = data?.counts ?? emptySummary.counts;
  const charts = data?.charts ?? emptySummary.charts;

  return (
    <div className="dashboard-overview">
      <div className="metric-grid">
        <MetricCard label="Fuentes" value={counts.sources} detail="Activas" tone="info" />
        <MetricCard label="Senales" value={counts.signals} detail="Capturadas" tone="neutral" />
        <MetricCard label="Tendencias" value={counts.trends} detail="Analizadas" tone="success" />
        <MetricCard label="Alertas" value={counts.alerts} detail="Estrategicas" tone="danger" />
        <MetricCard label="Contenido" value={counts.content} detail="Editorial" tone="warning" />
      </div>

      <div className="chart-grid">
        <ChartCard
          data={charts.signalsByMonth}
          datasetLabel="Senales"
          subtitle="Ultimos 12 meses"
          title="Senales por mes"
          type="bar"
        />
        <ChartCard
          data={charts.signalsByFactor}
          datasetLabel="Senales"
          subtitle="Factores criticos"
          title="Distribucion por factor"
          type="doughnut"
        />
        <ChartCard
          data={charts.contentByType}
          datasetLabel="Contenido"
          indexAxis="y"
          subtitle="Tipos editoriales"
          title="Contenido por tipo"
          type="bar"
        />
        {!compact && (
          <ChartCard
            data={charts.alertsByLevel}
            datasetLabel="Alertas"
            indexAxis="y"
            subtitle="Nivel de atencion"
            title="Alertas por nivel"
            type="bar"
          />
        )}
      </div>

      <EventTimeline items={data?.timeline ?? []} />
    </div>
  );
}

export default DashboardOverview;

import ObservatorySection from "../../components/ObservatorySection";
import ToneBullet, { toneFromCode } from "../../components/ToneBullet";
import { getAlerts } from "../../services/observatoryApi";
import { formatDate, formatNumber } from "../../utils/formatters";

const columns = [
  {
    key: "title",
    title: "Titulo",
    render: (row) => (
      <div className="table-title">
        <strong>{row.title}</strong>
        <small>{row.executive_summary}</small>
      </div>
    ),
  },
  {
    key: "level",
    title: "Nivel",
    render: (row) => (
      <ToneBullet
        label={row.level || "Sin nivel"}
        tone={toneFromCode(row.level_code)}
      />
    ),
  },
  {
    key: "status",
    title: "Estado",
    render: (row) => (
      <ToneBullet
        label={row.status || "Sin estado"}
        tone={toneFromCode(row.status_code)}
      />
    ),
  },
  {
    key: "origin",
    title: "Origen",
    render: (row) => row.origin || "Sin origen",
  },
  {
    key: "total_signals",
    title: "Senales",
    render: (row) => formatNumber(row.total_signals),
  },
  {
    key: "generation_date",
    title: "Fecha",
    render: (row) => formatDate(row.generation_date),
  },
];

function AlertsPage() {
  return (
    <ObservatorySection
      catalogSection="alerts"
      columns={columns}
      description="Registro curado de alertas con implicaciones, recomendaciones y fechas clave."
      emptyMessage="No hay alertas registradas todavia."
      filters={[
        {
          name: "q",
          label: "Buscar por nombre",
          placeholder: "Titulo, codigo o resumen...",
        },
        {
          name: "level",
          label: "Nivel",
          type: "select",
          catalogKey: "alertLevels",
        },
        {
          name: "status",
          label: "Estado",
          type: "select",
          catalogKey: "alertStatuses",
        },
        {
          name: "origin",
          label: "Origen",
          type: "select",
          catalogKey: "alertOrigins",
        },
      ]}
      highlights={[
        { label: "Roja", tone: "danger" },
        { label: "Naranja", tone: "warning" },
        { label: "Amarilla", tone: "notice" },
        { label: "Publicada", tone: "success" },
      ]}
      loader={getAlerts}
      title="Alertas estrategicas"
    />
  );
}

export default AlertsPage;

import ObservatorySection from "../../components/ObservatorySection";
import ToneBullet, { toneFromCode } from "../../components/ToneBullet";
import { getTrends } from "../../services/observatoryApi";
import { formatDate, formatNumber } from "../../utils/formatters";

const columns = [
  {
    key: "title",
    title: "Titulo",
    render: (row) => (
      <div className="table-title">
        <strong>{row.title}</strong>
        <small>{row.narrative}</small>
      </div>
    ),
  },
  {
    key: "maturity",
    title: "Madurez",
    render: (row) => (
      <ToneBullet
        label={row.maturity || "Sin madurez"}
        tone={toneFromCode(row.maturity_code)}
      />
    ),
  },
  {
    key: "direction",
    title: "Direccion",
    render: (row) => (
      <ToneBullet
        label={row.direction || "Sin direccion"}
        tone={toneFromCode(row.direction_code)}
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
    key: "total_signals",
    title: "Senales",
    render: (row) => formatNumber(row.total_signals),
  },
  {
    key: "first_signal_date",
    title: "Primera senal",
    render: (row) => formatDate(row.first_signal_date),
  },
];

function TrendsPage() {
  return (
    <ObservatorySection
      catalogSection="trends"
      columns={columns}
      description="Agrupacion de senales relacionadas para analisis de direccion, madurez e impacto."
      emptyMessage="No hay tendencias registradas todavia."
      filters={[
        {
          name: "q",
          label: "Buscar por nombre",
          placeholder: "Titulo, codigo o narrativa...",
        },
        {
          name: "direction",
          label: "Direccion",
          type: "select",
          catalogKey: "trendDirections",
        },
        {
          name: "maturity",
          label: "Madurez",
          type: "select",
          catalogKey: "trendMaturity",
        },
        {
          name: "status",
          label: "Estado",
          type: "select",
          catalogKey: "trendStatuses",
        },
      ]}
      highlights={[
        { label: "Emergente", tone: "info" },
        { label: "En consolidacion", tone: "warning" },
        { label: "Creciente", tone: "success" },
        { label: "Disruptiva", tone: "danger" },
      ]}
      loader={getTrends}
      title="Tendencias tecnologicas"
    />
  );
}

export default TrendsPage;

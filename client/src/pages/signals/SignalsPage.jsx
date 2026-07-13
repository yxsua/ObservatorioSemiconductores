import ObservatorySection from "../../components/ObservatorySection";
import ToneBullet, { toneFromCode } from "../../components/ToneBullet";
import { getSignals } from "../../services/observatoryApi";
import { formatDate } from "../../utils/formatters";

const columns = [
  {
    key: "title",
    title: "Titulo",
    render: (row) => (
      <div className="table-title">
        <strong>{row.title}</strong>
        <small>{row.summary}</small>
      </div>
    ),
  },
  {
    key: "fcv",
    title: "Factor",
    render: (row) => row.fcv || row.category || "Sin factor",
  },
  {
    key: "impact",
    title: "Impacto",
    render: (row) => (
      <ToneBullet
        label={row.impact || "Sin impacto"}
        tone={toneFromCode(row.impact_code)}
      />
    ),
  },
  {
    key: "urgency",
    title: "Urgencia",
    render: (row) => (
      <ToneBullet
        label={row.urgency || "Sin urgencia"}
        tone={toneFromCode(row.urgency_code)}
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
    key: "publication_date",
    title: "Fecha",
    render: (row) => formatDate(row.publication_date),
  },
];

function SignalsPage() {
  return (
    <ObservatorySection
      catalogSection="signals"
      columns={columns}
      description="Registro y seguimiento de evidencia temprana relevante para el ecosistema semiconductor."
      emptyMessage="No hay senales registradas todavia."
      filters={[
        {
          name: "q",
          label: "Buscar por nombre",
          placeholder: "Titulo, codigo, fuente o resumen...",
        },
        {
          name: "fcv",
          label: "Factor critico",
          type: "select",
          catalogKey: "fcv",
        },
        {
          name: "category",
          label: "Categoria",
          type: "select",
          catalogKey: "categories",
        },
        {
          name: "source",
          label: "Fuente",
          type: "select",
          catalogKey: "sources",
        },
        {
          name: "signalType",
          label: "Tipo de senal",
          type: "select",
          catalogKey: "signalTypes",
        },
        {
          name: "impact",
          label: "Impacto",
          type: "select",
          catalogKey: "impacts",
        },
        {
          name: "urgency",
          label: "Urgencia",
          type: "select",
          catalogKey: "urgencies",
        },
        {
          name: "status",
          label: "Estado",
          type: "select",
          catalogKey: "signalStatuses",
        },
        {
          name: "scope",
          label: "Alcance",
          type: "select",
          catalogKey: "scopes",
        },
      ]}
      highlights={[
        { label: "Alta", tone: "danger" },
        { label: "Media", tone: "warning" },
        { label: "Baja", tone: "info" },
        { label: "Validada", tone: "success" },
      ]}
      loader={getSignals}
      title="Senales de vigilancia"
    />
  );
}

export default SignalsPage;

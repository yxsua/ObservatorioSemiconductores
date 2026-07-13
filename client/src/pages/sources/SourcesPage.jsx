import ObservatorySection from "../../components/ObservatorySection";
import ToneBullet from "../../components/ToneBullet";
import { getSources } from "../../services/observatoryApi";
import { formatDate, formatPercent } from "../../utils/formatters";

const columns = [
  {
    key: "name",
    title: "Nombre",
    render: (row) => (
      <div className="table-title">
        <strong>{row.name}</strong>
        <small>{row.website || "Sin sitio web registrado"}</small>
      </div>
    ),
  },
  {
    key: "source_type",
    title: "Tipo",
    render: (row) => row.source_type || "Sin tipo",
  },
  {
    key: "country",
    title: "Pais",
    render: (row) => row.country || "Sin pais",
  },
  {
    key: "reliability",
    title: "Confiabilidad",
    render: (row) => formatPercent(row.reliability),
  },
  {
    key: "active",
    title: "Estado",
    render: (row) => (
      <ToneBullet
        label={row.active ? "Activa" : "Inactiva"}
        tone={row.active ? "success" : "muted"}
      />
    ),
  },
  {
    key: "created_at",
    title: "Registro",
    render: (row) => formatDate(row.created_at),
  },
];

function SourcesPage() {
  return (
    <ObservatorySection
      catalogSection="sources"
      columns={columns}
      description="Catalogo de medios, reportes, patentes, sitios y repositorios para vigilancia tecnologica."
      emptyMessage="No hay fuentes registradas todavia."
      filters={[
        {
          name: "q",
          label: "Buscar por nombre",
          placeholder: "Nombre, sitio o pais...",
        },
        {
          name: "sourceType",
          label: "Tipo de fuente",
          type: "select",
          catalogKey: "sourceTypes",
        },
        {
          name: "active",
          label: "Estado",
          type: "select",
          catalogKey: "activeStates",
        },
      ]}
      highlights={[
        { label: "Articulos cientificos", tone: "neutral" },
        { label: "Patentes", tone: "info" },
        { label: "Reportes industriales", tone: "success" },
        { label: "Noticias", tone: "warning" },
      ]}
      loader={getSources}
      title="Fuentes de informacion"
    />
  );
}

export default SourcesPage;

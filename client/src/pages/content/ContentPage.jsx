import ObservatorySection from "../../components/ObservatorySection";
import ToneBullet, { toneFromCode } from "../../components/ToneBullet";
import { getContentItems } from "../../services/observatoryApi";
import { formatDate } from "../../utils/formatters";

const columns = [
  {
    key: "title",
    title: "Titulo",
    render: (row) => (
      <div className="table-title">
        <strong>{row.title}</strong>
        <small>{row.summary || row.slug}</small>
      </div>
    ),
  },
  {
    key: "content_type",
    title: "Tipo",
    render: (row) => row.content_type || "Sin tipo",
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
    key: "author",
    title: "Autor",
    render: (row) => row.author || "Sin autor",
  },
  {
    key: "published_at",
    title: "Publicado",
    render: (row) => formatDate(row.published_at || row.created_at),
  },
];

function ContentPage() {
  return (
    <ObservatorySection
      catalogSection="content"
      columns={columns}
      description="Noticias, reportes, recursos y paginas publicables del observatorio."
      emptyMessage="No hay contenido editorial registrado todavia."
      filters={[
        {
          name: "q",
          label: "Buscar por nombre",
          placeholder: "Titulo, articulo, slug o resumen...",
        },
        {
          name: "contentType",
          label: "Tipo de contenido",
          type: "select",
          catalogKey: "contentTypes",
        },
        {
          name: "status",
          label: "Estado",
          type: "select",
          catalogKey: "contentStatuses",
        },
      ]}
      highlights={[
        { label: "Noticia", tone: "info" },
        { label: "Reporte", tone: "neutral" },
        { label: "En revision", tone: "warning" },
        { label: "Publicado", tone: "success" },
      ]}
      loader={getContentItems}
      title="Contenido editorial"
    />
  );
}

export default ContentPage;

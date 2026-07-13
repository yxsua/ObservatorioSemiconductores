import DashboardOverview from "../../components/DashboardOverview";
import PageCard from "../../components/PageCard";
import navigationItems from "../../routes/navigation";

function DashboardHome() {
  const modules = navigationItems.filter((item) => item.path !== "/" && item.path !== "/dashboard");

  return (
    <section className="page-section">
      <p className="eyebrow">Dashboard</p>
      <h1>Resumen del observatorio</h1>
      <p>Metricas, graficas y eventos recientes obtenidos desde PostgreSQL.</p>

      <DashboardOverview />

      <div className="page-grid page-grid--compact">
        {modules.map((item) => (
          <PageCard
            key={item.path}
            title={item.title}
            description={item.description}
            tag={item.tag}
            to={item.path}
          />
        ))}
      </div>
    </section>
  );
}

export default DashboardHome;

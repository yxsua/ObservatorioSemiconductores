import { useQuery } from "@tanstack/react-query";
import { getViewCount, recordView, type PublicViewResource } from "./views.service";
import styles from "./ViewCounter.module.css";

interface Props {
  id: number;
  resource: PublicViewResource;
}

export function ViewCounter({ id, resource }: Props) {
  const query = useQuery({
    queryKey: ["public-view-count", resource, id],
    queryFn: async ({ signal }) => {
      const key = `observatorio:view:${resource}:${id}`;
      try {
        if (sessionStorage.getItem(key)) return getViewCount(resource, id, signal);
        const count = await recordView(resource, id, signal);
        sessionStorage.setItem(key, "1");
        return count;
      } catch (error) {
        if (signal.aborted) throw error;
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000
  });

  if (query.data === null || query.data === undefined) return null;
  return (
    <span aria-label={`${query.data.toLocaleString("es-MX")} visitas`} className={styles.counter}>
      <span aria-hidden="true" className={styles.icon}>◉</span>
      {query.data.toLocaleString("es-MX")} {query.data === 1 ? "visita" : "visitas"}
    </span>
  );
}

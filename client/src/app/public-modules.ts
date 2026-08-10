export type EditorialModuleSource =
  | { kind: "collection"; contentType: "NEWS" | "NEWSLETTER" | "REPORT" }
  | { kind: "page"; slug: string }
  | { kind: "domain"; resources: readonly ("signals" | "trends" | "alerts")[] };

export interface PublicModule {
  id: string;
  path: string;
  label: string;
  shortLabel: string;
  description: string;
  source: EditorialModuleSource;
  primaryNavigation: boolean;
}

export const PUBLIC_MODULES: readonly PublicModule[] = [
  {
    id: "newsletters",
    path: "/boletines",
    label: "Boletines",
    shortLabel: "Boletines",
    description: "Síntesis periódicas con hallazgos y cambios relevantes del sector.",
    source: { kind: "collection", contentType: "NEWSLETTER" },
    primaryNavigation: true
  },
  {
    id: "news",
    path: "/noticias",
    label: "Noticias",
    shortLabel: "Noticias",
    description: "Acontecimientos recientes y contexto sobre la industria de semiconductores.",
    source: { kind: "collection", contentType: "NEWS" },
    primaryNavigation: true
  },
  {
    id: "regional-ecosystem",
    path: "/ecosistema-regional",
    label: "Ecosistema regional",
    shortLabel: "Ecosistema",
    description: "Capacidades, instituciones y actores que conforman el ecosistema regional.",
    source: { kind: "page", slug: "ecosistema-regional" },
    primaryNavigation: true
  },
  {
    id: "publications",
    path: "/publicaciones",
    label: "Publicaciones e informes",
    shortLabel: "Publicaciones",
    description: "Reportes, estudios y documentos especializados producidos por el observatorio.",
    source: { kind: "collection", contentType: "REPORT" },
    primaryNavigation: true
  },
  {
    id: "industry",
    path: "/industria",
    label: "Industria de semiconductores",
    shortLabel: "Industria",
    description: "Conceptos, cadena de valor y fundamentos para comprender la industria.",
    source: { kind: "page", slug: "industria-de-semiconductores" },
    primaryNavigation: false
  },
  {
    id: "surveillance",
    path: "/vigilancia",
    label: "Vigilancia tecnológica",
    shortLabel: "Vigilancia",
    description: "Evidencia validada para seguir señales, tendencias y alertas tempranas.",
    source: { kind: "domain", resources: ["signals", "trends", "alerts"] },
    primaryNavigation: true
  }
] as const;

export const PRIMARY_PUBLIC_MODULES = PUBLIC_MODULES.filter(
  (module) => module.primaryNavigation
);

export function findPublicModule(id: string) {
  return PUBLIC_MODULES.find((module) => module.id === id);
}

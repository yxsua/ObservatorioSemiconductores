import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { PUBLIC_MODULES } from "@/app/public-modules";

const SITE_NAME = "Observatorio de Semiconductores";
const DEFAULT_DESCRIPTION =
  "Información estratégica, publicaciones y vigilancia tecnológica sobre la industria de semiconductores.";

const routeMetadata: Record<string, { title: string; description: string }> = {
  '/dashboard':{title:'Dashboard ejecutivo',description:'Indicadores publicados con metodología y fuente.'},
  '/indicadores-pertinencia':{title:'Indicadores de pertinencia',description:'Datos y evaluaciones de pertinencia regional.'},
  '/inversiones':{title:'Inversiones y expansión',description:'Proyectos anunciados y operaciones con fuente y corte.'},
  '/eventos':{title:'Eventos y convocatorias',description:'Agenda publicada del ecosistema.'},
  '/recursos':{title:'Recursos y bases de datos',description:'Fuentes y recursos de consulta.'},
  '/buscador':{title:'Buscador inteligente',description:'Búsqueda unificada de información pública del observatorio.'},
  "/": { title: SITE_NAME, description: DEFAULT_DESCRIPTION },
  "/contenido": {
    title: "Contenido publicado",
    description: "Explora todo el conocimiento publicado por el Observatorio de Semiconductores."
  },
  "/senales": {
    title: "Señales",
    description: "Consulta acontecimientos verificados que pueden anticipar cambios en el sector."
  },
  "/tendencias": {
    title: "Tendencias",
    description: "Consulta patrones emergentes, en consolidación o consolidados a partir de señales validadas."
  },
  "/alertas": {
    title: "Alertas",
    description: "Consulta alertas publicadas y sus implicaciones para audiencias relevantes."
  },
  "/acerca-de": {
    title: "Acerca del observatorio",
    description: "Conoce el propósito, el equipo, la gobernanza y los principios del Observatorio de Semiconductores."
  },
  "/iniciar-sesion": { title: "Iniciar sesión", description: "Accede a tu cuenta del observatorio." },
  '/terminos':{title:'Términos de servicio',description:'Condiciones de uso de la plataforma.'},
  '/privacidad':{title:'Política de privacidad',description:'Datos, finalidades y derechos de las personas usuarias.'},
  '/recuperar-contrasena':{title:'Recuperar contraseña',description:'Solicita recuperar el acceso a tu cuenta.'},
  '/restablecer-contrasena':{title:'Restablecer contraseña',description:'Crea una nueva contraseña.'},
  "/registro": { title: "Crear cuenta", description: "Crea una cuenta para utilizar funciones registradas." },
  "/cuenta": { title: "Mi cuenta", description: "Consulta tu perfil y permisos actuales." },
  "/cuenta/exportaciones": {
    title: "Mis exportaciones",
    description: "Consulta el historial de exportaciones de tu cuenta."
  },
  "/sin-permiso": { title: "Permiso insuficiente", description: DEFAULT_DESCRIPTION }
};

for (const module of PUBLIC_MODULES) {
  routeMetadata[module.path] = {
    title: module.label,
    description: module.description
  };
}

function metadataFor(pathname: string) {
  if(pathname.startsWith('/datos/')) return {title:'Ficha del observatorio',description:DEFAULT_DESCRIPTION};
  if (routeMetadata[pathname]) return routeMetadata[pathname];
  if (pathname.startsWith("/contenido/")) return {
    title: "Contenido publicado",
    description: DEFAULT_DESCRIPTION
  };
  if (/^\/(senales|tendencias|alertas)\//.test(pathname)) return {
    title: "Vigilancia tecnológica",
    description: DEFAULT_DESCRIPTION
  };
  return { title: "Página no encontrada", description: DEFAULT_DESCRIPTION };
}

export function RouteMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const metadata = metadataFor(pathname);
    document.title = metadata.title === SITE_NAME
      ? SITE_NAME
      : `${metadata.title} | ${SITE_NAME}`;

    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.append(description);
    }
    description.content = metadata.description;
  }, [pathname]);

  return null;
}

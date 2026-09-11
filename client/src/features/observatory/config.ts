export type Domain = "indicators" | "ecosystem" | "investments" | "events" | "resources";
export type DetailField = { key: string; label: string; type?: "number" | "date" | "datetime-local" | "url" | "textarea"; optional?: boolean; options?: readonly (readonly [string,string])[] };
export const NATURES = [["OBSERVED","Observado"],["ESTIMATE","Estimación"],["PROJECTION","Proyección"]] as const;
export const DOMAINS: Record<Domain,{ title:string; path:string; fields:DetailField[] }> = {
  indicators: {title:"Indicadores de pertinencia",path:"/indicadores-pertinencia",fields:[
    {key:"series_code",label:"Clave de la serie (mayúsculas, números y guion bajo)"},
    {key:"dimension",label:"Dimensión",options:[["ECONOMIC","Económica"],["TECHNOLOGICAL","Tecnológica"],["SOCIAL","Social"],["REGULATORY","Normativa"],["SUSTAINABILITY","Sostenible"]]},
    {key:"period",label:"Año del dato",type:"number"},{key:"value",label:"Valor o límite inferior",type:"number",optional:true},
    {key:"upper_value",label:"Límite superior",type:"number",optional:true},{key:"assessment",label:"Evaluación cualitativa (si no hay cifra)",optional:true},
    {key:"unit",label:"Unidad"},{key:"nature",label:"Naturaleza del dato",options:NATURES},
    {key:"geography",label:"Cobertura geográfica"},{key:"methodology",label:"Metodología y supuestos",type:"textarea"}
  ]},
  ecosystem:{title:"Ecosistema regional",path:"/ecosistema-regional",fields:[
    {key:"actor_type",label:"Tipo de actor",options:[["COMPANY","Empresa"],["ACADEMIA","Academia"],["RESEARCH","Investigación"],["GOVERNMENT","Gobierno"],["CLUSTER","Clúster"]]},
    {key:"location",label:"Ubicación"},{key:"website",label:"Sitio web",type:"url",optional:true},
    {key:"capabilities",label:"Capacidades",type:"textarea"},{key:"value_chain_stage",label:"Etapa de la cadena de valor"}
  ]},
  investments:{title:"Inversiones y expansión",path:"/inversiones",fields:[
    {key:"organization",label:"Organización"},{key:"location",label:"Ubicación"},
    {key:"stage",label:"Estado del proyecto",options:[["ANNOUNCED","Anunciado"],["IN_PROGRESS","En desarrollo"],["OPERATING","En operación"],["CANCELLED","Cancelado"]]},
    {key:"amount",label:"Monto anunciado (unidades monetarias)",type:"number",optional:true},{key:"currency",label:"Moneda (USD, MXN…)"},
    {key:"announced_on",label:"Fecha exacta del anuncio, si se conoce",type:"date",optional:true},{key:"jobs",label:"Empleos anunciados",type:"number",optional:true}
  ]},
  events:{title:"Eventos y convocatorias",path:"/eventos",fields:[
    {key:"starts_at",label:"Inicio (hora local)",type:"datetime-local"},{key:"ends_at",label:"Fin (hora local)",type:"datetime-local"},
    {key:"organizer",label:"Organizador"},{key:"location",label:"Lugar o modalidad"},{key:"registration_url",label:"Inscripción",type:"url",optional:true}
  ]},
  resources:{title:"Recursos y bases de datos",path:"/recursos",fields:[
    {key:"resource_type",label:"Tipo de recurso",options:[["DATASET","Base de datos"],["REPORT","Informe"],["TOOL","Herramienta"],["TRAINING","Formación"],["WEBSITE","Sitio web"]]},
    {key:"url",label:"Enlace",type:"url"},{key:"format",label:"Formato"},{key:"license",label:"Licencia o condiciones de uso",optional:true}
  ]}
};
export const STATUS:Record<string,string>={DRAFT:"Borrador",IN_REVIEW:"En revisión",APPROVED:"Aprobado",PUBLISHED:"Publicado",ARCHIVED:"Archivado"};
export function isDomain(value:string|undefined):value is Domain {return Boolean(value && Object.hasOwn(DOMAINS,value));}
export function displayValue(field:DetailField,value:unknown) {
  if(value===null||value===undefined||value==='') return 'No especificado';
  if(field.options) return field.options.find(([code])=>code===value)?.[1]??String(value);
  if(field.type==='datetime-local') return new Date(String(value)).toLocaleString('es-MX');
  if(typeof value==='number') return value.toLocaleString('es-MX',{maximumFractionDigits:6});
  return String(value);
}

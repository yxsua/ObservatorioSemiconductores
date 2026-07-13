import type { TransitionOption } from "../types";

const transition=(code:string,label:string,description:string,permission:string,tone?:"danger"|"primary"):TransitionOption=>({code,label,description,permission,tone});

export function contentTransitionOptions(status:string){
  if(status==="DRAFT")return[transition("SUBMIT_FOR_REVIEW","Enviar a revisión","Requiere al menos una sección y un bloque visibles.","content:submit","primary")];
  if(status==="UNDER_REVIEW")return[transition("REQUEST_CHANGES","Solicitar cambios","Devuelve la versión a borrador.","content:approve"),transition("APPROVE","Aprobar","Confirma la versión completa; el aprobador debe ser distinto del editor.","content:approve","primary")];
  if(status==="APPROVED")return[transition("REOPEN","Reabrir revisión","Devuelve el contenido a revisión.","content:approve"),transition("PUBLISH","Publicar","Sustituye la versión pública vigente y hace visible este contenido.","content:publish","primary")];
  if(status==="PUBLISHED")return[transition("ARCHIVE","Archivar","Retira la publicación del índice público.","content:archive","danger")];
  return[];
}

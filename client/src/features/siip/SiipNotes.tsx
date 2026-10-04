import {readSupport} from './notes';
export function SiipNotes({value}:{value:string}){
 const {notes,support}=readSupport(value);
 return <>{notes&&<p style={{whiteSpace:'pre-wrap'}}>{notes}</p>}{(support.direct.length>0||support.complementary.length>0||support.reference||support.source)&&<section><h4>Soporte SIIP</h4><dl><dt>Indicadores · aportación directa</dt><dd>{support.direct.join(', ')||'Sin relación'}</dd><dt>Indicadores · aportación complementaria</dt><dd>{support.complementary.join(', ')||'Sin relación'}</dd>{support.source&&<><dt>Referencia del inventario</dt><dd>{support.source}</dd></>}{support.reference&&<><dt>Evidencia específica</dt><dd style={{whiteSpace:'pre-wrap'}}>{support.reference}</dd></>}</dl></section>}</>;
}

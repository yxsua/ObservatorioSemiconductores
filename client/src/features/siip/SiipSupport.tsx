import catalog from './catalog.json';
import {readSupport,writeSupport,type SiipSupport as Support} from './notes';
export function SiipSupport({value,onChange}:{value:string;onChange:(value:string)=>void}) {
 const {support}=readSupport(value);
 const update=(next:Partial<Support>)=>onChange(writeSupport(value,{...support,...next}));
 const source=catalog.sources.find(s=>s.id===support.source);
 return <details><summary>Vinculación con SIIP (opcional) · {support.direct.length+support.complementary.length} relaciones</summary>
 <p>Identifica los indicadores que sustenta esta señal. Esta clasificación no cambia su FCV ni su valoración.</p>
 <label>Referencia del inventario de fuentes<select value={support.source} onChange={e=>update({source:e.target.value})}><option value="">Sin referencia</option>{catalog.sources.map(s=><option key={s.id} value={s.id}>{s.id} · {s.name}</option>)}</select></label>
 {source&&<p>Sugerencias del inventario: directas {source.direct.join(', ')||'ninguna'}; complementarias {source.complementary.join(', ')||'ninguna'}. Confirma las que respalda la evidencia concreta. Cambiar esta referencia no cambia la fuente de la señal ni las relaciones seleccionadas.</p>}
 <div style={{maxHeight:'20rem',overflowY:'auto'}}>{catalog.indicators.map(ind=><label key={ind.code} style={{display:'block',marginBlock:8}}>{ind.code} · {ind.name} ({ind.dimension}) <select aria-label={`Aportación a ${ind.code}`} value={support.direct.includes(ind.code)?'direct':support.complementary.includes(ind.code)?'complementary':''} onChange={e=>update({direct:[...support.direct.filter(c=>c!==ind.code),...(e.target.value==='direct'?[ind.code]:[])],complementary:[...support.complementary.filter(c=>c!==ind.code),...(e.target.value==='complementary'?[ind.code]:[])]})}><option value="">Sin relación</option><option value="direct">Directa</option><option value="complementary">Complementaria</option></select></label>)}</div>
 <label>Referencia específica de la evidencia<textarea rows={3} maxLength={2500} value={support.reference} onChange={e=>update({reference:e.target.value})} placeholder="Documento, tabla o dato; periodo, unidad y fecha de consulta, cuando corresponda."/></label>
 <p>Esta información se conserva en las notas internas para revisión; no se publica. Límite compartido con las notas: 5000 caracteres.</p>
 </details>;
}

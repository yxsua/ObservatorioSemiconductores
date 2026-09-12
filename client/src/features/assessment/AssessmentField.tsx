import {useRef,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {apiRequest} from '@/api';
import {ASSESSMENT_VERSION,LEVEL_NAMES,alertAssessmentSchema,signalAssessmentSchema,assessmentSummary,type Assessment,type Methodology,type SignalAssessment} from './assessment';
import styles from './AssessmentField.module.css';

export function AssessmentField({kind,value,onChange,error,readOnly=false}:{kind:'signal'|'alert';value:Assessment|null;onChange:(value:Assessment)=>void;error?:string;readOnly?:boolean}){
 const dialog=useRef<HTMLDialogElement>(null),button=useRef<HTMLButtonElement>(null);
 const [draft,setDraft]=useState<Assessment|null>(null),[invalid,setInvalid]=useState(false);
 const query=useQuery({queryKey:['assessment-methodology'],queryFn:({signal})=>apiRequest<{data:Methodology}>('/catalogs/assessment-methodology',{signal}),staleTime:Infinity});
 const method=query.data?.data;
 const schema=kind==='signal'?signalAssessmentSchema:alertAssessmentSchema;
 const complete=draft&&schema.safeParse(draft).success;
 const saved=value&&method&&schema.safeParse(value).success?assessmentSummary(kind,value,method):null;
 const summary=complete&&method?assessmentSummary(kind,draft,method):null;
 const close=()=>{dialog.current?.close();button.current?.focus();};
 const open=()=>{setDraft(value?structuredClone(value):{version:ASSESSMENT_VERSION,impact:Array(kind==='signal'?5:4).fill(-1),urgency:Array(kind==='signal'?5:4).fill(-1),...(kind==='signal'?{reliability:Array(19).fill('')}: {})} as Assessment);setInvalid(false);dialog.current?.showModal();};
 const setPoint=(section:'impact'|'urgency',i:number,v:number)=>setDraft(current=>current?{...current,[section]:current[section].map((x,j)=>j===i?v:x)}:current);
 return <section className={styles.container} aria-label="Valoración metodológica">
  <div className={styles.overview}><div><h2>Valoración</h2><p>{saved?`Impacto ${LEVEL_NAMES[saved.impactLevel]} · Urgencia ${LEVEL_NAMES[saved.urgencyLevel].replace(/o$/, 'a')} · ${saved.final}`:'Completa los criterios para obtener la valoración.'}</p>{value===null&&<small>Los registros anteriores conservan sus niveles hasta que se capture una nueva valoración.</small>}</div><button ref={button} type="button" disabled={!method} onClick={open}>{value?'Revisar valoración':'Capturar valoración'}</button></div>
  {query.isError&&<p role="alert">No se pudo cargar la metodología. <button type="button" onClick={()=>void query.refetch()}>Reintentar</button></p>}
  {query.isPending&&<p>Cargando criterios de valoración…</p>}{error&&<p role="alert">{error}</p>}
  <dialog ref={dialog} className={styles.dialog} aria-labelledby={`assessment-title-${kind}`} onCancel={close} onClose={()=>button.current?.focus()}>
   <header className={styles.header}><div><h2 id={`assessment-title-${kind}`}>Valoración de {kind==='signal'?'la señal':'la alerta'}</h2><p>{kind==='signal'?'Califica impacto y urgencia de 0 a 2; verifica la confiabilidad de la evidencia.':'Califica el impacto y la urgencia estratégicos de 1 a 5.'}</p></div><button type="button" onClick={close} aria-label="Cerrar valoración">Cerrar</button></header>
   {draft&&method&&<div className={styles.body}>
    {(['impact','urgency'] as const).map(section=><fieldset key={section} disabled={readOnly}><legend>{section==='impact'?'Impacto':'Urgencia'}{kind==='alert'?' estratégico':''}</legend>
     {kind==='alert'&&<details><summary>Guía de puntuación</summary>{method.alert[section==='impact'?'impactScale':'urgencyScale'].map(item=><p key={item.label}><strong>{item.label}</strong> — {item.help}</p>)}</details>}
     {method[kind][section].map((criterion,i)=><div className={styles.criterion} key={criterion.label}><label htmlFor={`${kind}-${section}-${i}`}><strong>{criterion.label}</strong><span>{criterion.help}</span></label><select id={`${kind}-${section}-${i}`} value={draft[section][i]} onChange={e=>setPoint(section,i,Number(e.target.value))}><option value={-1}>Sin responder</option>{(kind==='signal'?[0,1,2]:[1,2,3,4,5]).map(n=><option key={n} value={n}>{n}</option>)}</select></div>)}
     <p className={styles.score} aria-live="polite">{draft[section].every(n=>n>=0)?(()=>{const total=draft[section].reduce((a,b)=>a+b,0);const level=total<=(kind==='signal'?3:8)?1:total<=(kind==='signal'?7:14)?2:3;return `Puntaje: ${total} / ${kind==='signal'?10:20} · Nivel ${LEVEL_NAMES[level]}`;})():'Responde todos los criterios de esta sección.'}</p>
    </fieldset>)}
    {kind==='signal'&&<fieldset disabled={readOnly}><legend>Confiabilidad de la evidencia</legend><p>«No aplica» excluye el peso del denominador; «No cumple» conserva ese peso sin sumar puntos.</p>{method.signal.reliability.map((criterion,i)=><div key={criterion.label}>{(i===0||criterion.section!==method.signal.reliability[i-1].section)&&<h3>{criterion.section}</h3>}<div className={styles.criterion}><label htmlFor={`reliability-${i}`}><strong>{criterion.label} · Peso {criterion.weight}</strong><span>{criterion.help}</span></label><select id={`reliability-${i}`} value={(draft as SignalAssessment).reliability[i]} onChange={e=>{const next=e.target.value as 'YES'|'NO'|'NA';setDraft({...draft,reliability:(draft as SignalAssessment).reliability.map((v,j)=>i===j?next:v)});}}><option value="">Sin responder</option><option value="YES">Aplica y cumple</option><option value="NO">Aplica y no cumple</option><option value="NA">No aplica</option></select></div></div>)}</fieldset>}
   </div>}
   <footer className={styles.footer}><div aria-live="polite">{summary?<><strong>{summary.final}</strong><span>Impacto {LEVEL_NAMES[summary.impactLevel]} · Urgencia {LEVEL_NAMES[summary.urgencyLevel].replace(/o$/, 'a')}</span>{'percent' in summary&&summary.percent!==undefined&&<span>Confiabilidad: {summary.obtained}/{summary.maximum} · {summary.percent.toFixed(1)} % · {LEVEL_NAMES[summary.reliabilityLevel!].replace(/o$/, 'a')}</span>}</>:<span>Valoración incompleta</span>}{invalid&&<p role="alert">{kind==='signal'?'Responde todos los criterios y conserva al menos uno aplicable en confiabilidad.':'Responde todos los criterios de impacto y urgencia.'}</p>}</div><div className={styles.actions}><button type="button" onClick={close}>Cancelar</button><button type="button" disabled={readOnly} onClick={()=>{if(!draft||!schema.safeParse(draft).success){setInvalid(true);return;}onChange(draft);close();}}>Aplicar valoración</button></div></footer>
  </dialog>
 </section>;
}

import {useState,useRef,useEffect,type FormEvent} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Link,useParams,useSearchParams} from 'react-router-dom';
import {PageFeedback} from '@/components/feedback/PageFeedback';
import {useAuth} from '@/features/auth/AuthContext';
import {apiDownload,saveBlob} from '@/api';
import {DOMAINS,displayValue,isDomain,type Domain} from './config';
import {getRecord,listRecords,type DataRecord} from './service';
import styles from './Observatory.module.css';

export function RecordMetadata({record}:{record:DataRecord}) {return <div className={styles.meta}>
  <p>Fuente: {record.sourceUrl?<a href={record.sourceUrl} target="_blank" rel="noreferrer">{record.sourceName}</a>:record.sourceName}<br/>Corte: {record.asOf} · Responsable: {record.responsible}</p>
  {record.tags.includes('histórico')&&<p className={styles.notice}>Contenido histórico conservado del portal. La fecha de corte identifica su versión; no implica una nueva verificación de la fuente.</p>}
</div>;}
export function RecordDetails({record}:{record:DataRecord}) {return <dl className={styles.details}>{DOMAINS[record.kind].fields.map(field=><div key={field.key} style={{display:'contents'}}><dt>{field.label.replace(' (hora local)','')}</dt><dd>{field.type==='url'&&record.details[field.key]?<a href={String(record.details[field.key])} target="_blank" rel="noreferrer">Consultar enlace</a>:displayValue(field,record.details[field.key])}</dd></div>)}</dl>;}
export function EventPhoto({record}:{record:DataRecord}) {return record.kind==='events'&&record.photo?<img className={styles.eventPhoto} src={record.photo.url} alt={record.photo.altText} loading="lazy"/>:null;}
function RecordOverlay({kind,id,onClose}:{kind:Domain;id:string;onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const element=dialog.current!;const previous=document.body.style.overflow;element.showModal();document.body.style.overflow='hidden';return()=>{element.close();document.body.style.overflow=previous;};},[]);
  return <dialog ref={dialog} className={styles.overlay} aria-label="Ficha completa" onClose={event=>{
    // A queued close from StrictMode cleanup can arrive after showModal reopens the dialog.
    if(!event.currentTarget.open)onClose();
  }}><div className={styles.overlayBar}><button autoFocus onClick={()=>dialog.current?.close()}>Cerrar</button></div><Detail kind={kind} id={id} overlay/></dialog>;
}
export function DataListPage({kind}:{kind:Domain}) {
  const [selected,setSelected]=useState<string|null>(null);
  const compact=kind==='indicators'||kind==='ecosystem'||kind==='investments';
  const [params,setParams]=useSearchParams(); const [search,setSearch]=useState(params.get('search')??'');
  const page=Math.max(1,Number(params.get('page'))||1);const filters=new URLSearchParams({page:String(page)});
  if(params.get('search'))filters.set('search',params.get('search')!);
  const query=useQuery({queryKey:['public-data',kind,filters.toString()],queryFn:({signal})=>listRecords(kind,filters,null,signal)});
  function submit(event:FormEvent){event.preventDefault();setParams(search.trim()?{search:search.trim()}:{});}
  return <section className={styles.page}><header className={styles.hero}><p>Datos del Observatorio</p><h1>{DOMAINS[kind].title}</h1><p>Consulta registros publicados con fuente, fecha de corte y responsable. Los anuncios y las proyecciones se distinguen de los resultados observados.</p></header>
    <form onSubmit={submit} className={styles.filters}><label>Buscar en este módulo<input value={search} onChange={e=>setSearch(e.target.value)} minLength={2}/></label><button>Buscar</button></form>
    {query.isPending?<PageFeedback title="Cargando datos" message="Consultando registros publicados."/>:query.isError?<PageFeedback title="Datos no disponibles" message="No fue posible consultar este módulo." actionLabel="Reintentar" onAction={()=>void query.refetch()}/>:<>
      <p role="status">{query.data.pagination.totalItems} registros encontrados.</p>
      <div className={styles.grid}>{query.data.items.map(record=><article className={styles.card} key={record.id}><h2><Link to={`/datos/${kind}/${record.id}`}>{record.title}</Link></h2><EventPhoto record={record}/><p className={compact?styles.summary:undefined}>{record.summary}</p>{compact?<><p className={styles.meta}>Corte: {record.asOf}</p><button className={styles.more} onClick={()=>setSelected(String(record.id))} aria-label={`Ver más sobre ${record.title}`}>Ver más</button></>:<><RecordDetails record={record}/><RecordMetadata record={record}/></>}</article>)}</div>
      {!query.data.items.length&&<p className={styles.notice}>No hay registros públicos para esta consulta.</p>}
      <div className={styles.actions}><button disabled={page<=1} onClick={()=>{const next=new URLSearchParams(params);next.set('page',String(page-1));setParams(next);}}>Anterior</button><span>Página {page}</span><button disabled={page>=query.data.pagination.totalPages} onClick={()=>{const next=new URLSearchParams(params);next.set('page',String(page+1));setParams(next);}}>Siguiente</button></div>
    </>}
    {selected&&<RecordOverlay key={`${kind}-${selected}`} kind={kind} id={selected} onClose={()=>setSelected(null)}/>}
  </section>;
}
export function DataDetailPage(){const {kind,id}=useParams();return isDomain(kind)&&id&&/^\d+$/.test(id)?<Detail kind={kind} id={id}/>:<PageFeedback title="Registro no disponible" message="La dirección no es válida."/>;}
function Detail({kind,id,overlay=false}:{kind:Domain;id:string;overlay?:boolean}) {
  const query=useQuery({queryKey:['public-data',kind,id],queryFn:({signal})=>getRecord(kind,id,null,signal)});
  if(query.isPending)return <PageFeedback title="Cargando registro" message="Consultando la ficha."/>;
  if(query.isError)return <PageFeedback title="Registro no disponible" message="Puede haber sido retirado o haber terminado su vigencia."/>;
  const record=query.data;
  return <article className={styles.page}>{!overlay&&<Link to={DOMAINS[kind].path}>← {DOMAINS[kind].title}</Link>}<header className={styles.hero}>{overlay?<h2>{record.title}</h2>:<h1>{record.title}</h1>}<p>{record.summary}</p></header><EventPhoto record={record}/><RecordDetails record={record}/><RecordMetadata record={record}/>
    <div>{record.tags.map(tag=><span className={styles.badge} key={tag}>{tag}</span>)}</div>
    {(record.validFrom||record.validUntil)&&<p>Vigencia: {record.validFrom??'sin inicio definido'} — {record.validUntil??'sin fin definido'}</p>}
    <section><h2>Evidencia y archivos</h2><ul>{record.signalIds.map(id=><li key={`s${id}`}><Link to={`/senales/${id}`}>Consultar señal #{id}</Link></li>)}{record.trendIds.map(id=><li key={`t${id}`}><Link to={`/tendencias/${id}`}>Consultar tendencia #{id}</Link></li>)}{record.mediaIds.map(id=><li key={`m${id}`}><Attachment id={id} returnTo={`/datos/${kind}/${record.id}`}/></li>)}</ul>{!record.signalIds.length&&!record.trendIds.length&&!record.mediaIds.length&&<p>No se han asociado archivos ni registros de vigilancia.</p>}</section>
  </article>;
}
function Attachment({id,returnTo}:{id:number;returnTo:string}){
  const auth=useAuth();const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  async function download(){setBusy(true);setError('');try{const result=await apiDownload(`/media/${id}/download`,`archivo-${id}`,{token:auth.token});saveBlob(result.blob,result.filename);}catch{setError('No fue posible descargar el archivo. Comprueba tus permisos.');}finally{setBusy(false);}}
  return <>{auth.token?<button disabled={busy} onClick={()=>void download()}>Descargar archivo #{id}</button>:<Link to="/iniciar-sesion" state={{returnTo}}>Inicia sesión para descargar el archivo #{id}</Link>}{error&&<span role="alert">{error}</span>}</>;
}

import {useEffect,useState,type FormEvent} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Link,useSearchParams} from 'react-router-dom';
import {PageFeedback} from '@/components/feedback/PageFeedback';
import {DOMAINS} from './config';
import {request,type SearchPage as SearchResponse} from './service';
import styles from './Observatory.module.css';
const types:Record<string,string>={content:'Noticias y publicaciones',signal:'Señales',trend:'Tendencias',alert:'Alertas',...Object.fromEntries(Object.entries(DOMAINS).map(([key,v])=>[key,v.title]))};
export function SearchPage(){
  const [params,setParams]=useSearchParams();const [q,setQ]=useState(params.get('q')??'');const current=params.get('q')??'';
  useEffect(()=>setQ(current),[current]);
  const valid=current.trim().length>=2;const page=Math.max(1,Number(params.get('page'))||1);
  const apiParams=new URLSearchParams();for(const key of ['q','type','from','to','page'])if(params.get(key))apiParams.set(key,params.get(key)!);
  const query=useQuery({queryKey:['public-search',apiParams.toString()],queryFn:({signal})=>request<SearchResponse>(`/search?${apiParams}`,null,undefined,'GET',signal),enabled:valid});
  function submit(e:FormEvent){e.preventDefault();const next=new URLSearchParams(params);next.set('q',q.trim());next.delete('page');setParams(next);}
  function filter(key:string,value:string){const next=new URLSearchParams(params);if(value)next.set(key,value);else next.delete(key);next.delete('page');setParams(next);}
  return <section className={styles.page}><header className={styles.hero}><p>Consulta transversal</p><h1>Buscador inteligente</h1><p>Busca en noticias, publicaciones, señales, tendencias, alertas y los nuevos módulos de datos.</p></header>
    <form className={styles.filters} onSubmit={submit}><label>Tema o palabras clave<input value={q} onChange={e=>setQ(e.target.value)} required minLength={2} maxLength={200}/></label><button>Buscar</button></form>
    <div className={styles.filters}><label>Tipo de resultado<select value={params.get('type')??''} onChange={e=>filter('type',e.target.value)}><option value="">Todos</option>{Object.entries(types).map(([key,label])=><option key={key} value={key}>{label}{query.data?` (${query.data.facets[key]??0})`:''}</option>)}</select></label><label>Desde<input type="date" value={params.get('from')??''} onChange={e=>filter('from',e.target.value)}/></label><label>Hasta<input type="date" value={params.get('to')??''} onChange={e=>filter('to',e.target.value)}/></label></div>
    {!valid?<p className={styles.notice}>Escribe al menos dos caracteres para consultar el índice público.</p>:query.isPending?<PageFeedback title="Buscando" message="Consultando información pública."/>:query.isError?<PageFeedback title="Búsqueda no disponible" message="Revisa los filtros e intenta de nuevo." actionLabel="Reintentar" onAction={()=>void query.refetch()}/>:<>
      <p role="status">{query.data.pagination.totalItems} resultados para «{current}».</p>
      {query.data.items.map(item=><article className={styles.card} key={`${item.type}-${item.id}`}><span className={styles.badge}>{types[item.type]??item.type}</span><h2><Link to={item.url}>{item.title}</Link></h2><p>{item.summary}</p><p className={styles.meta}>Fecha de publicación o corte: {item.date??'no especificada'}</p></article>)}
      {!query.data.items.length&&<p className={styles.notice}>No hay resultados. Prueba otro término o amplía el periodo.</p>}
      <div className={styles.actions}><button disabled={page<=1} onClick={()=>{const next=new URLSearchParams(params);next.set('page',String(page-1));setParams(next);}}>Anterior</button><span>Página {page}</span><button disabled={page>=query.data.pagination.totalPages} onClick={()=>{const next=new URLSearchParams(params);next.set('page',String(page+1));setParams(next);}}>Siguiente</button></div>
    </>}
  </section>;
}

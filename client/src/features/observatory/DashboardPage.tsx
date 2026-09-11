import {useQuery} from '@tanstack/react-query';
import {Link,useSearchParams} from 'react-router-dom';
import {PageFeedback} from '@/components/feedback/PageFeedback';
import {DOMAINS,NATURES,type Domain} from './config';
import {request,type Dashboard,type DataRecord} from './service';
import {RecordMetadata} from './PublicDataPage';
import styles from './Observatory.module.css';

export function DashboardPage(){
  const [params,setParams]=useSearchParams();const period=params.get('period')??'';
  const suffix=period?`?period=${encodeURIComponent(period)}`:'';
  const query=useQuery({queryKey:['dashboard',period],queryFn:({signal})=>request<Dashboard>(`/dashboard${suffix}`,null,undefined,'GET',signal)});
  const observations=query.data?.observations??[];
  const groups=new Map<string,DataRecord[]>();
  observations.filter(r=>r.details.value!==null).forEach(r=>{const key=JSON.stringify([r.details.series_code,r.details.unit,r.details.geography]);groups.set(key,[...(groups.get(key)??[]),r]);});
  return <section className={styles.page}><header className={styles.hero}><p>Datos publicados</p><h1>Dashboard ejecutivo</h1><p>Indicadores con fuente y metodología. Las proyecciones describen escenarios; las estimaciones no equivalen a resultados observados.</p></header>
    <div className={styles.filters}><label>Periodo<select value={period} onChange={e=>setParams(e.target.value?{period:e.target.value}:{})}><option value="">Todos los periodos</option>{query.data?.periods.map(year=><option key={year}>{year}</option>)}</select></label>{query.data&&<a href={`/api/dashboard.csv${suffix}`} className={styles.link}>Descargar tabla CSV</a>}</div>
    {query.isPending?<PageFeedback title="Cargando indicadores" message="Consultando datos publicados."/>:query.isError?<PageFeedback title="Dashboard no disponible" message="No fue posible recuperar los indicadores." actionLabel="Reintentar" onAction={()=>void query.refetch()}/>:<>
      <p className={styles.meta}>Última modificación de datos públicos: {query.data.updatedAt?new Date(query.data.updatedAt).toLocaleString('es-MX'):'sin registros'}</p>
      <div className={styles.grid}>{(Object.entries(DOMAINS) as [Domain,typeof DOMAINS[Domain]][]).map(([kind,config])=><Link className={`${styles.card} ${styles.metric}`} key={kind} to={config.path}><strong>{query.data.counts[kind]??0}</strong>{config.title}<p className={styles.meta}>Fichas públicas vigentes · todos los periodos</p></Link>)}</div>
      {!observations.length&&<p role="status" className={styles.notice}>No hay indicadores publicados para este periodo.</p>}
      {[...groups.entries()].map(([key,rows])=>{
        const min=Math.min(0,...rows.map(r=>Number(r.details.value)));const max=Math.max(0,...rows.map(r=>Number(r.details.upper_value??r.details.value)));const span=max-min||1;
        const x=(v:number)=>40+(v-min)/span*520;const zero=x(0);
        return <section className={styles.card} key={key}><h2>{String(rows[0].details.series_code)} · {String(rows[0].details.geography)}</h2><p>{String(rows[0].details.unit)} · Escala común para esta serie</p>{rows.map(r=><div key={r.id}><h3>{r.title} · {r.details.period}</h3><p>{NATURES.find(([code])=>code===r.details.nature)?.[1]}</p><svg className={styles.chart} viewBox="0 0 600 76" role="img" aria-label={`${r.title}: ${r.details.value}${r.details.upper_value!==null?` a ${r.details.upper_value}`:''} ${r.details.unit}`}>
          <line x1={zero} y1="4" x2={zero} y2="51" stroke="#456"/>
          {[r.details.value,r.details.upper_value].filter(v=>v!==null).map((v,i)=><rect key={i} x={Math.min(zero,x(Number(v)))} y={8+i*22} width={Math.max(1,Math.abs(x(Number(v))-zero))} height="16" fill={i?'#67a8b7':'#07586d'}/>)}
          <text x="40" y="70" fontSize="11">{min.toLocaleString('es-MX')}</text><text x="560" y="70" textAnchor="end" fontSize="11">{max.toLocaleString('es-MX')}</text>
        </svg><p>{Number(r.details.value).toLocaleString('es-MX')}{r.details.upper_value!==null?` — ${Number(r.details.upper_value).toLocaleString('es-MX')}`:''} {String(r.details.unit)}</p><p>{String(r.details.methodology)}</p><RecordMetadata record={r}/></div>)}</section>;
      })}
      <div className={styles.table}><table><caption>Tabla de indicadores y evaluaciones publicadas</caption><thead><tr><th>Indicador</th><th>Periodo</th><th>Valor / evaluación</th><th>Unidad</th><th>Naturaleza</th><th>Fuente y corte</th><th>Metodología</th></tr></thead><tbody>{observations.map(r=><tr key={r.id}><th><Link to={`/datos/indicators/${r.id}`}>{r.title}</Link></th><td>{r.details.period}</td><td>{r.details.value===null?r.details.assessment:`${r.details.value}${r.details.upper_value===null?'':` — ${r.details.upper_value}`}`}</td><td>{r.details.unit}</td><td>{NATURES.find(([code])=>code===r.details.nature)?.[1]}</td><td>{r.sourceName}<br/>{r.asOf}</td><td>{r.details.methodology}</td></tr>)}</tbody></table></div>
      <p className={styles.notice}>{query.data.methodology}</p>
    </>}
  </section>;
}

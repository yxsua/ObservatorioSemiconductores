const { z } = require('zod');
const pool = require('../config/database');
const { parse, map } = require('./observatory.service');
const searchTypes=['content','signal','trend','alert','indicators','ecosystem','investments','events','resources'];
const searchSchema=z.object({
    q:z.string().trim().min(2).max(200),type:z.enum(searchTypes).optional(),
    from:z.iso.date().optional(),to:z.iso.date().optional(),
    page:z.coerce.number().int().min(1).max(100000).default(1),pageSize:z.coerce.number().int().min(1).max(100).default(20)
}).strict().refine(v=>!v.from||!v.to||v.to>=v.from,'El periodo no es válido.');
async function search(input) {
    const f=parse(searchSchema,input);
    const values=[f.q,f.from??null,f.to??null];
    const base=`FROM vw_observatory_search WHERE
        (to_tsvector('spanish',title || ' ' || summary) @@ websearch_to_tsquery('spanish',$1)
         OR strpos(lower(title || ' ' || summary),lower($1))>0)
        AND ($2::date IS NULL OR date >= $2) AND ($3::date IS NULL OR date <= $3)`;
    // One statement gives facets and results a consistent snapshot.
    const {rows}=await pool.query(`WITH matched AS (SELECT *,
        ts_rank(to_tsvector('spanish',title || ' ' || summary),websearch_to_tsquery('spanish',$1)) AS rank ${base}),
        filtered AS (SELECT * FROM matched WHERE $4::text IS NULL OR type=$4),
        page AS (SELECT type,id,title,summary,url,date,tags FROM filtered ORDER BY rank DESC,date DESC NULLS LAST,type,id DESC LIMIT $5 OFFSET $6)
        SELECT (SELECT COALESCE(json_agg(page),'[]') FROM page) AS items,
        (SELECT count(*) FROM filtered) AS total,
        (SELECT COALESCE(json_object_agg(type,n),'{}') FROM (SELECT type,count(*) AS n FROM matched GROUP BY type) f) AS facets`,
    [...values,f.type??null,f.pageSize,(f.page-1)*f.pageSize]);
    return {items:rows[0].items.map(r=>({...r,id:Number(r.id)})),facets:rows[0].facets,
        pagination:{page:f.page,pageSize:f.pageSize,totalItems:Number(rows[0].total),totalPages:Math.ceil(Number(rows[0].total)/f.pageSize)}};
}
const dashboardSchema=z.object({period:z.coerce.number().int().min(1900).max(2200).optional()}).strict();
async function dashboard(input) {
    const f=parse(dashboardSchema,input);
    const {rows}=await pool.query(`WITH observations AS (
        SELECT r.*,to_jsonb(i)-'record_id' AS details,i.period
        FROM vw_public_observatory_records r JOIN indicator_observations i ON i.record_id=r.id
    ) SELECT
        (SELECT COALESCE(json_agg(o ORDER BY o.title,o.id),'[]') FROM observations o WHERE $1::int IS NULL OR o.period=$1) AS observations,
        (SELECT COALESCE(json_agg(period ORDER BY period),'[]') FROM (SELECT DISTINCT period FROM observations) p) AS periods,
        (SELECT COALESCE(json_object_agg(kind,n),'{}') FROM (SELECT kind,count(*) AS n FROM vw_public_observatory_records GROUP BY kind) c) AS counts,
        (SELECT max(updated_at) FROM vw_public_observatory_records) AS updated_at`,[f.period??null]);
    const data=rows[0];
    return {schemaVersion:1,period:f.period??null,periods:data.periods,updatedAt:data.updated_at,
        methodology:'Observaciones publicadas por serie, periodo, región y naturaleza. No se suman unidades, estimaciones ni proyecciones distintas. Los totales de fichas representan registros públicos vigentes en todos los periodos.',
        counts:data.counts,observations:data.observations.map(row=>map(row,false))};
}
function csvCell(value) {
    const raw=String(value??'');
    const safe=/^[\s\uFEFF]*[=+@\-]/.test(raw)&& !/^-\d+(\.\d+)?$/.test(raw)?`'${raw}`:raw;
    return `"${safe.replaceAll('"','""')}"`;
}
async function dashboardCsv(input) {
    const data=await dashboard(input);
    const header=['Título','Serie','Periodo','Valor','Límite superior','Evaluación cualitativa','Unidad','Naturaleza','Región','Fuente','URL fuente','Fecha de corte','Metodología'];
    return '\uFEFF'+[header,...data.observations.map(r=>[r.title,r.details.series_code,r.details.period,r.details.value,r.details.upper_value,r.details.assessment,r.details.unit,r.details.nature,r.details.geography,r.sourceName,r.sourceUrl,r.asOf,r.details.methodology])].map(row=>row.map(csvCell).join(',')).join('\r\n');
}
module.exports={search,dashboard,dashboardCsv,searchSchema,csvCell};

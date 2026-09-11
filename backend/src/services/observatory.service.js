const repo = require('../repositories/observatory.repository');
const { definitions, inputSchema, filtersSchema, transitionSchema } = require('../schemas/observatory.schema');
const { ValidationError, ForbiddenError, NotFoundError, ConcurrentModificationError, DomainRuleError } = require('../errors/apiError');
const { formatZodErrors } = require('../utils/zod');
function parse(schema, input) { const r=schema.safeParse(input); if(!r.success) throw new ValidationError('Revisa los datos proporcionados.',formatZodErrors(r.error)); return r.data; }
function kind(value) { if(!Object.hasOwn(definitions,value)) throw new NotFoundError('El dominio no existe.'); return value; }
function id(value) { const n=Number(value); if(!Number.isSafeInteger(n)||n<1) throw new ValidationError('Identificador inválido.'); return n; }
function permission(user, code) { if(!user.permissions?.includes(code)) throw new ForbiddenError(); }
function date(value) { return value instanceof Date ? value.toISOString().slice(0,10) : value; }
function map(row, internal) {
    const details = {...row.details};
    for(const key of ['value','upper_value','amount','jobs','period','photo_media_id']) if(details[key] != null) details[key]=Number(details[key]);
    if(row.kind==='events'&&!internal&&!row.photo_id) details.photo_media_id=null;
    return { photo:row.photo_id?{id:Number(row.photo_id),url:`/api/media/${row.photo_id}`,altText:row.photo_alt||row.title}:null, id:Number(row.id),kind:row.kind,title:row.title,summary:row.summary,sourceName:row.source_name,sourceUrl:row.source_url,
        asOf:date(row.as_of),responsible:row.responsible,validFrom:date(row.valid_from),validUntil:date(row.valid_until),tags:row.tags,
        details,publishedAt:row.published_at,updatedAt:row.updated_at,
        ...(internal?{status:row.status,version:row.version,createdBy:Number(row.created_by),editedBy:Number(row.edited_by)}:{}) };
}
async function get(k,rawId,internal=false) {
    kind(k); const recordId=id(rawId);
    const row=await repo.get(k,recordId);
    if(!row) throw new NotFoundError();
    if(!internal) {
        const result=await repo.pool.query('SELECT id FROM vw_public_observatory_records WHERE id=$1',[recordId]);
        if(!result.rowCount) throw new NotFoundError();
    }
    return {...map(row,internal),...await repo.related(recordId,internal)};
}
async function list(k,query,internal=false) {
    kind(k); const f=parse(filtersSchema,query);
    if(!internal && f.status) throw new ValidationError('El estado es un filtro interno.');
    if(f.period && k!=='indicators') throw new ValidationError('El periodo sólo aplica a indicadores.');
    const result=await repo.list(k,f,internal);
    return {items:result.rows.map(r=>map(r,internal)),pagination:{page:f.page,pageSize:f.pageSize,totalItems:result.total,totalPages:Math.ceil(result.total/f.pageSize)}};
}
async function transaction(work) {
    const db=await repo.pool.connect();
    try { await db.query('BEGIN'); const result=await work(db); await db.query('COMMIT'); return result; }
    catch(error) { await db.query('ROLLBACK'); if(['23503','23514','23505'].includes(error.code)) throw new DomainRuleError('Revisa las relaciones, valores y duplicados del registro.'); throw error; }
    finally {db.release();}
}
async function validatePhoto(k,details,db) {
    if(k!=='events'||!details.photo_media_id) return;
    const result=await db.query("SELECT id_media FROM media WHERE id_media=$1 AND is_public AND mime_type LIKE 'image/%' FOR SHARE",[details.photo_media_id]);
    if(!result.rowCount) throw new DomainRuleError('Selecciona una imagen pública de la biblioteca para el evento.');
}
async function save(k,rawId,input,user) {
    kind(k);permission(user,rawId?'data:update':'data:create');
    const data=parse(inputSchema(k,Boolean(rawId)),input);
    const recordId=await transaction(async db=>{
        const recordId=rawId?id(rawId):null;
        if(recordId) {
            const row=await repo.get(k,recordId,db,true);
            if(!row) throw new NotFoundError();
            if(row.version!==data.version) throw new ConcurrentModificationError();
            if(row.status!=='DRAFT') throw new DomainRuleError('Sólo se pueden editar borradores.');
        }
        await validatePhoto(k,data.details,db);
        const saved=await repo.save(k,data,user.id,db,recordId);
        await repo.audit(k,saved,user.id,recordId?'UPDATE':'CREATE','',db);
        return saved;
    });
    return get(k,recordId,true);
}
const transitions={
    SUBMIT:['DRAFT','IN_REVIEW','data:submit'], APPROVE:['IN_REVIEW','APPROVED','data:approve'],
    REJECT:['IN_REVIEW','DRAFT','data:approve'], PUBLISH:['APPROVED','PUBLISHED','data:publish'],
    ARCHIVE:['PUBLISHED','ARCHIVED','data:publish'], REOPEN:['ARCHIVED','DRAFT','data:update']
};
async function transition(k,rawId,input,user) {
    kind(k);const recordId=id(rawId);const data=parse(transitionSchema,input);
    const [from,to,required]=transitions[data.action];permission(user,required);
    await transaction(async db=>{
        const row=await repo.get(k,recordId,db,true);if(!row) throw new NotFoundError();
        if(row.version!==data.version) throw new ConcurrentModificationError();
        if(row.status!==from) throw new DomainRuleError('El estado actual no permite esta acción.');
        if(data.action==='APPROVE' && [Number(row.created_by),Number(row.edited_by)].includes(user.id)) throw new ForbiddenError('La aprobación requiere una persona distinta del autor y del último editor.');
        if(data.action==='REJECT' && !data.note) throw new ValidationError('Indica el motivo de la devolución.');
        if(data.action==='PUBLISH') await validatePhoto(k,row.details,db);
        if(data.action==='PUBLISH' && k==='indicators') {
            // Serialize publication of observations so concurrent approvals cannot create duplicate series/periods.
            await db.query("SELECT pg_advisory_xact_lock(hashtext('observatory-indicators'))");
            const d=row.details;
            const duplicates=await db.query(`SELECT r.id FROM observatory_records r JOIN indicator_observations i ON i.record_id=r.id
                WHERE r.status='PUBLISHED' AND r.id<>$1 AND i.series_code=$2 AND i.period=$3 AND i.geography=$4 AND i.nature=$5`,[recordId,d.series_code,d.period,d.geography,d.nature]);
            if(duplicates.rowCount) throw new DomainRuleError('Ya existe una observación publicada para esta serie, periodo, región y naturaleza. Archívala antes de sustituirla.');
        }
        await db.query(`UPDATE observatory_records SET status=$2,version=version+1,updated_at=now(),
            approved_by=CASE WHEN $3='APPROVE' THEN $4 WHEN $3 IN ('REJECT','REOPEN') THEN NULL ELSE approved_by END,
            published_at=CASE WHEN $3='PUBLISH' THEN now() ELSE published_at END WHERE id=$1`,[recordId,to,data.action,user.id]);
        await repo.audit(k,recordId,user.id,data.action,data.note,db);
    });
    return get(k,recordId,true);
}
module.exports={parse,kind,id,map,list,get,save,transition,history:async(k,rawId)=>{await get(k,rawId,true);return repo.history(id(rawId));}};

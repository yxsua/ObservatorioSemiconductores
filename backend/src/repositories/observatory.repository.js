const pool = require('../config/database');
const { definitions } = require('../schemas/observatory.schema');
const PUBLIC = `r.status = 'PUBLISHED' AND (r.valid_from IS NULL OR r.valid_from <= CURRENT_DATE)
    AND (r.valid_until IS NULL OR r.valid_until >= CURRENT_DATE)`;
const relations = { mediaIds: ['observatory_record_media','media_id'], signalIds: ['observatory_record_signals','signal_id'], trendIds: ['observatory_record_trends','trend_id'] };
function select(kind) {
    return `SELECT r.*, to_jsonb(d) - 'record_id' AS details ${kind === 'events' ? ", photo.id_media AS photo_id, photo.alt_text AS photo_alt" : ''} FROM observatory_records r
        JOIN ${definitions[kind].table} d ON d.record_id = r.id
        ${kind === 'events' ? "LEFT JOIN media photo ON photo.id_media=d.photo_media_id AND photo.is_public AND photo.mime_type LIKE 'image/%'" : ''}`;
}
async function get(kind, id, db = pool, lock = false) {
    const { rows } = await db.query(`${select(kind)} WHERE r.id=$1 AND r.kind=$2 ${lock ? 'FOR UPDATE OF r' : ''}`, [id,kind]);
    return rows[0];
}
async function list(kind, filters, internal) {
    const values = [kind]; const clauses = ['r.kind=$1'];
    const add = (sql, value) => { values.push(value); clauses.push(sql.replaceAll('?', `$${values.length}`)); };
    if (!internal) clauses.push(PUBLIC);
    if (filters.status) add('r.status=?', filters.status);
    if (filters.search) add("(r.title ILIKE '%' || ? || '%' OR r.summary ILIKE '%' || ? || '%')", filters.search);
    if (filters.tag) add('? = ANY(r.tags)',filters.tag);
    if (filters.period && kind === 'indicators') add('d.period=?', filters.period);
    const where = `WHERE ${clauses.join(' AND ')}`;
    const { rows: counts } = await pool.query(`SELECT count(*) FROM observatory_records r JOIN ${definitions[kind].table} d ON d.record_id=r.id ${where}`,values);
    const { rows } = await pool.query(`${select(kind)} ${where} ORDER BY r.as_of DESC,r.id DESC LIMIT $${values.length+1} OFFSET $${values.length+2}`, [...values,filters.pageSize,(filters.page-1)*filters.pageSize]);
    return { rows, total: Number(counts[0].count) };
}
async function save(kind, input, userId, db, id) {
    const columns = ['title','summary','source_name','source_url','as_of','responsible','valid_from','valid_until','tags'];
    const values = [input.title,input.summary,input.sourceName,input.sourceUrl,input.asOf,input.responsible,input.validFrom,input.validUntil,input.tags];
    if (id) {
        await db.query(`UPDATE observatory_records SET ${columns.map((c,i)=>`${c}=$${i+1}`).join(',')}, edited_by=$10, version=version+1, updated_at=now(),approved_by=NULL WHERE id=$11`,[...values,userId,id]);
    } else {
        const result = await db.query(`INSERT INTO observatory_records (${columns.join(',')},kind,created_by,edited_by)
            VALUES (${values.map((_,i)=>`$${i+1}`).join(',')},$10,$11,$11) RETURNING id`,[...values,kind,userId]);
        id = result.rows[0].id;
    }
    // These keys come exclusively from the strict domain schema, never from raw request input.
    const keys = Object.keys(input.details);
    await db.query(`INSERT INTO ${definitions[kind].table}(record_id,${keys.join(',')})
        VALUES ($1,${keys.map((_,i)=>`$${i+2}`).join(',')}) ON CONFLICT(record_id) DO UPDATE SET
        ${keys.map(k=>`${k}=EXCLUDED.${k}`).join(',')}`, [id,...keys.map(k=>input.details[k])]);
    for (const [key,[table,column]] of Object.entries(relations)) {
        await db.query(`DELETE FROM ${table} WHERE record_id=$1`,[id]);
        if (input[key].length) await db.query(`INSERT INTO ${table}(record_id,${column}) SELECT $1,unnest($2::bigint[])`,[id,input[key]]);
    }
    return id;
}
async function related(id, internal = false, db = pool) {
    const filters = {
        mediaIds: "EXISTS(SELECT 1 FROM media m WHERE m.id_media=x.media_id AND m.is_public)",
        signalIds: "EXISTS(SELECT 1 FROM signals s JOIN signal_statuses t ON t.id_signal_status=s.id_signal_status WHERE s.id_signal=x.signal_id AND t.code='VALIDATED')",
        trendIds: "EXISTS(SELECT 1 FROM trends t JOIN trend_statuses s ON s.id_trend_status=t.id_trend_status WHERE t.id_trend=x.trend_id AND s.code='ACTIVE')"
    };
    const result = {};
    for (const [key,[table,column]] of Object.entries(relations)) {
        const {rows} = await db.query(`SELECT ${column} AS id FROM ${table} x WHERE record_id=$1 ${internal ? '' : `AND ${filters[key]}`} ORDER BY ${column}`,[id]);
        result[key] = rows.map(r=>Number(r.id));
    }
    return result;
}
async function history(id, db = pool) {
    const {rows} = await db.query(`SELECT h.id,h.action,h.note,h.version,h.created_at AS "createdAt",
        u.first_name || ' ' || u.last_name AS actor FROM observatory_record_history h
        LEFT JOIN users u ON u.id_user=h.actor_id WHERE record_id=$1 ORDER BY h.id DESC`,[id]);
    return rows;
}
async function audit(kind,id,userId,action,note,db) {
    const row = await get(kind,id,db);
    const links = await related(id,true,db);
    await db.query(`INSERT INTO observatory_record_history(record_id,actor_id,action,note,version,snapshot)
        VALUES ($1,$2,$3,$4,$5,$6)`,[id,userId,action,note,row.version,JSON.stringify({...row,...links})]);
}
module.exports = { pool, PUBLIC, get, list, save, related, history, audit };

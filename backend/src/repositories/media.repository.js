const pool = require("../config/database");

class MediaRepository {
    async findAll(filters, pagination) {
        const values = [filters.search, filters.kind, filters.isPublic, pagination.limit, pagination.offset];
        const where = `WHERE ($1::TEXT IS NULL OR media.title ILIKE '%'||$1||'%' OR media.original_filename ILIKE '%'||$1||'%')
            AND ($2::TEXT IS NULL OR ($2='image' AND media.mime_type LIKE 'image/%') OR ($2='file' AND media.mime_type NOT LIKE 'image/%'))
            AND ($3::BOOLEAN IS NULL OR media.is_public=$3)`;
        const [{rows},{rows:count}]=await Promise.all([
            pool.query(`SELECT media.*, uploader.first_name||' '||uploader.last_name AS uploader FROM media LEFT JOIN users uploader ON uploader.id_user=media.uploaded_by ${where} ORDER BY media.created_at DESC,media.id_media DESC LIMIT $4 OFFSET $5`,values),
            pool.query(`SELECT COUNT(*)::INTEGER AS total FROM media ${where}`,values.slice(0,3))
        ]);
        return {rows,totalItems:Number(count[0].total)};
    }

    async findById(id) { const {rows}=await pool.query("SELECT media.*, uploader.first_name||' '||uploader.last_name AS uploader FROM media LEFT JOIN users uploader ON uploader.id_user=media.uploaded_by WHERE id_media=$1 LIMIT 1",[id]);return rows[0]??null; }

    async create(input) { const {rows}=await pool.query(`INSERT INTO media(filename,original_filename,mime_type,extension,storage_path,size_bytes,checksum,uploaded_by,created_by,is_public,storage_provider,title,alt_text,description) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,'local',$10,$11,$12) RETURNING id_media`,[input.filename,input.originalFilename,input.mimeType,input.extension,input.storagePath,input.sizeBytes,input.checksum,input.userId,input.isPublic,input.title,input.altText,input.description]);return Number(rows[0].id_media); }

    async update(id,input) { const result=await pool.query(`UPDATE media SET title=$1,alt_text=$2,description=$3,is_public=$4,updated_at=CURRENT_TIMESTAMP WHERE id_media=$5 AND date_trunc('milliseconds',updated_at)=date_trunc('milliseconds',$6::timestamp)`,[input.title,input.altText,input.description,input.isPublic,id,input.updatedAt]);return result.rowCount; }
    async findPublicById(id) {
        const { rows } = await pool.query(`
            SELECT
                id_media,
                filename,
                original_filename,
                mime_type,
                extension,
                storage_path,
                size_bytes,
                checksum,
                updated_at
            FROM media
            WHERE id_media = $1 AND is_public
            LIMIT 1;
        `, [id]);
        return rows[0] ?? null;
    }
}

module.exports = new MediaRepository();

const pool = require("../config/database");

class MediaRepository {
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


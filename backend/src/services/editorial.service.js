const editorialRepository = require("../repositories/editorial.repository");
const { getBlockDescriptor } = require("../editorial/blockRegistry");

class EditorialService {
    async listBlockTypes() {
        const rows = await editorialRepository.findEnabledBlockTypes();
        return rows.map((row) => {
            const descriptor = getBlockDescriptor(row.code);
            if (!descriptor) {
                throw new Error(
                    `El bloque activo ${row.code} no tiene contrato en backend.`
                );
            }
            if (descriptor.schemaVersion !== row.schema_version) {
                throw new Error(
                    `El bloque ${row.code} no coincide con la versión del contrato.`
                );
            }
            return {
                id: Number(row.id_block_type),
                ...descriptor,
                icon: row.icon,
                description: row.description,
                supportsChildren: row.supports_children,
                publicAllowed: row.public_allowed
            };
        });
    }
}

module.exports = new EditorialService();

const { test } = require('node:test');
const assert = require('node:assert/strict');
const service = require('../src/services/publicContent.service');
const repository = require('../src/repositories/publicContent.repository');

test('publicaciones admiten selecciones múltiples y rechazan listas inválidas', () => {
    const { filters } = service.parseFilters({type:'NEWS',fcvCodes:'tec,MER,TEC',categoryIds:'1,2,1'});
    assert.deepEqual(filters.fcvCodes,['TEC','MER']);
    assert.deepEqual(filters.categoryIds,[1,2]);
    const query=repository.buildFilters(filters);
    assert.deepEqual(query.values,['NEWS',[1,2],['TEC','MER']]);
    assert.match(query.where,/relation.category_id = ANY\(\$2::bigint\[\]\)/);
    assert.match(query.where,/fcv.code = ANY\(\$3::text\[\]\)/);
    assert.match(query.where,/public_content.published_version_id/);
    for(const invalid of [{categoryIds:'0,2'},{fcvCodes:'TEC,,MER'},{fcvCodes:['TEC']},{categoryIds:'1);DROP TABLE content'}]) assert.throws(()=>service.parseFilters(invalid));
});

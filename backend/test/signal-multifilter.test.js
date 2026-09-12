const {test}=require('node:test');
const assert=require('node:assert/strict');
const service=require('../src/services/signal.service');
const repository=require('../src/repositories/signal.repository');
test('multiple filters normalize and reject malformed lists',()=>{
 const result=service.parseFilters({fcvCodes:'tec,MER,TEC',categoryIds:'1,2,1'});
 const filters=result.filters ?? result;
 assert.deepEqual(filters.fcvCodes,['TEC','MER']);
 assert.deepEqual(filters.categoryIds,[1,2]);
 for (const query of [{categoryIds:'1,-2'},{fcvCodes:'TEC,,MER'},{categoryIds:'1); DROP TABLE signals'},{fcvCodes:['TEC']}]) assert.throws(()=>service.parseFilters(query));
});
test('multiple filters parameterize both groups',()=>{
 const result=repository.buildFilters({fcvCodes:['TEC','MER'],categoryIds:[1,2]},true);
 assert.match(result.where,/s.id_category = ANY/);
 assert.match(result.where,/f.code = ANY/);
 assert.deepEqual(result.values,[[1,2],['TEC','MER']]);
 assert.match(result.where,/VALIDATED/);
});

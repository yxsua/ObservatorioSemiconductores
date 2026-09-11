const {test}=require('node:test');const assert=require('node:assert/strict');
const {inputSchema,filtersSchema}=require('../src/schemas/observatory.schema');
const {searchSchema,csvCell}=require('../src/services/discovery.service');
const base={title:'Dato',summary:'Resumen',sourceName:'Informe',asOf:'2026-09-10',responsible:'Equipo',details:{series_code:'SAM',dimension:'ECONOMIC',period:2030,value:10,upper_value:20,unit:'USD',nature:'PROJECTION',methodology:'Escenario',geography:'Querétaro'}};
test('rechaza rangos invertidos y datos numéricos sin naturaleza válida',()=>{
 assert.equal(inputSchema('indicators').safeParse({...base,details:{...base.details,upper_value:9}}).success,false);
 assert.equal(inputSchema('indicators').safeParse({...base,details:{...base.details,nature:'OFFICIAL'}}).success,false);
 assert.equal(inputSchema('indicators').safeParse({...base,details:{...base.details,value:null,upper_value:null}}).success,false);
 assert.equal(inputSchema('indicators').safeParse({...base,details:{...base.details,value:null,upper_value:null,assessment:'Alta'}}).success,true);
});
test('rechaza campos de otro dominio, fechas inválidas y vigencias invertidas',()=>{
 assert.equal(inputSchema('resources').safeParse(base).success,false);
 assert.equal(inputSchema('indicators').safeParse({...base,asOf:'2026-02-30'}).success,false);
 assert.equal(inputSchema('indicators').safeParse({...base,validFrom:'2026-09-10',validUntil:'2026-09-01'}).success,false);
 assert.equal(inputSchema('indicators').safeParse({...base,status:'PUBLISHED'}).success,false);
 assert.equal(inputSchema('indicators').safeParse({...base,sourceUrl:'javascript:alert(1)'}).success,false);
});
test('los eventos requieren fechas ordenadas con zona horaria',()=>{
 const details={starts_at:'2026-10-02T12:00:00Z',ends_at:'2026-10-01T12:00:00Z',organizer:'Equipo',location:'En línea'};
 assert.equal(inputSchema('events').safeParse({...base,details}).success,false);
 assert.equal(inputSchema('events').safeParse({...base,details:{...details,ends_at:'2026-10-02T14:00:00Z'}}).success,true);
});
test('paginación, tipos y fechas de búsqueda se validan',()=>{
 assert.equal(filtersSchema.safeParse({pageSize:1000}).success,false);
 assert.equal(searchSchema.safeParse({q:'a'}).success,false);
 assert.equal(searchSchema.safeParse({q:'chips',type:'users'}).success,false);
 assert.equal(searchSchema.safeParse({q:'chips',from:'2026-09-10',to:'2026-01-01'}).success,false);
});
test('la descarga CSV protege fórmulas y conserva negativos numéricos',()=>{
 assert.equal(csvCell('=HYPERLINK("x")'),'"\'=HYPERLINK(""x"")"');
 assert.equal(csvCell(-4.5),'"-4.5"');
 assert.equal(csvCell('  =SUM(A1:A2)'),'"\'  =SUM(A1:A2)"');
});

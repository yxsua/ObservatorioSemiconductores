// Update only the generated observatory blocks, preserving the rest of the API contract.
const fs=require('node:fs');const path=require('node:path');const {z}=require('zod');
const {definitions,inputSchema,transitionSchema}=require('../src/schemas/observatory.schema');
const {searchSchema}=require('../src/services/discovery.service');
const schemas={};const paths={};const ref=name=>({'$ref':`#/components/schemas/${name}`});
function json(schema){const result=z.toJSONSchema(schema,{io:'input',unrepresentable:'any'});delete result.$schema;return result;}
const kinds=Object.keys(definitions);const object=(properties,required=Object.keys(properties))=>({type:'object',properties,required});
const integer={type:'integer'};const string={type:'string'};const date={type:'string',format:'date'};const timestamp={type:['string','null'],format:'date-time'};
const array=items=>({type:'array',items});
for(const kind of kinds){schemas[`ObservatoryInput_${kind}`]=json(inputSchema(kind));schemas[`ObservatoryUpdate_${kind}`]=json(inputSchema(kind,true));}
schemas.ObservatoryInput={oneOf:kinds.map(k=>ref(`ObservatoryInput_${k}`))};
schemas.ObservatoryUpdate={oneOf:kinds.map(k=>ref(`ObservatoryUpdate_${k}`))};
schemas.ObservatoryTransition=json(transitionSchema);
const common=json(inputSchema('indicators')).properties;delete common.details;
schemas.ObservatoryRecord=object({...common,photo:{anyOf:[object({id:integer,url:string,altText:string}),{type:'null'}]},id:integer,kind:{type:'string',enum:kinds},
 details:{oneOf:kinds.map(k=>json(definitions[k].schema))},publishedAt:timestamp,updatedAt:timestamp},['id','kind','title','summary','sourceName','sourceUrl','asOf','responsible','validFrom','validUntil','tags','details','publishedAt','updatedAt']);
schemas.ObservatoryInternalRecord={allOf:[ref('ObservatoryRecord'),object({status:{type:'string',enum:['DRAFT','IN_REVIEW','APPROVED','PUBLISHED','ARCHIVED']},version:integer,createdBy:integer,editedBy:integer})]};
schemas.ObservatoryPagination=object({page:integer,pageSize:integer,totalItems:integer,totalPages:integer});
const page=item=>object({items:array(item),pagination:ref('ObservatoryPagination')});
schemas.ObservatoryPage=page(ref('ObservatoryRecord'));schemas.ObservatoryInternalPage=page(ref('ObservatoryInternalRecord'));
schemas.ObservatoryHistory=array(object({id:integer,action:string,note:{type:['string','null']},version:integer,createdAt:timestamp,actor:{type:['string','null']}}));
schemas.ObservatoryDashboard=object({schemaVersion:{const:1,type:'integer'},period:{type:['integer','null']},periods:array(integer),updatedAt:timestamp,methodology:string,counts:{type:'object',additionalProperties:integer},observations:array(ref('ObservatoryRecord'))});
schemas.ObservatorySearchResult=object({id:integer,type:{type:'string',enum:['content','signal','trend','alert',...kinds]},title:string,summary:string,url:string,date:{type:['string','null'],format:'date'},tags:array(string)});
schemas.ObservatorySearchPage=object({...page(ref('ObservatorySearchResult')).properties,facets:{type:'object',additionalProperties:integer}});
const domainParam={in:'path',name:'kind',required:true,schema:{type:'string',enum:kinds}};
const idParam={in:'path',name:'id',required:true,schema:{type:'integer',minimum:1}};
const query=(name,schema,required=false)=>({in:'query',name,schema,required});
const filters=[query('search',{type:'string',minLength:2,maxLength:200}),query('page',{type:'integer',minimum:1,default:1}),query('pageSize',{type:'integer',minimum:1,maximum:100,default:20}),query('period',{type:'integer',minimum:1900,maximum:2200}),query('tag',string)];
function operation(summary,schema,parameters,internal=false,body,status='200'){
 const op={summary,tags:['Observatory data'],parameters,responses:{[status]:{description:'Operación correcta.',content:{'application/json':{schema:object({success:{type:'boolean'},message:string,data:ref(schema)})}}},'400':{description:'Datos o filtros inválidos.'},'404':{description:'Recurso no disponible.'}}};
 if(internal){op.security=[{bearerAuth:[]}];op.responses['401']={description:'Se requiere sesión.'};op.responses['403']={description:'Permiso insuficiente o autor intentando aprobar su propio registro.'};op.responses['409']={description:'Versión desactualizada.'};op.responses['422']={description:'Estado, relaciones o publicación incompatibles.'};}
 if(body)op.requestBody={required:true,content:{'application/json':{schema:ref(body)}}};return op;
}
paths['/data/{kind}']={get:operation('Consultar registros publicados y vigentes. period sólo aplica a indicadores.','ObservatoryPage',[domainParam,...filters])};
paths['/data/{kind}/{id}']={get:operation('Consultar ficha pública y relaciones públicas.','ObservatoryRecord',[domainParam,idParam])};
paths['/admin/data/{kind}']={get:operation('Listar fichas internas; requiere data:read-internal.','ObservatoryInternalPage',[domainParam,...filters,query('status',{type:'string',enum:['DRAFT','IN_REVIEW','APPROVED','PUBLISHED','ARCHIVED']})],true),post:operation('Crear borrador; requiere data:create. El esquema depende de kind.','ObservatoryInternalRecord',[domainParam],true,'ObservatoryInput','201')};
paths['/admin/data/{kind}/{id}']={get:operation('Consultar ficha interna.','ObservatoryInternalRecord',[domainParam,idParam],true),put:operation('Reemplazar un borrador con versión vigente; requiere data:update.','ObservatoryInternalRecord',[domainParam,idParam],true,'ObservatoryUpdate')};
paths['/admin/data/{kind}/{id}/history']={get:operation('Consultar historial de cambios.','ObservatoryHistory',[domainParam,idParam],true)};
paths['/admin/data/{kind}/{id}/transitions']={post:operation('Enviar, aprobar, devolver, publicar, archivar o reabrir. Requiere el permiso de la transición.','ObservatoryInternalRecord',[domainParam,idParam],true,'ObservatoryTransition')};
paths['/dashboard']={get:operation('Indicadores públicos por periodo, metodología y totales vigentes sin sumar unidades incompatibles.','ObservatoryDashboard',[query('period',{type:'integer',minimum:1900,maximum:2200})])};
paths['/dashboard.csv']={get:{summary:'Descargar las observaciones del dashboard como CSV UTF-8.',parameters:[query('period',{type:'integer',minimum:1900,maximum:2200})],responses:{200:{description:'CSV con fuentes, corte y metodología.',content:{'text/csv':{schema:{type:'string'}}}}}}};
const searchJson=json(searchSchema);
paths['/search']={get:operation('Buscar títulos y resúmenes públicos. Facetas por tipo calculadas antes de aplicar el filtro type.','ObservatorySearchPage',Object.entries(searchJson.properties).map(([name,schema])=>query(name,schema,name==='q')))};
const file=path.resolve(__dirname,'../../docs/API-docs/openapi.yaml');let source=fs.readFileSync(file,'utf8');
source=source.replace(/  # BEGIN OBSERVATORY PATHS[\s\S]*?  # END OBSERVATORY PATHS\r?\n/g,'').replace(/    # BEGIN OBSERVATORY SCHEMAS[\s\S]*?    # END OBSERVATORY SCHEMAS\r?\n/g,'');
const lines=(values,indent)=>Object.entries(values).map(([key,value])=>' '.repeat(indent)+JSON.stringify(key)+': '+JSON.stringify(value)).join('\n');
source=source.replace(/^paths:\s*\r?$/m,`paths:\n  # BEGIN OBSERVATORY PATHS\n${lines(paths,2)}\n  # END OBSERVATORY PATHS`);
source=source.replace(/^  schemas:\s*\r?$/m,`  schemas:\n    # BEGIN OBSERVATORY SCHEMAS\n${lines(schemas,4)}\n    # END OBSERVATORY SCHEMAS`);
fs.writeFileSync(file,source);console.log('Contrato de dominios, dashboard y búsqueda actualizado.');

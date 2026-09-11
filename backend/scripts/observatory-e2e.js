const assert=require('node:assert/strict');
const pool=require('../src/config/database');
const base=process.env.API_URL||'http://127.0.0.1:3001';
const suffix=`${Date.now()}${process.pid}`;const term=`dataset${suffix}`;const password='Validation123!';
async function call(path,{token,body,method='GET',status=200}={}){
 const response=await fetch(base+'/api'+path,{method,headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});
 const payload=await response.json();assert.equal(response.status,status,`${method} ${path}: ${JSON.stringify(payload)}`);return payload.data;
}
async function user(role){const email=`${role.toLowerCase()}-${suffix}@example.test`;
 await call('/auth/register',{method:'POST',status:201,body:{firstName:'Validación',lastName:role,email,password,termsVersion:'2026-09-11'}});
 await pool.query(`INSERT INTO user_roles(id_user,id_role) SELECT u.id_user,r.id_role FROM users u CROSS JOIN roles r WHERE u.email=$1 AND r.name=$2 ON CONFLICT DO NOTHING`,[email,role]);
 return (await call('/auth/login',{method:'POST',body:{email,password}})).token;
}
async function move(kind,r,action,token,status=200){return call(`/admin/data/${kind}/${r.id}/transitions`,{method:'POST',token,status,body:{action,version:r.version,note:'Prueba integral'}});}
async function main(){
 const editor=await user('EDITOR'),reviewer=await user('VALIDATOR'),publisher=await user('PUBLISHER'),member=await user('MEMBER');
 const common={title:`${term} prueba`,summary:`Evidencia de ${term}`,sourceName:'Fuente de prueba',sourceUrl:'https://example.test/source',asOf:'2026-09-10',responsible:'Equipo de prueba',tags:[term]};
 const detailByKind={
  indicators:{series_code:`TEST_${suffix}`,dimension:'ECONOMIC',period:2099,value:10,upper_value:12,unit:'millones USD',nature:'PROJECTION',methodology:'Escenario de prueba, no sumar con datos observados.',geography:'Región de prueba'},
  ecosystem:{actor_type:'RESEARCH',location:'Región de prueba',capabilities:'Caracterización',value_chain_stage:'I+D'},
  investments:{organization:'Empresa de prueba',location:'Región de prueba',stage:'ANNOUNCED',amount:20,currency:'USD'},
  events:{starts_at:'2099-12-01T12:00:00Z',ends_at:'2099-12-01T14:00:00Z',organizer:'Equipo',location:'En línea'},
  resources:{resource_type:'DATASET',url:'https://example.test/data',format:'CSV'}
 };
 await call('/admin/data/indicators',{status:401});await call('/admin/data/indicators',{token:member,status:403});
 const photoForm=new FormData();photoForm.set('file',new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=','base64')],{type:'image/png'}),'event.png');photoForm.set('title','Foto de evento');photoForm.set('altText','Foto de prueba');photoForm.set('isPublic','true');
 const photoResponse=await fetch(base+'/api/admin/media',{method:'POST',headers:{authorization:'Bearer '+editor},body:photoForm});assert.equal(photoResponse.status,201);const photo=(await photoResponse.json()).data;
 detailByKind.events.photo_media_id=photo.id;
 await call('/admin/data/events',{token:editor,method:'POST',status:422,body:{...common,details:{...detailByKind.events,photo_media_id:999999999}}});
 const records={};
 for(const [kind,details]of Object.entries(detailByKind)){
  const input={...common,details};
  let r=await call(`/admin/data/${kind}`,{token:editor,method:'POST',status:201,body:input});
  await call(`/data/${kind}/${r.id}`,{status:404});
  await call(`/admin/data/${kind}/${r.id}`,{token:editor,method:'PUT',status:409,body:{...input,version:0+99}});
  r=await call(`/admin/data/${kind}/${r.id}`,{token:editor,method:'PUT',body:{...input,version:r.version}});
  await call(`/data/${kind}/${r.id}`,{status:404});
  r=await move(kind,r,'SUBMIT',editor);
  await move(kind,r,'APPROVE',editor,403);
  await call(`/admin/data/${kind}/${r.id}`,{token:editor,method:'PUT',status:422,body:{...input,version:r.version}});
  r=await move(kind,r,'APPROVE',reviewer);r=await move(kind,r,'PUBLISH',publisher);
  const publicRecord=await call(`/data/${kind}/${r.id}`);assert.equal(publicRecord.title,input.title);assert.equal(publicRecord.version,undefined);assert.equal(publicRecord.createdBy,undefined);
  assert.ok((await call(`/admin/data/${kind}/${r.id}/history`,{token:editor})).length>=5);
  records[kind]=r;
 }
 const withPhoto=await call('/data/events/'+records.events.id);assert.equal(withPhoto.photo.id,photo.id);assert.equal(withPhoto.photo.altText,'Foto de prueba');
 const eventList=await call('/data/events?search='+term);assert.equal(eventList.items[0].photo.id,photo.id);
 await pool.query('UPDATE media SET is_public=false WHERE id_media=$1',[photo.id]);
 assert.equal((await call('/data/events/'+records.events.id)).photo,null);
 assert.equal((await call('/data/events/'+records.events.id)).details.photo_media_id,null);
 await call('/admin/data/events',{token:editor,method:'POST',status:422,body:{...common,details:detailByKind.events}});
 await pool.query('UPDATE media SET is_public=true WHERE id_media=$1',[photo.id]);
 const search=await call(`/search?q=${term}`);assert.equal(search.pagination.totalItems,5);assert.equal(search.facets.indicators,1);
 const filtered=await call(`/search?q=${term}&type=resources&pageSize=1`);assert.equal(filtered.items.length,1);assert.equal(filtered.facets.indicators,1);
 const second=await call(`/search?q=${term}&pageSize=2&page=2`);assert.equal(second.items.length,2);
 const dashboard=await call('/dashboard?period=2099');const observation=dashboard.observations.find(r=>r.id===records.indicators.id);
 assert.equal(observation.details.value,10);assert.equal(observation.details.upper_value,12);assert.equal(observation.sourceName,common.sourceName);
 assert.equal(observation.details.nature,'PROJECTION');assert.equal(dashboard.schemaVersion,1);
 const csv=await fetch(base+'/api/dashboard.csv?period=2099');assert.equal(csv.status,200);assert.ok((await csv.text()).includes(term));
 let duplicate=await call('/admin/data/indicators',{token:editor,method:'POST',status:201,body:{...common,details:detailByKind.indicators}});
 duplicate=await move('indicators',duplicate,'SUBMIT',editor);duplicate=await move('indicators',duplicate,'APPROVE',reviewer);await move('indicators',duplicate,'PUBLISH',publisher,422);
 // A creator with approval permission still cannot approve their own record.
 const admin=await user('ADMIN');let own=await call('/admin/data/resources',{token:admin,method:'POST',status:201,body:{...common,details:detailByKind.resources}});
 own=await move('resources',own,'SUBMIT',admin);await move('resources',own,'APPROVE',admin,403);
 // Reject invalid relations atomically.
 await call('/admin/data/resources',{token:editor,method:'POST',status:422,body:{...common,details:detailByKind.resources,signalIds:[999999999]}});
 // Expired published records remain internal; search and dashboard obey the same visibility rules.
 let expired=await call('/admin/data/resources',{token:editor,method:'POST',status:201,body:{...common,validUntil:'2000-01-01',details:detailByKind.resources}});
 expired=await move('resources',expired,'SUBMIT',editor);expired=await move('resources',expired,'APPROVE',reviewer);expired=await move('resources',expired,'PUBLISH',publisher);
 await call(`/data/resources/${expired.id}`,{status:404});assert.equal((await call(`/search?q=${term}`)).pagination.totalItems,5);
 records.indicators=await move('indicators',records.indicators,'ARCHIVE',publisher);await call(`/data/indicators/${records.indicators.id}`,{status:404});
 assert.equal((await call(`/search?q=${term}`)).pagination.totalItems,4);
 assert.equal((await call('/dashboard?period=2099')).observations.some(r=>r.id===records.indicators.id),false);
 console.log(JSON.stringify({fixtureRun:suffix,domains:Object.keys(records),checks:['typed-fields','authorization','separate-reviewer','optimistic-version','history','publication','facets','pagination','dashboard-values','csv','duplicate-period','expiry','withdrawal'],records:Object.fromEntries(Object.entries(records).map(([k,v])=>[k,v.id]))},null,2));
 // Keep validation examples out of the visible portal after the run.
 for(const [kind,r]of Object.entries(records))if(r.status==='PUBLISHED')await move(kind,r,'ARCHIVE',publisher);
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>pool.end());

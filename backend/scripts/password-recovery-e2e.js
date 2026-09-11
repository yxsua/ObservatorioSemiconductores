const assert=require('node:assert/strict');const crypto=require('node:crypto');
const pool=require('../src/config/database');const repo=require('../src/repositories/password-recovery.repository');const {createRecoveryService}=require('../src/services/password-recovery.service');
const base=process.env.API_URL||'http://127.0.0.1:3001';const email=`recovery-${Date.now()}@example.test`;let userId;
async function call(path,body,status=200,token){const res=await fetch(base+'/api/auth'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});const json=await res.json();assert.equal(res.status,status,JSON.stringify(json));return json;}
async function main(){
 const input={firstName:'Recovery',lastName:'Test',email,password:'Password123!',termsVersion:'2026-09-11'};const registered=(await call('/register',input,201)).data;userId=registered.user.id;
 const row=(await pool.query('SELECT terms_version,terms_accepted_at FROM users WHERE id_user=$1',[userId])).rows[0];assert.equal(row.terms_version,'2026-09-11');assert.ok(row.terms_accepted_at);
 assert.equal((await call('/password/status')).data.available,false);await call('/password/forgot',{email},503);
 const sent=[];const service=createRecoveryService({repo,mail:{enabled:true,sendPasswordReset:async msg=>sent.push(msg)},origin:()=> 'https://observatorio.example.test',wait:async()=>{}});
 await service.request({email},'test-'+userId);const token1=new URLSearchParams(new URL(sent[0].url).hash.slice(1)).get('token');
 await service.request({email},'test-'+userId);const token2=new URLSearchParams(new URL(sent[1].url).hash.slice(1)).get('token');
 await call('/password/reset',{token:token1,password:'NewPassword123!'},400);
 await pool.query("UPDATE password_reset_tokens SET expires_at=now()-interval '1 minute' WHERE user_id=$1",[userId]);await call('/password/reset',{token:token2,password:'NewPassword123!'},400);
 await service.request({email},'test-'+userId);const token3=new URLSearchParams(new URL(sent[2].url).hash.slice(1)).get('token');
 const digest=crypto.createHash('sha256').update(token3).digest('hex');assert.equal((await pool.query('SELECT token_hash FROM password_reset_tokens WHERE user_id=$1',[userId])).rows[0].token_hash,digest);
 const results=await Promise.all([1,2].map(()=>fetch(base+'/api/auth/password/reset',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token:token3,password:'NewPassword123!'})}).then(r=>r.status)));assert.deepEqual(results.sort(),[200,400]);
 await call('/me',undefined,401,registered.token);await call('/login',{email,password:'Password123!'},401);const login=await call('/login',{email,password:'NewPassword123!'});await call('/me',undefined,200,login.data.token);
 assert.equal((await pool.query('SELECT count(*) FROM password_reset_tokens WHERE user_id=$1',[userId])).rows[0].count,'0');
 console.log('Recuperación: aceptación, correo deshabilitado, caducidad, sustitución, consumo concurrente único y revocación de sesiones verificados.');
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(userId){await pool.query('DELETE FROM user_roles WHERE id_user=$1',[userId]);await pool.query('DELETE FROM users WHERE id_user=$1',[userId]);}await pool.end();});

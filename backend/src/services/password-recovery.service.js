const crypto=require('node:crypto');
const {z}=require('zod');
const {emailSchema,passwordSchema}=require('../schemas/auth.schema');
const {ApiError,ValidationError}=require('../errors/apiError');
const {hashPassword}=require('../utils/password');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const requestSchema=z.object({email:emailSchema}).strict();
const resetSchema=z.object({token:z.string().regex(/^[a-f0-9]{64}$/),password:passwordSchema}).strict();
function createRecoveryService({repo,mail,origin=()=>process.env.PUBLIC_APP_URL,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms))}){
 function baseUrl(){try{const url=new URL(origin());if(url.username||url.password||url.search||url.hash||url.pathname!=='/')return null;if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)))return null;return url.origin;}catch{return null;}}
 function available(){return Boolean(mail.enabled&&baseUrl());}
 async function throttle(key,limit){if(!await repo.throttle(hash(key),limit))throw new ApiError('Demasiados intentos. Espera 15 minutos antes de volver a intentarlo.',429,null,'RECOVERY_RATE_LIMIT');}
 return {available,
 async request(input,address){
  const parsed=requestSchema.safeParse(input);if(!parsed.success)throw new ValidationError('Introduce un correo electrónico válido.');
  if(!available())throw new ApiError('La recuperación por correo aún no está disponible. Inténtalo más adelante.',503,null,'RECOVERY_UNAVAILABLE');
  await throttle('request-ip:'+address,20);
  const start=Date.now();const email=parsed.data.email;
  try{
   // Silently suppress repeated email requests, equally for known and unknown accounts.
   if(!await repo.throttle(hash('email:'+email),3))return;
   const token=crypto.randomBytes(32).toString('hex');const digest=hash(token);
   if(await repo.issue(email,digest)){
    try{await mail.sendPasswordReset({to:email,url:baseUrl()+'/restablecer-contrasena#token='+token,expiresInMinutes:30});}
    catch{await repo.revoke(digest);/* Do not expose account existence, provider errors or reset secrets. */}
   }
  }finally{await wait(Math.max(0,500-Date.now()));}
 },
 async reset(input,address){
  await throttle('reset-ip:'+address,30);
  const parsed=resetSchema.safeParse(input);if(!parsed.success)throw new ValidationError('Revisa el enlace y la contraseña: mínimo 8 caracteres, mayúscula, minúscula y número.');
  const passwordHash=await hashPassword(parsed.data.password);
  if(!await repo.consume(hash(parsed.data.token),passwordHash))throw new ApiError('El enlace no es válido, ha caducado o ya fue utilizado. Solicita uno nuevo.',400,null,'RESET_LINK_INVALID');
 }
 };
}
module.exports={createRecoveryService,requestSchema,resetSchema};

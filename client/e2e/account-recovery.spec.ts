import {test,expect} from '@playwright/test';
const token='a'.repeat(64);
test('registro exige aceptación y enlaza los documentos sin perder el formulario',async({page})=>{
 await page.goto('/registro');await page.getByLabel('Nombre',{exact:true}).fill('Ana');await page.getByLabel('Apellido',{exact:true}).fill('Prueba');await page.getByLabel('Correo electrónico',{exact:true}).fill('ana@example.test');await page.getByLabel('Contraseña',{exact:true}).fill('Password123!');await page.getByLabel('Confirmar contraseña',{exact:true}).fill('Password123!');
 let body:unknown;await page.route('**/api/auth/register',route=>{body=route.request().postDataJSON();return route.fulfill({status:409,json:{success:false,message:'Cuenta de prueba',code:'CONFLICT'}});});
 await page.getByRole('button',{name:'Crear cuenta',exact:true}).click();await expect(page.getByText('Debes aceptar los términos y leer el aviso de privacidad.')).toBeVisible();expect(body).toBeUndefined();
 const link=page.getByRole('link',{name:'términos de servicio (abre en otra pestaña)',exact:true});await expect(link).toHaveAttribute('target','_blank');await expect(link).toHaveAttribute('href','/terminos');
 await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Crear cuenta',exact:true}).click();await expect.poll(()=>body).toMatchObject({termsVersion:'2026-09-11'});
 await page.goto('/privacidad');await expect(page.getByRole('heading',{level:1})).toHaveText('Política de privacidad y aviso integral');await expect(page.getByRole('link',{name:'contacto@itq.edu.mx',exact:true})).toBeVisible();await expect(page.getByText(/No se utilizarán para publicidad/)).toBeVisible();
});
test('recuperación informa correo no habilitado sin fingir envíos',async({page})=>{
 await page.route('**/api/auth/password/status',route=>route.fulfill({json:{success:true,data:{available:false}}}));await page.goto('/iniciar-sesion');await page.getByRole('link',{name:'¿Olvidaste tu contraseña?'}).click();await expect(page.getByText('Recuperación por correo aún no disponible')).toBeVisible();await expect(page.getByRole('button',{name:'Enviar enlace de recuperación'})).toBeDisabled();
});
test('solicitud maneja fallo de envío y confirmación genérica',async({page})=>{
 await page.route('**/api/auth/password/status',route=>route.fulfill({json:{success:true,data:{available:true}}}));let attempt=0;await page.route('**/api/auth/password/forgot',route=>route.fulfill(++attempt===1?{status:429,json:{success:false,message:'Demasiados intentos. Espera 15 minutos.',code:'RECOVERY_RATE_LIMIT'}}:{json:{success:true,data:null,message:'Si existe una cuenta activa con ese correo, recibirás un enlace de recuperación.'}}));
 await page.goto('/recuperar-contrasena');await page.getByLabel('Correo electrónico').fill('persona@example.test');await page.getByRole('button',{name:'Enviar enlace de recuperación'}).click();await expect(page.getByRole('alert')).toContainText('Espera 15 minutos');await page.getByRole('button',{name:'Enviar enlace de recuperación'}).click();await expect(page.getByText('Solicitud recibida')).toBeVisible();await expect(page.getByText(/Si existe una cuenta activa/)).toBeVisible();
});
test('nueva contraseña valida coincidencia, consume enlace y pide iniciar sesión',async({page})=>{
 let body:unknown;await page.route('**/api/auth/password/reset',route=>{body=route.request().postDataJSON();return route.fulfill({json:{success:true,data:null}});});
 await page.goto('/restablecer-contrasena#token='+token);await expect(page).toHaveURL(/\/restablecer-contrasena$/);await page.getByLabel('Nueva contraseña',{exact:true}).fill('NewPassword123!');await page.getByLabel('Confirmar nueva contraseña').fill('OtherPassword123!');await page.getByRole('button',{name:'Guardar nueva contraseña'}).click();await expect(page.getByRole('alert')).toHaveText('Las contraseñas no coinciden.');expect(body).toBeUndefined();
 await page.getByLabel('Confirmar nueva contraseña').fill('NewPassword123!');await page.getByRole('button',{name:'Guardar nueva contraseña'}).click();await expect(page.getByText('Contraseña actualizada',{exact:true})).toBeVisible();expect(body).toEqual({token,password:'NewPassword123!'});
});
test('enlace ausente o caducado ofrece solicitar otro',async({page})=>{
 await page.goto('/restablecer-contrasena');await expect(page.getByRole('link',{name:'Solicitar otro enlace'})).toBeVisible();await page.route('**/api/auth/password/reset',route=>route.fulfill({status:400,json:{success:false,code:'RESET_LINK_INVALID',message:'Enlace caducado'}}));await page.goto('/restablecer-contrasena#token='+token);await page.getByLabel('Nueva contraseña',{exact:true}).fill('NewPassword123!');await page.getByLabel('Confirmar nueva contraseña').fill('NewPassword123!');await page.getByRole('button',{name:'Guardar nueva contraseña'}).click();await expect(page.getByRole('link',{name:'Solicitar otro enlace'})).toBeVisible();await expect(page.getByLabel('Nueva contraseña',{exact:true})).toHaveCount(0);
});

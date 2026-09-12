import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const methodology=JSON.parse(readFileSync(new URL('../../backend/src/domain/assessment-methodology.json',import.meta.url),'utf8'));
const user={id:7,firstName:'Ana',lastName:'Analista',email:'ana@example.test',active:true,roles:['ANALYST'],permissions:['signals:create','signals:read-internal','trends:create','trends:read-internal','alerts:create','alerts:read-internal']};
for(const [kind,route] of [['signal','senales'],['alert','alertas'],['trend','tendencias']] as const){
 test(`${kind}: valoración en overlay, cancelar, aplicar y reabrir`,async({page},info)=>{
  await page.addInitScript(()=>sessionStorage.setItem('observatorio.session.token','jwt-test'));
  await page.route(/^http:\/\/[^/]+\/api\//,async r=>{
   const url=new URL(r.request().url());let data:unknown;
   if(url.pathname==='/api/auth/me')data=user;
   else if(url.pathname.endsWith('/assessment-methodology'))data=methodology;
   else if(url.pathname.startsWith('/api/catalogs/'))data={name:'test',items:[]};
   else if(url.pathname==='/api/admin/sources')data=[{id:1,name:'Fuente',type:{name:'Informe'}}];
   else if(url.pathname==='/api/admin/actors')data=[];
   else data={items:[],pagination:{page:1,pageSize:100,totalItems:0,totalPages:0}};
   await r.fulfill({json:{success:true,message:'Datos',data}});
  });
  await page.goto(`/admin/${route}/nueva`);
  const title=page.getByLabel('Título',{exact:true});await title.fill('Texto conservado');
  await expect(page.getByLabel('Alcance',{exact:true})).toHaveCount(0);
  const trigger=page.getByRole('button',{name:'Capturar valoración'});await trigger.click();
  const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
  await dialog.press('Escape');await expect(dialog).toBeHidden();await expect(trigger).toBeFocused();await expect(title).toHaveValue('Texto conservado');
  await trigger.click();
  if(kind==='trend')await dialog.getByLabel('Naturaleza del cambio').selectOption('RADICAL');
  else {
   await dialog.getByRole('button',{name:'Aplicar valoración'}).click();await expect(dialog.getByRole('alert')).toBeVisible();
   for(const select of await dialog.locator('select').all())await select.selectOption((await select.getAttribute('id'))!.startsWith('reliability')?'YES':kind==='signal'?'2':'5');
  }
  await dialog.getByRole('button',{name:'Aplicar valoración'}).click();await expect(dialog).toBeHidden();
  const review=page.getByRole('button',{name:'Revisar valoración'});await review.click();
  const first=dialog.locator('select').first();await expect(first).toHaveValue(kind==='trend'?'RADICAL':kind==='signal'?'2':'5');
  await first.selectOption(kind==='trend'?'INCREMENTAL':'1');await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();
  await review.click();await expect(first).toHaveValue(kind==='trend'?'RADICAL':kind==='signal'?'2':'5');
  await expect.poll(()=>dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  await page.screenshot({path:info.outputPath(`${kind}-overlay.png`)});
 });
}

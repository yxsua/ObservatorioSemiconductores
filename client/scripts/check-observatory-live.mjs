import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';

const base=process.env.E2E_BASE_URL||'http://127.0.0.1:18080';
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch();
try {
  if(process.env.E2E_DATA_RUN_ID){
    const run=process.env.E2E_DATA_RUN_ID;
    if(!/^\d+$/.test(run))throw new Error('Identificador de prueba inválido.');
    const title=`Recurso de validación visual ${Date.now()}`;
    async function session(role){
      const response=await fetch(base+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:`${role}-${run}@example.test`,password:'Validation123!'})});
      assert.equal(response.status,200);const {data}=await response.json();const page=await browser.newPage();
      await page.addInitScript(token=>sessionStorage.setItem('observatorio.session.token',token),data.token);return page;
    }
    const editor=await session('editor');await editor.goto(base+'/admin/datos/resources/nuevo');
    await editor.getByLabel('Título',{exact:true}).fill(title);await editor.getByLabel('Descripción',{exact:true}).fill('Prueba integral desde el navegador.');
    await editor.getByLabel('Fuente o referencia bibliográfica').fill('Fuente de validación');await editor.getByLabel('Enlace',{exact:true}).fill('https://example.test/recurso');
    await editor.getByLabel('Formato',{exact:true}).fill('CSV');await editor.getByRole('button',{name:'Guardar borrador'}).click();
    await editor.waitForURL(/\/admin\/datos\/resources\/\d+$/);const adminUrl=editor.url();
    await editor.getByRole('button',{name:'Enviar a revisión'}).click();await editor.getByText('En revisión',{exact:true}).waitFor();await editor.close();
    const reviewer=await session('validator');await reviewer.goto(adminUrl);await reviewer.getByRole('button',{name:'Aprobar',exact:true}).click();await reviewer.getByText('Aprobado',{exact:true}).waitFor();await reviewer.close();
    const publisher=await session('publisher');await publisher.goto(adminUrl);await publisher.getByRole('button',{name:'Publicar',exact:true}).click();await publisher.getByText('Publicado',{exact:true}).waitFor();
    const publicPage=await browser.newPage();await publicPage.goto(base+'/buscador?q='+encodeURIComponent(title));await publicPage.getByRole('link',{name:title,exact:true}).waitFor();await publicPage.close();
    await publisher.getByRole('button',{name:'Archivar',exact:true}).click();await publisher.getByText('Archivado',{exact:true}).waitFor();await publisher.close();
    console.log('Flujo real de navegador: captura, revisión, publicación, búsqueda y archivo correctos.');
  }
  for(const [name,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]) {
    const page=await browser.newPage({viewport});const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('response',response=>{if(response.url().startsWith(base+'/api/')&&response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
    await page.goto(base+'/dashboard?period=2025');
    await page.getByRole('table').waitFor();
    assert.match(await page.getByRole('table').innerText(),/650 — 780/);
    await page.screenshot({path:`test-results/observatory-${name}.png`});
    await page.getByRole('combobox',{name:'Periodo',exact:true}).selectOption('2030');
    await page.getByRole('cell',{name:'869 — 1044',exact:true}).waitFor();
    await page.goto(base+'/buscador?q=Mercado&type=indicators');
    await page.getByRole('link',{name:'Mercado atendible (SAM) 2025',exact:true}).waitFor();
    await page.getByRole('link',{name:'Mercado atendible (SAM) 2025',exact:true}).click();
    await page.getByRole('heading',{level:1,name:'Mercado atendible (SAM) 2025'}).waitFor();
    assert.match(await page.locator('main').innerText(),/TecNM-ITQ/);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,'La ficha desborda horizontalmente.');
    assert.deepEqual(errors,[]);
    await page.close();
    console.log(`${name}: dashboard, periodo, búsqueda y ficha contra API real correctos.`);
  }
} finally {await browser.close();}

/* global document, innerWidth */
import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch();await mkdir('test-results',{recursive:true});
try{for(const [name,width]of [['desktop',1440],['mobile',390]]){const page=await browser.newPage({viewport:{width,height:900}});for(const [route,label]of [['registro','register'],['privacidad','privacy'],['recuperar-contrasena','recovery']]){await page.goto('http://127.0.0.1:18080/'+route);await page.getByRole('heading',{level:1}).waitFor();if(route==='recuperar-contrasena')await page.getByText('Recuperación por correo aún no disponible').waitFor();await page.screenshot({path:'test-results/'+label+'-'+name+'.png',fullPage:true});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow '+route+' '+name);}await page.close();}}finally{await browser.close();}


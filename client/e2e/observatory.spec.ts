import {expect,test} from '@playwright/test';
const indicator={id:77,kind:'indicators',title:'Mercado de prueba',summary:'Escenario de prueba',sourceName:'Informe de prueba',sourceUrl:null,asOf:'2026-09-10',responsible:'Equipo',validFrom:null,validUntil:null,tags:[],publishedAt:'2026-09-10T00:00:00Z',updatedAt:'2026-09-10T00:00:00Z',details:{series_code:'SAM',dimension:'ECONOMIC',period:2030,value:869,upper_value:1044,assessment:null,unit:'millones USD',nature:'PROJECTION',methodology:'Escenario base con supuestos explícitos.',geography:'Querétaro'}};
test('dashboard consulta periodos y ofrece tabla equivalente y descarga',async({page})=>{
 const requests:string[]=[];
 await page.route('**/api/dashboard**',route=>{requests.push(route.request().url());return route.fulfill({json:{success:true,data:{schemaVersion:1,period:null,periods:[2025,2030],updatedAt:'2026-09-10T00:00:00Z',methodology:'No se suman unidades diferentes.',counts:{indicators:1},observations:[indicator]}}});});
 await page.goto('/dashboard');await expect(page.getByRole('heading',{level:1,name:'Dashboard ejecutivo'})).toBeVisible();
 await expect(page.getByRole('img',{name:/869 a 1044 millones USD/})).toBeVisible();
 await expect(page.getByRole('table')).toContainText('Informe de prueba');await expect(page.getByRole('table')).toContainText('869 — 1044');
 await page.getByRole('combobox',{name:'Periodo',exact:true}).selectOption('2030');await expect(page).toHaveURL(/period=2030/);
 await expect.poll(()=>requests.some(url=>url.includes('period=2030'))).toBe(true);
 await expect(page.getByRole('link',{name:'Descargar tabla CSV'})).toHaveAttribute('href','/api/dashboard.csv?period=2030');
});
test('búsqueda unificada mantiene consulta y tipo en URL',async({page})=>{
 await page.route('**/api/search?**',route=>{const type=new URL(route.request().url()).searchParams.get('type');return route.fulfill({json:{success:true,data:{items:type==='alert'?[]:[{id:7,type:'signal',title:'Señal sobre litografía',summary:'Evidencia publicada',url:'/senales/7',date:'2026-09-10',tags:[]}],facets:{signal:1,alert:0},pagination:{page:1,pageSize:20,totalItems:type==='alert'?0:1,totalPages:type==='alert'?0:1}}}});});
 await page.goto('/buscador');await page.getByLabel('Tema o palabras clave').fill('litografía');await page.getByRole('button',{name:'Buscar',exact:true}).click();
 await expect(page.getByRole('link',{name:'Señal sobre litografía'})).toHaveAttribute('href','/senales/7');
 await page.getByLabel('Tipo de resultado').selectOption('alert');await expect(page).toHaveURL(/type=alert/);await expect(page.getByText('No hay resultados. Prueba otro término o amplía el periodo.')).toBeVisible();
});
test('una editora captura un recurso con trazabilidad y guarda como borrador',async({page})=>{
 await page.addInitScript(()=>sessionStorage.setItem('observatorio.session.token','data-editor'));
 await page.route('**/api/auth/me',route=>route.fulfill({json:{success:true,data:{id:5,firstName:'Elena',lastName:'Editora',email:'editor@example.test',roles:['EDITOR'],permissions:['data:read-internal','data:create','data:update','data:submit']}}}));
 for(const kind of ['signals','trends'])await page.route(`**/api/${kind}?**`,route=>route.fulfill({json:{success:true,data:{items:[],pagination:{page:1,pageSize:100,totalItems:0,totalPages:0}}}}));
 let saved:Record<string,unknown>|null=null;
 await page.route('**/api/admin/data/resources**',async route=>{
   if(route.request().method()==='POST'){saved=route.request().postDataJSON();return route.fulfill({status:201,json:{success:true,data:{...saved,id:88,kind:'resources',version:1,status:'DRAFT',createdBy:5,editedBy:5}}});}
   if(route.request().url().endsWith('/history'))return route.fulfill({json:{success:true,data:[]}});
   return route.fulfill({json:{success:true,data:{...saved,id:88,kind:'resources',version:1,status:'DRAFT',createdBy:5,editedBy:5}}});
 });
 await page.goto('/admin/datos/resources/nuevo');
 await page.getByLabel('Título',{exact:true}).fill('Base regional');await page.getByLabel('Descripción',{exact:true}).fill('Datos públicos de ejemplo');await page.getByLabel('Fuente o referencia bibliográfica').fill('Institución de prueba');
 await page.getByLabel('Enlace',{exact:true}).fill('https://example.test/datos');await page.getByLabel('Formato',{exact:true}).fill('CSV');await page.getByRole('button',{name:'Guardar borrador'}).click();
 await expect(page).toHaveURL(/\/admin\/datos\/resources\/88$/);expect(saved).toMatchObject({sourceName:'Institución de prueba',responsible:'Elena Editora',details:{url:'https://example.test/datos',format:'CSV'}});expect(saved).not.toHaveProperty('status');
 await expect(page.getByRole('button',{name:'Enviar a revisión'})).toBeVisible();await expect(page.getByRole('button',{name:'Aprobar',exact:true})).toHaveCount(0);
});

for(const [kind,path,details,fullText] of [
 ['indicators','indicadores-pertinencia',indicator.details,indicator.details.methodology],
 ['ecosystem','ecosistema-regional',{actor_type:'RESEARCH',location:'Querétaro',website:null,capabilities:'Caracterización y diseño de dispositivos',value_chain_stage:'Investigación'},'Caracterización y diseño de dispositivos'],
 ['investments','inversiones',{organization:'Organización de prueba',location:'Querétaro',stage:'ANNOUNCED',amount:20,currency:'USD',announced_on:null,jobs:null},'Organización de prueba']
] as const)test('fichas compactas de '+kind+' conservan el overlay y restauran el foco',async({page})=>{
 const record={...indicator,kind,details,mediaIds:[],signalIds:[9],trendIds:[]};
 await page.route('**/api/data/'+kind+'**',async route=>{
  const detail=route.request().url().includes('/77');
  if(detail)await new Promise(resolve=>setTimeout(resolve,150));
  await route.fulfill({json:{success:true,data:detail?record:{items:[record],pagination:{page:1,totalItems:1,totalPages:1,pageSize:20}}}});
 });
 await page.goto('/'+path);await expect(page.getByText(fullText,{exact:true})).toHaveCount(0);
 const more=page.getByRole('button',{name:'Ver más sobre Mercado de prueba'});await more.click();
 const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();await expect(dialog.getByText(fullText,{exact:true})).toBeVisible();await expect(dialog.getByRole('link',{name:'Consultar señal #9'})).toBeVisible();
 await expect(page.locator('body')).toHaveCSS('overflow','hidden');
 await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(more).toBeFocused();await expect(page.locator('body')).not.toHaveCSS('overflow','hidden');
 await more.click();await expect(dialog.getByText(fullText,{exact:true})).toBeVisible();await page.getByRole('button',{name:'Cerrar',exact:true}).click();await expect(dialog).toHaveCount(0);await expect(more).toBeFocused();
});
test('portada muestra cinco integrantes y permite recorrer los logos',async({page})=>{
 await page.goto('/');await expect(page.getByRole('img',{name:/Fotografía pendiente del integrante/})).toHaveCount(5);
 await expect(page.getByText('Institución 01',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Logos siguientes'}).click();await expect(page.getByText('Institución 05',{exact:true})).toBeVisible();await expect(page.getByText('Institución 01',{exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Logos anteriores'}).click();await expect(page.getByText('Institución 01',{exact:true})).toBeVisible();
 const logo=page.getByRole('img',{name:'Observatorio de Semiconductores de Querétaro',exact:true});await expect(logo).toHaveCSS('object-fit','contain');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('foto del evento aparece en listado y ficha pública',async({page})=>{
 const record={...indicator,id:78,kind:'events',title:'Foro regional',photo:{id:5,url:'/event-test.svg',altText:'Auditorio del foro'},details:{starts_at:'2026-10-10T10:00:00Z',ends_at:'2026-10-10T14:00:00Z',organizer:'Equipo',location:'Querétaro',registration_url:null,photo_media_id:5},mediaIds:[],signalIds:[],trendIds:[]};
 await page.route('**/event-test.svg',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="blue"/></svg>'}));
 await page.route('**/api/data/events**',route=>route.fulfill({json:{success:true,data:route.request().url().includes('/78')?record:{items:[record],pagination:{page:1,totalItems:1,totalPages:1,pageSize:20}}}}));
 await page.goto('/eventos');await expect(page.getByRole('img',{name:'Auditorio del foro'})).toBeVisible();await page.getByRole('link',{name:'Foro regional'}).click();await expect(page.getByRole('img',{name:'Auditorio del foro'})).toBeVisible();
});

test('editor selecciona y quita la foto del evento desde la biblioteca',async({page})=>{
 await page.addInitScript(()=>sessionStorage.setItem('observatorio.session.token','data-editor'));
 await page.route('**/api/auth/me',route=>route.fulfill({json:{success:true,data:{id:5,firstName:'Elena',lastName:'Editora',roles:['EDITOR'],permissions:['data:read-internal','data:create','media:read-internal']}}}));
 for(const kind of ['signals','trends'])await page.route(`**/api/${kind}?**`,route=>route.fulfill({json:{success:true,data:{items:[],pagination:{page:1,totalItems:0,totalPages:0}}}}));
 await page.route('**/api/admin/media?**',route=>route.fulfill({json:{success:true,data:{items:[{id:5,kind:'image',title:'Auditorio',altText:'Foto elegida',isPublic:true,url:'/event-test.svg'}],pagination:{page:1,totalItems:1,totalPages:1}}}}));
 await page.route('**/event-test.svg',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"/>'}));
 let saved:Record<string,unknown>|null=null;
 await page.route('**/api/admin/data/events',route=>{saved=route.request().postDataJSON();return route.fulfill({status:422,json:{success:false,message:'Fin de prueba',error:{code:'DOMAIN_RULE_ERROR',message:'Fin de prueba',details:[]}}});});
 await page.goto('/admin/datos/events/nuevo');await page.getByRole('button',{name:'Escoger foto'}).click();await page.getByRole('button',{name:'Seleccionar',exact:true}).click();await expect(page.getByRole('img',{name:'Foto elegida'})).toBeVisible();
 await page.getByRole('button',{name:'Quitar foto'}).click();await expect(page.getByRole('img',{name:'Foto elegida'})).toHaveCount(0);
 await page.getByRole('button',{name:'Escoger foto'}).click();await page.getByRole('button',{name:'Seleccionar',exact:true}).click();
 await page.getByLabel('Título',{exact:true}).fill('Foro');await page.getByLabel('Descripción',{exact:true}).fill('Encuentro regional');await page.getByLabel('Fuente o referencia bibliográfica').fill('Organizador');
 await page.locator('input[type="datetime-local"]').nth(0).fill('2026-10-10T10:00');await page.locator('input[type="datetime-local"]').nth(1).fill('2026-10-10T14:00');
 await page.getByLabel('Organizador',{exact:true}).fill('Equipo');await page.getByLabel('Lugar o modalidad',{exact:true}).fill('Querétaro');await page.getByRole('button',{name:'Guardar borrador'}).click();await expect.poll(()=>saved).toMatchObject({details:{photo_media_id:5}});
});



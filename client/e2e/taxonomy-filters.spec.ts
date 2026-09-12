import {test,expect} from '@playwright/test';
for(const route of ['senales','noticias','contenido']) {
 test(`${route}: selección compacta y overlays relacionados`,async({page},info)=>{
  await page.route(/^http:\/\/[^/]+\/api\//,async r=>{
   const url=new URL(r.request().url());
   const data=url.pathname.startsWith('/api/catalogs/')?{name:'test',items:url.pathname.endsWith('/categories')?[{idCategory:1,name:'Nodos',fcvCode:'TEC'},{idCategory:2,name:'Ciclos',fcvCode:'MER'}]:url.pathname.endsWith('/fcv')?[{code:'TEC',name:'Tecnología'},{code:'MER',name:'Mercado'}]:[]}:{items:[],pagination:{page:1,pageSize:12,totalItems:0,totalPages:0}};
   await r.fulfill({json:{success:true,message:'Datos',data}});
  });
  await page.goto(`/${route}`);
  const factors=page.getByRole('button',{name:/Seleccionar factores/});
  await factors.click();
  const dialog=page.getByRole('dialog');
  await dialog.getByLabel('Tecnología').check();
  await dialog.getByLabel('Mercado').check();
  await page.screenshot({path:info.outputPath('factores.png')});
  await dialog.press('Escape');
  await expect(factors).toBeFocused();
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await page.getByText('Filtros avanzados',{exact:true}).click();
  const categories=page.getByRole('button',{name:/Seleccionar categorías/});
  await categories.click();
  await dialog.getByLabel('Nodos').check();
  await dialog.getByLabel('Ciclos').check();
  await dialog.getByRole('button',{name:'Listo',exact:true}).click();
  await factors.click();
  await dialog.getByLabel('Tecnología').uncheck();
  await dialog.getByRole('button',{name:'Listo',exact:true}).click();
  await categories.click();
  await expect(dialog.getByLabel('Nodos')).toHaveCount(0);
  await expect(dialog.getByLabel('Ciclos')).toBeChecked();
  await dialog.getByRole('button',{name:'Listo',exact:true}).click();
  await page.getByRole('button',{name:'Aplicar filtros',exact:true}).click();
  await expect(page).toHaveURL(/fcvCodes=MER/);
  await expect(page).toHaveURL(/categoryIds=2/);
  await page.reload();
  await expect(factors).toContainText('(1)');
  await page.getByText('Filtros avanzados',{exact:true}).click();
  await expect(categories).toContainText('(1)');
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.screenshot({path:info.outputPath('filtros.png'),fullPage:true});
 });
}

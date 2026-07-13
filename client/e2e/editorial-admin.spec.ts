import { expect,test } from "@playwright/test";

const editor={id:12,firstName:"Elena",lastName:"Editora",email:"editor@example.test",active:true,roles:["EDITOR"],permissions:["content:read-internal","content:create","content:update","content:submit"]};
const version={id:51,number:1,title:"Panorama regional",summary:"Capacidades y brechas.",featuredMediaId:null,changeSummary:null,createdBy:{id:12,name:"Elena Editora"},createdAt:"2026-07-13T12:00:00Z",approvedBy:null,approvedAt:null,publishedBy:null,publishedAt:null,isCurrent:true,isPublished:false,sections:[],relations:{categories:[],signals:[],trends:[],alerts:[]}};
const content={id:31,slug:"panorama-regional",type:{code:"REPORT",name:"Reporte"},status:{code:"DRAFT",name:"Borrador"},title:"Panorama regional",summary:"Capacidades y brechas.",featuredMedia:null,author:{id:12,name:"Elena Editora"},currentVersionId:51,publishedVersionId:null,currentVersionNumber:1,approval:null,publication:null,archive:null,metrics:{versionCount:1,sectionCount:0,blockCount:0},currentVersion:version,createdAt:"2026-07-13T12:00:00Z",updatedAt:"2026-07-13T12:00:00Z"};

test("una editora crea contenido desde una plantilla compatible",async({page})=>{
  await page.addInitScript(()=>sessionStorage.setItem("observatorio.session.token","jwt-editor"));
  let body:Record<string,unknown>|undefined;
  await page.route("**/api/auth/me",(route)=>route.fulfill({json:{success:true,message:"Perfil",data:editor}}));
  await page.route("**/api/catalogs/content-types",(route)=>route.fulfill({json:{success:true,message:"Tipos",data:{name:"content-types",items:[{code:"REPORT",name:"Reporte"}]}}}));
  await page.route("**/api/admin/content**",async(route)=>{
    const url=new URL(route.request().url());
    if(route.request().method()==="POST"&&url.pathname==="/api/admin/content"){body=route.request().postDataJSON();await route.fulfill({status:201,json:{success:true,message:"Creado",data:content}});return}
    if(url.pathname.endsWith("/versions")){await route.fulfill({json:{success:true,message:"Versiones",data:[]}});return}
    if(url.pathname.endsWith("/history")){await route.fulfill({json:{success:true,message:"Historial",data:[]}});return}
    if(url.pathname.endsWith("/31")){await route.fulfill({json:{success:true,message:"Detalle",data:content}});return}
    await route.fulfill({json:{success:true,message:"Listado",data:{items:[content],pagination:{page:1,pageSize:20,totalItems:1,totalPages:1}}}})
  });
  // Playwright prioriza la última ruta registrada; esta debe ganar al comodín anterior.
  await page.route("**/api/admin/content-templates",(route)=>route.fulfill({json:{success:true,message:"Plantillas",data:[{id:4,name:"Reporte base",description:null,type:{code:"REPORT",name:"Reporte"},sectionCount:3}]}}));
  await page.goto("/admin/contenido/nuevo");
  await page.getByLabel("Tipo").selectOption("REPORT");
  await page.getByLabel("Slug público").fill("panorama-regional");
  await page.getByLabel("Título").fill("Panorama regional");
  await page.getByLabel("Resumen").fill("Capacidades y brechas.");
  await page.getByLabel("Plantilla inicial").selectOption("4");
  await page.getByRole("button",{name:"Crear contenido"}).click();
  await expect(page).toHaveURL(/\/admin\/contenido\/31$/);
  await expect(page.getByRole("heading",{name:"Panorama regional"})).toBeVisible();
  expect(body).toMatchObject({typeCode:"REPORT",slug:"panorama-regional",templateId:4});
});

test("una editora compone y guarda la versión de trabajo",async({page})=>{
  await page.addInitScript(()=>sessionStorage.setItem("observatorio.session.token","jwt-editor"));
  let composition:Record<string,unknown>|undefined;
  await page.route("**/api/auth/me",(route)=>route.fulfill({json:{success:true,message:"Perfil",data:editor}}));
  await page.route("**/api/catalogs/*",(route)=>{
    const catalog=new URL(route.request().url()).pathname.split("/").at(-1);
    const items=catalog==="section-types"?[{code:"custom",name:"Libre"}]:catalog==="categories"?[{idCategory:4,name:"Mercado"}]:[];
    return route.fulfill({json:{success:true,message:"Catálogo",data:{name:catalog,items}}});
  });
  await page.route(/\/api\/admin\/(signals|trends|alerts)(\?|$)/,(route)=>route.fulfill({json:{success:true,message:"Listado",data:{items:[],pagination:{page:1,pageSize:100,totalItems:0,totalPages:0}}}}));
  await page.route("**/api/admin/editorial/block-types",(route)=>route.fulfill({json:{success:true,message:"Bloques",data:[{code:"paragraph",name:"Párrafo",description:"Texto corrido",category:"text",schemaVersion:1}]}}));
  await page.route("**/api/admin/content/31**",async(route)=>{
    const url=new URL(route.request().url());
    if(route.request().method()==="PUT"&&url.pathname.endsWith("/versions/51/composition")){
      composition=route.request().postDataJSON();
      await route.fulfill({json:{success:true,message:"Composición guardada",data:version}});
      return;
    }
    await route.fulfill({json:{success:true,message:"Detalle",data:content}});
  });

  await page.goto("/admin/contenido/31/composicion");
  await expect(page.getByRole("heading",{name:"Constructor de composición"})).toBeVisible();
  await page.getByRole("button",{name:"Agregar sección"}).click();
  await page.getByRole("button",{name:"+ Párrafo"}).click();
  await page.locator("article article textarea").first().fill("La capacidad regional continúa creciendo.");
  await expect(page.getByText("Cambios sin guardar")).toBeVisible();
  await page.getByRole("button",{name:"Guardar composición"}).click();
  await expect.poll(()=>composition).toBeTruthy();
  expect(composition).toMatchObject({
    updatedAt:content.updatedAt,
    sections:[{typeCode:"custom",blocks:[{type:"paragraph",data:{text:"La capacidad regional continúa creciendo."}}]}],
    relations:{categoryIds:[],signalIds:[],trendIds:[],alertIds:[]},
  });
});

test("un publicador revisa el checklist y confirma la publicación",async({page})=>{
  const publisher={...editor,id:21,email:"validator@validator.com",roles:["VALIDATOR","PUBLISHER"],permissions:["content:read-internal","content:update","content:approve","content:publish","content:archive"]};
  const paragraph={id:81,type:{code:"paragraph",name:"Párrafo"},schemaVersion:1,position:1,data:{text:"Contenido del boletín",format:"plain"},settings:{},isVisible:true,cssClass:null,createdAt:content.createdAt,updatedAt:content.updatedAt};
  const reviewVersion={...version,sections:[{id:71,type:{code:"custom",name:"Libre"},title:"Resumen",position:1,isCollapsible:false,isVisible:true,settings:{},blocks:[paragraph]}]};
  let status={code:"APPROVED",name:"Aprobado"};let transitionBody:Record<string,unknown>|undefined;
  const reviewed=()=>({...content,status,currentVersion:reviewVersion,currentVersionId:reviewVersion.id,metrics:{...content.metrics,sectionCount:1,blockCount:1}});
  await page.addInitScript(()=>sessionStorage.setItem("observatorio.session.token","jwt-publisher"));
  await page.route("**/api/auth/me",(route)=>route.fulfill({json:{success:true,message:"Perfil",data:publisher}}));
  await page.route("**/api/admin/content/31**",async(route)=>{
    const path=new URL(route.request().url()).pathname;
    if(route.request().method()==="POST"&&path.endsWith("/transitions")){transitionBody=route.request().postDataJSON();status={code:"PUBLISHED",name:"Publicado"};await route.fulfill({json:{success:true,message:"Publicado",data:reviewed()}});return}
    if(path.endsWith("/preview")){await route.fulfill({json:{success:true,message:"Preview",data:{id:31,slug:content.slug,type:content.type,status,version:reviewVersion,preview:true}}});return}
    await route.fulfill({json:{success:true,message:"Detalle",data:reviewed()}});
  });
  await page.route("**/api/admin/editorial/block-types",(route)=>route.fulfill({json:{success:true,message:"Bloques",data:[{code:"paragraph",name:"Párrafo",category:"text",schemaVersion:1,supportsChildren:false,publicAllowed:true,dataContract:{},settingsContract:{}}]}}));
  await page.goto("/admin/contenido/31/preview");
  await expect(page.getByRole("heading",{name:"Revisión editorial"})).toBeVisible();
  await expect(page.getByText("Todos los bloques visibles son publicables y usan el esquema vigente")).toBeVisible();
  await page.getByRole("button",{name:"Publicar",exact:true}).click();
  await expect(page.getByRole("alertdialog")).toContainText("Sustituye la versión pública vigente");
  await page.getByRole("button",{name:"Confirmar publicar"}).click();
  await expect.poll(()=>transitionBody).toEqual({transition:"PUBLISH",notes:null});
});

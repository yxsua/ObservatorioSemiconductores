import { describe,expect,it } from "vitest";
import type { BlockDescriptor,ContentVersion,InternalContent } from "./editorial.types";
import { publicationReadiness,versionComparison } from "./editorial-readiness";

const descriptor={code:"paragraph",name:"Párrafo",category:"text",schemaVersion:1,supportsChildren:false,publicAllowed:true,dataContract:{},settingsContract:{}} as BlockDescriptor;
const version={title:"Boletín",summary:"Resumen",sections:[{isVisible:true,blocks:[{isVisible:true,type:{code:"paragraph"},schemaVersion:1}]}],relations:{signals:[],trends:[],alerts:[],categories:[]}} as unknown as ContentVersion;
const content={slug:"boletin",currentVersion:version} as unknown as InternalContent;

describe("preparación editorial",()=>{
  it("aprueba una composición publicable",()=>expect(publicationReadiness(content,version,[descriptor]).every((check)=>check.passed)).toBe(true));
  it("bloquea contratos desactualizados y registra recomendaciones no bloqueantes",()=>{const stale={...version,summary:null,sections:[{...version.sections[0],blocks:[{...version.sections[0].blocks[0],schemaVersion:2}]}]} as ContentVersion;const checks=publicationReadiness(content,stale,[descriptor]);expect(checks.find((v)=>v.code==="contracts")).toMatchObject({passed:false,blocking:true});expect(checks.find((v)=>v.code==="summary")).toMatchObject({passed:false,blocking:false})});
  it("compara métricas y metadatos entre versiones",()=>{const published={...version,title:"Anterior",sections:[]} as ContentVersion;expect(versionComparison(version,published)).toEqual({current:{sections:1,blocks:1,relations:0},published:{sections:0,blocks:0,relations:0},titleChanged:true,summaryChanged:false})});
});

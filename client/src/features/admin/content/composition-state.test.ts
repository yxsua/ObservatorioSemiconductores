import { describe,expect,it } from "vitest";
import type { ContentVersion } from "./editorial.types";
import { defaultData,fromVersion,move,newBlock,newSection,toComposition } from "./composition-state";

describe("estado del constructor editorial",()=>{
  it("hidrata una versión y genera el reemplazo completo con control de concurrencia",()=>{
    const version={
      sections:[{type:{code:"body",name:"Cuerpo"},title:"Hallazgos",isCollapsible:false,isVisible:true,settings:{},blocks:[{type:{code:"paragraph",name:"Párrafo"},schemaVersion:1,data:{text:"Contenido"},settings:{},isVisible:true,cssClass:null}]}],
      relations:{categories:[{id:4,name:"Mercado"}],signals:[{id:7,businessCode:"SIG-7",title:"Señal"}],trends:[],alerts:[]},
    } as unknown as ContentVersion;

    const state=fromVersion(version);
    expect(state.sections[0].blocks[0].data).toEqual({text:"Contenido"});
    expect(state.relations).toEqual({categoryIds:[4],signalIds:[7],trendIds:[],alertIds:[]});
    expect(toComposition(state,"2026-07-13T12:00:00.000Z")).toMatchObject({
      updatedAt:"2026-07-13T12:00:00.000Z",
      sections:[{typeCode:"body",title:"Hallazgos",blocks:[{type:"paragraph",data:{text:"Contenido"}}]}],
    });
  });

  it("crea estructuras iniciales válidas para los trece tipos de bloque",()=>{
    const types=["heading","paragraph","quote","list","callout","divider","image","file","table","chart","signal","trend","alert"];
    expect(types.map((type)=>newBlock(type).type)).toEqual(types);
    expect(defaultData("chart")).toMatchObject({chartType:"bar"});
    expect(defaultData("signal")).toMatchObject({entityId:1,variant:"card"});
    expect(newSection("body")).toMatchObject({typeCode:"body",blocks:[],isVisible:true});
  });

  it("reordena sin mutar y conserva el arreglo en los límites",()=>{
    const original=["a","b","c"];
    expect(move(original,1,-1)).toEqual(["b","a","c"]);
    expect(original).toEqual(["a","b","c"]);
    expect(move(original,0,-1)).toBe(original);
  });
});

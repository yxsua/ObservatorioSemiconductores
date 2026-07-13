import { describe,expect,it } from "vitest";
import { parseContentFilters } from "./editorial-filters";

describe("filtros editoriales internos",()=>{
  it("normaliza estado, tipo y paginación",()=>{expect(parseContentFilters(new URLSearchParams("page=3&status=draft&type=news&search=chips"))).toEqual({page:3,pageSize:20,status:"DRAFT",type:"NEWS",search:"chips",sort:"-updatedAt"})});
  it("descarta búsqueda corta, página y estado desconocido",()=>{expect(parseContentFilters(new URLSearchParams("page=0&status=other&search=x"))).toEqual({page:1,pageSize:20,status:undefined,type:undefined,search:undefined,sort:"-updatedAt"})});
});

import { apiRequest } from "@/api";
import type { components } from "@/api/schema";
import type { AdminDetailResponse } from "../types";
import type { AlertFormOptions, Option } from "./alert-form.types";

type CreateInput = Omit<components["schemas"]["CreateAlertInput"],"levelCode"> & {assessment:import("@/features/assessment/assessment").AlertAssessment};
type UpdateInput = Omit<components["schemas"]["UpdateAlertInput"],"levelCode"> & {assessment?:import("@/features/assessment/assessment").AlertAssessment};
interface CatalogResponse { success: true; data: { items: Array<{ code: string; name: string }> } }
interface EntityListResponse { success: true; data: { items: Array<{ id: number; businessCode: string; title: string }> } }

const catalogOptions = (items: Array<{code:string;name:string}>): Option[] => items.map((item)=>({value:item.code,label:item.name}));
const entityOptions = (items: Array<{id:number;businessCode:string;title:string}>): Option[] => items.map((item)=>({value:String(item.id),label:`${item.businessCode} · ${item.title}`}));
export async function getAlertFormOptions(token:string, signal?:AbortSignal):Promise<AlertFormOptions>{
  const catalog=(name:string)=>apiRequest<CatalogResponse>(`/catalogs/${name}`,{signal});
  const list=(kind:"signals"|"trends",status:string)=>apiRequest<EntityListResponse>(`/admin/${kind}`,{query:{page:1,pageSize:100,status,sort:"-updatedAt"},signal,token});
  const [levels,audiences,signals,validatedTrends,activeTrends]=await Promise.all([catalog("alert-levels"),catalog("audiences"),list("signals","VALIDATED"),list("trends","VALIDATED"),list("trends","ACTIVE")]);
  const trendMap=new Map([...validatedTrends.data.items,...activeTrends.data.items].map((item)=>[item.id,item]));
  return {levels:catalogOptions(levels.data.items),audiences:catalogOptions(audiences.data.items),signals:entityOptions(signals.data.items),trends:entityOptions([...trendMap.values()])};
}
export const createAlert=(input:CreateInput,token:string)=>apiRequest<AdminDetailResponse>("/admin/alerts",{method:"POST",body:input,token});
export const updateAlert=(id:number,input:UpdateInput,token:string)=>apiRequest<AdminDetailResponse>(`/admin/alerts/${id}`,{method:"PATCH",body:input,token});
export const linkAlertIds=(id:number,relation:"signals"|"trends",ids:number[],token:string)=>ids.length?apiRequest<AdminDetailResponse>(`/admin/alerts/${id}/${relation}`,{method:"POST",body:{ids},token}):Promise.resolve(null);
export const linkAlertAudiences=(id:number,codes:string[],token:string)=>codes.length?apiRequest<AdminDetailResponse>(`/admin/alerts/${id}/audiences`,{method:"POST",body:{codes},token}):Promise.resolve(null);
export const unlinkAlertRelation=(id:number,relation:"signals"|"trends"|"audiences",value:number|string,token:string)=>apiRequest<AdminDetailResponse>(`/admin/alerts/${id}/${relation}/${encodeURIComponent(String(value))}`,{method:"DELETE",token});

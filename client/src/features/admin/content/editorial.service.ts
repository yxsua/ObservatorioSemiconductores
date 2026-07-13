import { ApiError,apiRequest } from "@/api";
import type { components } from "@/api/schema";
import type { BlockTypesResponse,BuilderOption,ContentFilters,ContentListResponse,ContentResponse,HistoryResponse,PreviewResponse,TemplatesResponse,VersionResponse,VersionsResponse } from "./editorial.types";

type CreateInput=components["schemas"]["CreateContentInput"];
type UpdateInput=components["schemas"]["UpdateContentInput"];
export const listInternalContent=(query:ContentFilters,token:string,signal?:AbortSignal)=>apiRequest<ContentListResponse>("/admin/content",{query,token,signal});
export const getInternalContent=(id:number,token:string,signal?:AbortSignal)=>apiRequest<ContentResponse>(`/admin/content/${id}`,{token,signal});
export const createInternalContent=(input:CreateInput,token:string)=>apiRequest<ContentResponse>("/admin/content",{method:"POST",body:input,token});
export const updateInternalContent=(id:number,input:UpdateInput,token:string)=>apiRequest<ContentResponse>(`/admin/content/${id}`,{method:"PATCH",body:input,token});
export const listContentVersions=(id:number,token:string,signal?:AbortSignal)=>apiRequest<VersionsResponse>(`/admin/content/${id}/versions`,{token,signal});
export const getContentVersion=(contentId:number,versionId:number,token:string,signal?:AbortSignal)=>apiRequest<VersionResponse>(`/admin/content/${contentId}/versions/${versionId}`,{token,signal});
export const createContentVersion=(id:number,changeSummary:string,token:string)=>apiRequest<VersionResponse>(`/admin/content/${id}/versions`,{method:"POST",body:{changeSummary},token});
export const getContentHistory=(id:number,token:string,signal?:AbortSignal)=>apiRequest<HistoryResponse>(`/admin/content/${id}/history`,{token,signal});
export const getContentPreview=(id:number,token:string,signal?:AbortSignal)=>apiRequest<PreviewResponse>(`/admin/content/${id}/preview`,{token,signal});
export async function listContentTemplates(token:string,signal?:AbortSignal){const response=await apiRequest<TemplatesResponse>("/admin/content-templates",{token,signal});if(!Array.isArray(response.data))throw new ApiError("La API no devolvió una lista de plantillas válida.",{status:502,code:"INVALID_RESPONSE"});return response}
export const transitionContent=(id:number,transition:string,notes:string|null,token:string)=>apiRequest<ContentResponse>(`/admin/content/${id}/transitions`,{method:"POST",body:{transition,notes},token});
export const listEditorialBlockTypes=(token:string,signal?:AbortSignal)=>apiRequest<BlockTypesResponse>("/admin/editorial/block-types",{token,signal});
export const replaceContentComposition=(contentId:number,versionId:number,body:unknown,token:string)=>apiRequest<VersionResponse>(`/admin/content/${contentId}/versions/${versionId}/composition`,{method:"PUT",body,token});

interface EntityList {success:true;data:{items:Array<{id:number;businessCode:string;title:string}>}}
export async function getBuilderEntityOptions(token:string,signal?:AbortSignal){const list=(kind:string,status:string)=>apiRequest<EntityList>(`/admin/${kind}`,{query:{page:1,pageSize:100,status,sort:"-updatedAt"},token,signal});const [signals,trends,alerts,pastAlerts]=await Promise.all([list("signals","VALIDATED"),list("trends","ACTIVE"),list("alerts","PUBLISHED"),list("alerts","CLOSED")]);const map=(items:EntityList["data"]["items"]):BuilderOption[]=>items.map((v)=>({value:v.id,label:`${v.businessCode} · ${v.title}`}));const alertMap=new Map([...alerts.data.items,...pastAlerts.data.items].map((v)=>[v.id,v]));return {signals:map(signals.data.items),trends:map(trends.data.items),alerts:map([...alertMap.values()])}}

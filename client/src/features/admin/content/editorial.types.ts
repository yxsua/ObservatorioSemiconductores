import type { components } from "@/api/schema";
import type { Pagination, QueryParams } from "@/api";

export type InternalContent = components["schemas"]["InternalContent"];
export type ContentVersion = components["schemas"]["ContentVersion"];
export type ContentVersionSummary = components["schemas"]["ContentVersionSummary"];
export type ContentHistoryEntry = components["schemas"]["ContentHistoryEntry"];
export type ContentTemplateSummary = components["schemas"]["ContentTemplateSummary"];
export interface ContentFilters extends QueryParams { page:number;pageSize:number;search?:string;status?:string;type?:string;sort:string }
export interface ContentListResponse { success:true;message:string;data:{items:InternalContent[];pagination:Pagination} }
export interface ContentResponse { success:true;message:string;data:InternalContent }
export interface VersionsResponse { success:true;message:string;data:ContentVersionSummary[] }
export interface VersionResponse { success:true;message:string;data:ContentVersion }
export interface HistoryResponse { success:true;message:string;data:ContentHistoryEntry[] }
export interface TemplatesResponse { success:true;message:string;data:ContentTemplateSummary[] }
export interface PreviewResponse { success:true;message:string;data:{id:number;slug?:string|null;type:{code:string;name:string};status:{code:string;name:string};version:ContentVersion;preview:true} }
export type BlockDescriptor=Omit<components["schemas"]["EditorialBlockType"],"code">&{code:string};
export interface BlockTypesResponse { success:true;message:string;data:BlockDescriptor[] }
export interface BuilderOption { value:number;label:string }
